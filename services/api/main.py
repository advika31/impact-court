"""Impact Court API: synchronous MVP endpoints plus tracked background jobs."""
import hashlib, math, os, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from services.api.db import get_db, init_db, SessionLocal
from services.api import models, cloudinary_utils, vision
from services.api.reporting import create_claim_report
from packages.ledger.ledger import build_certificate, verify_certificate, sha256_json

from services.api.db import get_db, init_db
from services.api import models
from services.api import cloudinary_utils
from packages.vision import vision as vision_stub

from packages.ledger.ledger import generate_keypair, build_certificate, verify_certificate
from packages.forensics.forensics import analyze_asset, find_duplicate_candidates
from packages.claims.claims import decompose, score_subclaim, apply_hard_fail, overall_verdict

app=FastAPI(title="Impact Court API")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
REPORT_DIR=Path(os.getenv("REPORT_DIR","reports"))

@app.on_event("startup")
def on_startup():
 init_db()
 db=SessionLocal()
 try:
  db.query(models.Job).filter(models.Job.status.in_(["queued","running"])).update({models.Job.status:"failed",models.Job.error:"API restarted before in-process job completed"},synchronize_session=False);db.commit()
 finally:db.close()
@app.get("/health")
def health():return {"status":"ok"}
class ProjectIn(BaseModel):
 name:str;site_lat:float;site_lng:float;site_radius_km:float=2.;window_start:str;window_end:str
class IngestIn(BaseModel):project_id:str;public_id:str;resource_type:str="image"
class ClaimIn(BaseModel):project_id:str;text:str
class CompareIn(BaseModel):before_asset_id:str;after_asset_id:str
class ReportIn(BaseModel):claim_id:str

# Append-only database hash chain, including data/model/transformation/verdict events.
def _append_ledger(db,kind,payload):
 db.execute(text("SELECT pg_advisory_xact_lock(74198231)"))
 last=db.query(models.LedgerEntryRow).order_by(models.LedgerEntryRow.created_at.desc(),models.LedgerEntryRow.id.desc()).first()
 prev=last.entry_hash if last else "0"*64;payload_hash=sha256_json(payload);created=datetime.now(timezone.utc).replace(tzinfo=None)
 if last and created<=last.created_at:created=last.created_at+timedelta(microseconds=1)
 entry_hash=sha256_json({"kind":kind,"payload_hash":payload_hash,"prev_hash":prev,"created_at":created.replace(tzinfo=timezone.utc).timestamp()})
 row=models.LedgerEntryRow(kind=kind,payload_hash=payload_hash,prev_hash=prev,entry_hash=entry_hash,created_at=created);db.add(row);db.flush();return row
@app.get("/api/ledger/verify")
def verify_ledger(db:Session=Depends(get_db)):
 rows=db.query(models.LedgerEntryRow).order_by(models.LedgerEntryRow.created_at,models.LedgerEntryRow.id).all();prev="0"*64;fail=[]
 for r in rows:
  expected=sha256_json({"kind":r.kind,"payload_hash":r.payload_hash,"prev_hash":r.prev_hash,"created_at":r.created_at.replace(tzinfo=timezone.utc).timestamp()})
  if r.prev_hash!=prev:fail.append(f"entry {r.id} does not link to previous entry")
  if r.entry_hash!=expected:fail.append(f"entry {r.id} hash is invalid")
  prev=r.entry_hash
 return {"valid":not fail,"entries":len(rows),"failures":fail}

@app.post("/api/projects")
def create_project(body:ProjectIn,db:Session=Depends(get_db)):
 p=models.Project(**body.model_dump());db.add(p);db.commit();db.refresh(p);return p
@app.get("/api/projects/{project_id}")
def get_project(project_id:str,db:Session=Depends(get_db)):
 p=db.get(models.Project,project_id)
 if not p:raise HTTPException(404,"project not found")
 return p
@app.get("/api/upload-signature")
def upload_signature(project_id:str):return cloudinary_utils.make_upload_signature(f"impact-court/{project_id}")

def _perform_ingest(body,db):
 if body.resource_type!="image":raise ValueError("Image assets only are supported by current forensic/vision pipeline")
 p=db.get(models.Project,body.project_id)
 if not p:raise ValueError("project not found")
 b=cloudinary_utils.fetch_asset_bytes(body.public_id,body.resource_type);digest=hashlib.sha256(b).hexdigest()
 f=analyze_asset(b,{"lat":p.site_lat,"lng":p.site_lng,"radius_km":p.site_radius_km},{"start":p.window_start,"end":p.window_end})
 existing=[{"asset_id":a.id,"project_id":a.project_id,"phash":a.phash} for a in db.query(models.Asset).filter(models.Asset.phash.isnot(None)).all()]
 f["duplicates"]=find_duplicate_candidates(f["phash"],existing)
 if any(d["project_id"]!=p.id for d in f["duplicates"]):f["flags"].append("reused_from_other_project");f["hard_fail"]=True
 try:embedding=vision.embed_image(b);embedding_error=None
 except Exception as exc:embedding=None;embedding_error=str(exc)
 try:analysis=vision.analyze_image(b,"sapling")
 except Exception as exc:analysis={"available":False,"error":str(exc),"activity":None,"activity_confidence":None,"object_count":None,"count_confidence":None,"class_percentages":None,"description":None}
 if embedding_error:analysis["embedding_error"]=embedding_error
 label=analysis.get("activity") or "unknown"
 a=models.Asset(project_id=p.id,cloudinary_public_id=body.public_id,resource_type=body.resource_type,sha256=digest,phash=f["phash"],capture_time=f["exif"]["captured_at"],lat=f["exif"]["lat"],lng=f["exif"]["lng"],exif_json=f["exif"],embedding=embedding,activity_label=label,activity_score=analysis.get("activity_confidence"),tags=[label] if label!="unknown" else [],seg_area_json=analysis.get("class_percentages"),count_json={"sapling":{"count":analysis.get("object_count"),"score":analysis.get("count_confidence"),"available":analysis.get("available",False)}},vision_json=analysis,forensics_json=f)
 db.add(a);db.flush();_append_ledger(db,"asset",{"asset_id":a.id,"sha256":digest,"project_id":p.id});_append_ledger(db,"model_output",{"asset_id":a.id,"output":analysis,"embedding_model":vision.EMBEDDING_MODEL if embedding else None});db.commit();db.refresh(a)
 try:cloudinary_utils.set_structured_metadata(body.public_id,{"project_id":p.id,"activity_label":label,"verification_status":"flagged" if f["hard_fail"] else "unverified"},body.resource_type)
 except Exception as exc:
  a.vision_json={**(a.vision_json or {}),"cloudinary_metadata_warning":str(exc)};db.commit()
 return a

@app.post("/api/assets/ingest")
def ingest_asset(body:IngestIn,background:BackgroundTasks,async_mode:bool=False,db:Session=Depends(get_db)):
 if not db.get(models.Project,body.project_id):raise HTTPException(404,"project not found")
 if async_mode:
  j=_new_job(db,"ingest",body.model_dump());background.add_task(_execute_job,j.id);return {"job_id":j.id,"status":j.status,"status_url":f"/api/jobs/{j.id}"}
 try:return _perform_ingest(body,db)
 except ValueError as exc:raise HTTPException(400,str(exc))
 except Exception as exc:db.rollback();raise HTTPException(502,f"asset ingestion failed: {exc}")
@app.get("/api/assets")
def list_assets(
    project_id: str,
    q: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.Asset).filter(
        models.Asset.project_id == project_id
    )

    if q:
        v = vision.embed_text(q)

        query = query.filter(
            models.Asset.embedding.isnot(None)
        ).order_by(
            models.Asset.embedding.cosine_distance(v)
        )

    assets = query.limit(limit).all()

    return [
        {
            "id": asset.id,
            "project_id": asset.project_id,
            "cloudinary_public_id": asset.cloudinary_public_id,
            "resource_type": asset.resource_type,
            "sha256": asset.sha256,
            "phash": asset.phash,
            "capture_time": asset.capture_time,
            "lat": asset.lat,
            "lng": asset.lng,
            "exif_json": asset.exif_json,
            "activity_label": asset.activity_label,
            "activity_score": asset.activity_score,
            "tags": asset.tags,
            "seg_area_json": asset.seg_area_json,
            "count_json": asset.count_json,
            "vision_json": asset.vision_json,
            "forensics_json": asset.forensics_json,
            "created_at": asset.created_at,
        }
        for asset in assets
    ]
@app.get("/api/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    a = db.get(models.Asset, asset_id)

    if not a:
        raise HTTPException(404, "asset not found")

    return {
        "id": a.id,
        "project_id": a.project_id,
        "cloudinary_public_id": a.cloudinary_public_id,
        "resource_type": a.resource_type,
        "sha256": a.sha256,
        "phash": a.phash,
        "capture_time": a.capture_time,
        "lat": a.lat,
        "lng": a.lng,
        "exif_json": a.exif_json,
        "activity_label": a.activity_label,
        "activity_score": a.activity_score,
        "tags": a.tags,
        "seg_area_json": a.seg_area_json,
        "count_json": a.count_json,
        "vision_json": a.vision_json,
        "forensics_json": a.forensics_json,
        "created_at": a.created_at,
    }

@app.post("/api/compare")
def compare_assets(body:CompareIn,db:Session=Depends(get_db)):
 before,after=db.get(models.Asset,body.before_asset_id),db.get(models.Asset,body.after_asset_id)
 if not before or not after:raise HTTPException(404,"asset not found")
 try:r=vision.compare_pair(cloudinary_utils.fetch_asset_bytes(before.cloudinary_public_id,before.resource_type),cloudinary_utils.fetch_asset_bytes(after.cloudinary_public_id,after.resource_type))
 except Exception as exc:raise HTTPException(502,f"vision comparison failed: {exc}")
 urls=[cloudinary_utils.build_before_after_url(before.cloudinary_public_id,after.cloudinary_public_id)]
 c=models.Comparison(before_asset_id=before.id,after_asset_id=after.id,alignment_score=r.get("alignment_score"),class_delta_json=r.get("class_delta_pct"),transform_urls=urls,analysis_json=r);db.add(c);db.flush();_append_ledger(db,"transformation",{"comparison_id":c.id,"urls":urls,"analysis":r});db.commit();db.refresh(c);return c

# Rank evidence by a cross-modal vector, then boost explicit activity matches. Keep contradictory forensic evidence.
def _cosine(a,b):
 if not a or not b or len(a)!=len(b):return 0.
 dot=sum(x*y for x,y in zip(a,b));na=math.sqrt(sum(x*x for x in a));nb=math.sqrt(sum(y*y for y in b));return dot/(na*nb) if na and nb else 0.
def _retrieve(sc,assets):
 params=sc.params_json or {};query=" ".join([sc.statement,str(params.get("label","")),str(params.get("target","")),str(params.get("metric","")),str(params.get("site",""))])
 try:v=vision.embed_text(query)
 except Exception:v=None
 ranked=[]
 for a in assets:
  f=a.forensics_json or {}; geo=(f.get("geo_check") or {}).get("within_site");tim=(f.get("time_check") or {}).get("within_window")
  semantic=_cosine(v,a.embedding) if v and a.embedding else 0.
  terms={x.lower() for x in query.replace("_"," ").split() if len(x)>3};label=(a.activity_label or "").lower().replace("_"," ")
  lexical=len(terms.intersection(label.split()))/max(1,len(terms));score=semantic if v and a.embedding else lexical
  if params.get("label") and str(params["label"]).lower().replace(" ","_") in (a.activity_label or "").lower():score+=.25
  if geo is not None:score+=.04
  if tim is not None:score+=.04
  if f.get("hard_fail"):score+=.1
  ranked.append((score,a,semantic,lexical))
 ranked.sort(key=lambda x:(x[0],x[1].capture_time or "",x[1].id),reverse=True)
 chosen=[x for x in ranked if x[0]>=.12][:5]
 if not chosen and sc.type in {"count","change"}:chosen=ranked[:min(5,len(ranked))]
 if not chosen and sc.type=="location":chosen=[x for x in ranked if (x[1].forensics_json or {}).get("geo_check",{}).get("within_site") is not None][:5]
 if not chosen and sc.type=="time":chosen=[x for x in ranked if (x[1].forensics_json or {}).get("time_check",{}).get("within_window") is not None][:5]
 for x in ranked:
  if (x[1].forensics_json or {}).get("hard_fail") and x[0]>=.12 and x not in chosen:chosen.append(x)
 return chosen[:8]
def _count_target(sc):
 p=sc.params_json or {};v=p.get("value",p.get("count"))
 try:return int(v) if v is not None else None
 except (TypeError,ValueError):return None
def _reason(a,role):
 if role=="contradicts":return "forensic metadata conflicts with project or claim"
 if a.activity_label and a.activity_label!="unknown":return "vision model classified activity as "+a.activity_label
 if (a.forensics_json or {}).get("exif",{}).get("has_exif"):return "capture metadata available; semantic relevance is approximate"
 return "matched available semantic and metadata signals"

def _perform_audit(claim_id,db):
 claim=db.get(models.Claim,claim_id)
 if not claim:raise ValueError("claim not found")
 subclaims=db.query(models.SubClaim).filter(models.SubClaim.claim_id==claim_id).all();assets=db.query(models.Asset).filter(models.Asset.project_id==claim.project_id).all();results=[]
 for sc in subclaims:
  db.query(models.Evidence).filter(models.Evidence.subclaim_id==sc.id).delete(synchronize_session=False)
  ranked=_retrieve(sc,assets);selected=[x[1] for x in ranked];target_n=_count_target(sc) if sc.type=="count" else None;target=str((sc.params_json or {}).get("target","sapling"));count_total=None
  if target_n is not None:
   for a in selected:
    try:counted=vision.count_objects(cloudinary_utils.fetch_asset_bytes(a.cloudinary_public_id,a.resource_type),target)
    except Exception as exc:counted={"count":None,"available":False,"error":str(exc),"target":target}
    merged=dict(a.count_json or {});merged[target]=counted;a.count_json=merged
   count_values=[(a.count_json or {}).get(target,{}) for a in selected]
   usable=[float(x["count"]) for x in count_values if x.get("available") and x.get("count") is not None]
   if usable:count_total=sum(usable)
  change_signal=None;change_result=None
  if sc.type=="change" and len(selected)>=2:
   ordered=sorted(selected,key=lambda a:a.capture_time or a.created_at.isoformat());before,after=ordered[0],ordered[-1]
   try:r=vision.compare_pair(cloudinary_utils.fetch_asset_bytes(before.cloudinary_public_id,before.resource_type),cloudinary_utils.fetch_asset_bytes(after.cloudinary_public_id,after.resource_type))
   except Exception as exc:r={"available":False,"error":str(exc)}
   change_result=r
   if r.get("available"):
    metric=str((sc.params_json or {}).get("metric","vegetation")).lower().removesuffix("_pct");direction=str((sc.params_json or {}).get("direction","increase")).lower();deltas={str(k).lower().removesuffix("_pct"):v for k,v in (r.get("class_delta_pct") or {}).items()};delta=deltas.get(metric)
    if delta is not None and r.get("aligned"):
     magnitude=min(abs(float(delta))/20.,1.);change_signal=magnitude if ((direction=="increase" and delta>=0) or (direction=="decrease" and delta<=0)) else 1.-magnitude
    urls=[cloudinary_utils.build_before_after_url(before.cloudinary_public_id,after.cloudinary_public_id)];c=models.Comparison(before_asset_id=before.id,after_asset_id=after.id,alignment_score=r.get("alignment_score"),class_delta_json=r.get("class_delta_pct"),transform_urls=urls,analysis_json=r);db.add(c);db.flush();_append_ledger(db,"transformation",{"comparison_id":c.id,"urls":urls,"analysis":r})
  geo_vals=[];time_vals=[];hard=False;details=[]
  for relevance,a,semantic,lexical in ranked:
   f=a.forensics_json or {};g=(f.get("geo_check") or {}).get("within_site");t=(f.get("time_check") or {}).get("within_window");flags=f.get("flags") or []
   if g is not None:geo_vals.append(float(g))
   if t is not None:time_vals.append(float(t))
   hard=hard or bool(f.get("hard_fail")) or "reused_from_other_project" in flags
   role="context"
   if f.get("hard_fail") or (g is False and sc.type=="location") or (t is False and sc.type=="time"):role="contradicts"
   elif relevance>=.3 and not flags:role="supports"
   if sc.type=="change" and change_signal is not None:
    role="supports" if change_signal>=.75 else "contradicts" if change_signal<.4 else "context"
   detail={"relevance":round(relevance,4),"semantic_similarity":round(semantic,4),"lexical_overlap":round(lexical,4),"geo_within_site":g,"time_within_window":t,"flags":flags,"activity_label":a.activity_label,"reason":_reason(a,role)}
   if change_result:detail["before_after_analysis"]=change_result
   if target_n is not None:
    count_data=(a.count_json or {}).get(target,{})
    detail.update({"observed_count":count_data.get("count"),"estimated_total_count":count_total,"claimed_count":target_n})
    if count_total is not None:
     agreement=max(0.,1.-abs(count_total-target_n)/max(target_n,1));detail["quantitative_agreement"]=agreement
     if agreement<.4:role="contradicts"
     elif agreement>=.75 and role=="context":role="supports"
   detail["reason"]=_reason(a,role)
   db.add(models.Evidence(subclaim_id=sc.id,asset_id=a.id,role=role,detail_json=detail));details.append(detail)
  qvals=[d["quantitative_agreement"] for d in details if "quantitative_agreement" in d]
  if change_signal is not None:
   for detail in details:detail["quantitative_agreement"]=change_signal
   qvals=[change_signal]
  signals={"geo_consistency":sum(geo_vals)/len(geo_vals) if geo_vals else .5,"time_consistency":sum(time_vals)/len(time_vals) if time_vals else .5,"uniqueness":.3 if any((a.forensics_json or {}).get("flags") for a in selected) else 1.,"quantitative_agreement":sum(qvals)/len(qvals) if qvals else .5,"evidence_volume":min(len(selected)/5,1.)}
  result=apply_hard_fail(score_subclaim(signals),hard,"matched evidence includes a geo/time/reuse hard failure");result["signals"]=signals;result["evidence_asset_ids"]=[a.id for a in selected];result["reasons"]=[f"matched {len(selected)} relevant asset(s)"]
  if target_n is not None:result["reasons"].append("visual count is a model estimate; inspect evidence and uncertainty")
  sc.verdict=result["verdict"];sc.confidence=result["confidence"];sc.reasons=result["reasons"]
  _append_ledger(db,"verdict",{"subclaim_id":sc.id,"verdict":sc.verdict,"confidence":sc.confidence,"signals":signals});results.append(result)
 if not results:raise ValueError("claim has no sub-claims to audit")
 overall=overall_verdict(results);claim.status="audited";claim.overall_verdict=overall["verdict"];claim.overall_confidence=overall["confidence"];db.commit();db.refresh(claim);return {"claim":claim,"subclaims":subclaims}

@app.post("/api/claims")
def create_claim(body:ClaimIn,db:Session=Depends(get_db)):
 p=db.get(models.Project,body.project_id)
 if not p:raise HTTPException(404,"project not found")
 c=models.Claim(project_id=p.id,text=body.text);db.add(c);db.commit();db.refresh(c)
 ctx={"name":p.name,"site_lat":p.site_lat,"site_lng":p.site_lng,"window_start":p.window_start,"window_end":p.window_end}
 for x in decompose(body.text,ctx):db.add(models.SubClaim(claim_id=c.id,type=x.get("type","activity"),statement=x.get("statement",body.text),params_json=x.get("params",{})))
 db.commit();return {"claim":c,"subclaims":db.query(models.SubClaim).filter(models.SubClaim.claim_id==c.id).all()}
@app.post("/api/claims/{claim_id}/audit")
def audit_claim(claim_id:str,background:BackgroundTasks,async_mode:bool=False,db:Session=Depends(get_db)):
 if not db.get(models.Claim,claim_id):raise HTTPException(404,"claim not found")
 if async_mode:
  j=_new_job(db,"audit",{"claim_id":claim_id});background.add_task(_execute_job,j.id);return {"job_id":j.id,"status":j.status,"status_url":f"/api/jobs/{j.id}"}
 try:return _perform_audit(claim_id,db)
 except ValueError as exc:raise HTTPException(400,str(exc))
 except Exception as exc:db.rollback();raise HTTPException(502,f"claim audit failed: {exc}")

@app.get("/api/claims/{claim_id}/evidence")
def claim_evidence(claim_id:str,db:Session=Depends(get_db)):
 if not db.get(models.Claim,claim_id):raise HTTPException(404,"claim not found")
 rows=db.query(models.Evidence,models.Asset,models.SubClaim).join(models.Asset,models.Evidence.asset_id==models.Asset.id).join(models.SubClaim,models.Evidence.subclaim_id==models.SubClaim.id).filter(models.SubClaim.claim_id==claim_id).all()
 return [{"evidence":e,"asset":a,"subclaim_id":s.id,"subclaim":s.statement} for e,a,s in rows]

def _new_job(db,kind,payload):
 j=models.Job(kind=kind,status="queued",input_json=payload);db.add(j);db.commit();db.refresh(j);return j
def _execute_job(job_id):
 db=SessionLocal()
 try:
  j=db.get(models.Job,job_id)
  if not j:return
  j.status="running";j.updated_at=datetime.utcnow();db.commit()
  try:
   if j.kind=="ingest":r=_perform_ingest(IngestIn(**j.input_json),db);output={"asset_id":r.id}
   elif j.kind=="audit":r=_perform_audit(j.input_json["claim_id"],db);output={"claim_id":r["claim"].id,"verdict":r["claim"].overall_verdict}
   else:raise ValueError("unsupported job kind")
   j=db.get(models.Job,job_id);j.status="completed";j.result_json=output
  except Exception as exc:
   db.rollback();j=db.get(models.Job,job_id)
   if j:j.status="failed";j.error=str(exc)
  if j:j.updated_at=datetime.utcnow();db.commit()
 finally:db.close()
@app.get("/api/jobs/{job_id}")
def get_job(job_id:str,db:Session=Depends(get_db)):
 j=db.get(models.Job,job_id)
 if not j:raise HTTPException(404,"job not found")
 return j

LEDGER_PRIVATE_KEY=os.environ.get("LEDGER_PRIVATE_KEY")
@app.post("/api/claims/{claim_id}/certificate")
def issue_certificate(claim_id:str,db:Session=Depends(get_db)):
 if not LEDGER_PRIVATE_KEY:raise HTTPException(500,"LEDGER_PRIVATE_KEY not set; run generate_keys.py and configure .env")
 claim=db.get(models.Claim,claim_id)
 if not claim:raise HTTPException(404,"claim not found")
 assets=db.query(models.Asset).filter(models.Asset.project_id==claim.project_id).all();subs=db.query(models.SubClaim).filter(models.SubClaim.claim_id==claim_id).all();leaves=[]
 for a in assets:
  leaves.append({"kind":"asset","asset_id":a.id,"sha256":a.sha256,"cloudinary_public_id":a.cloudinary_public_id})
  if a.vision_json:leaves.append({"kind":"model_output","asset_id":a.id,"sha256":sha256_json(a.vision_json),"model":a.vision_json.get("model")})
 # Include saved visual transformations linked to this project's assets.
 asset_ids=[a.id for a in assets]
 comparisons=db.query(models.Comparison).filter(or_(models.Comparison.before_asset_id.in_(asset_ids),models.Comparison.after_asset_id.in_(asset_ids))).all() if asset_ids else []
 for c in comparisons:
  for url in c.transform_urls or []:leaves.append({"kind":"transformation","comparison_id":c.id,"url":url,"analysis_sha256":sha256_json(c.analysis_json or {})})
 for s in subs:leaves.append({"kind":"verdict","subclaim_id":s.id,"sha256":sha256_json({"verdict":s.verdict,"confidence":s.confidence,"reasons":s.reasons})})
 for s in subs:
  rows=db.query(models.Evidence).filter(models.Evidence.subclaim_id==s.id).all()
  for e in rows:leaves.append({"kind":"evidence_link","evidence_id":e.id,"subclaim_id":s.id,"asset_id":e.asset_id,"role":e.role,"sha256":sha256_json(e.detail_json or {})})
 if not leaves:raise HTTPException(400,"nothing to certify")
 cert=build_certificate(claim.id,leaves,LEDGER_PRIVATE_KEY);row=models.Certificate(claim_id=claim.id,merkle_root=cert["merkle_root"],signature=cert["signature"],public_key=cert["public_key"],proofs_json=cert["proofs"],leaves_json=cert["leaves"]);db.add(row);db.flush();_append_ledger(db,"certificate",{"claim_id":claim.id,"merkle_root":cert["merkle_root"]});claim.status="certified";db.commit();db.refresh(row);return {"certificate_id":row.id,**cert}
@app.get("/api/verify/{certificate_id}")
def verify(certificate_id:str,db:Session=Depends(get_db)):
 r=db.get(models.Certificate,certificate_id)
 if not r:raise HTTPException(404,"certificate not found")
 cert={"claim_id":r.claim_id,"merkle_root":r.merkle_root,"signature":r.signature,"public_key":r.public_key,"leaves":r.leaves_json,"proofs":r.proofs_json};return {"certificate":cert,"verification":verify_certificate(cert)}

@app.post("/api/reports")
def create_report(body:ReportIn,db:Session=Depends(get_db)):
 claim=db.get(models.Claim,body.claim_id)
 if not claim:raise HTTPException(404,"claim not found")
 project=db.get(models.Project,claim.project_id);subs=db.query(models.SubClaim).filter(models.SubClaim.claim_id==claim.id).all();evidence={}
 for s in subs:evidence[s.id]=db.query(models.Evidence,models.Asset).join(models.Asset,models.Evidence.asset_id==models.Asset.id).filter(models.Evidence.subclaim_id==s.id).all()
 cert=db.query(models.Certificate).filter(models.Certificate.claim_id==claim.id).order_by(models.Certificate.created_at.desc()).first()
 thumbnails={}
 for pairs in evidence.values():
  for _,asset in pairs:
   try:thumbnails[asset.id]=cloudinary_utils.fetch_asset_bytes(asset.cloudinary_public_id,asset.resource_type)
   except Exception:pass
 pdf=create_claim_report(claim,project,subs,evidence,cert,thumbnails);REPORT_DIR.mkdir(parents=True,exist_ok=True);rid=models.gen_id();path=REPORT_DIR/f"{rid}.pdf";path.write_bytes(pdf)
 db.add(models.Report(id=rid,claim_id=claim.id,file_path=str(path.resolve())));_append_ledger(db,"report",{"report_id":rid,"claim_id":claim.id,"sha256":hashlib.sha256(pdf).hexdigest()});db.commit();return {"report_id":rid,"status":"completed","download_url":f"/api/reports/{rid}","size_bytes":len(pdf)}
@app.get("/api/reports/{report_id}")
def download_report(report_id:str,db:Session=Depends(get_db)):
 r=db.get(models.Report,report_id)
 if not r:raise HTTPException(404,"report not found")
 if not Path(r.file_path).is_file():raise HTTPException(404,"report file not found on this server")
 return FileResponse(r.file_path,media_type="application/pdf",filename=f"impact-court-{r.id}.pdf")

def make_json_safe(obj):
 if isinstance(obj,dict):return {str(k):make_json_safe(v) for k,v in obj.items()}
 if isinstance(obj,(list,tuple)):return [make_json_safe(v) for v in obj]
 if hasattr(obj,"item"):
  try:return obj.item()
  except Exception:pass
 if hasattr(obj,"tolist"):
  try:return make_json_safe(obj.tolist())
  except Exception:pass
 return obj
@app.post("/api/redteam/check")
def redteam_check(project_id:str,public_id:str,resource_type:str="image",db:Session=Depends(get_db)):
 p=db.get(models.Project,project_id)
 if not p:raise HTTPException(404,"project not found")
 if resource_type!="image":raise HTTPException(400,"red-team forensics supports images only")
 try:
  b=cloudinary_utils.fetch_asset_bytes(public_id,resource_type);r=analyze_asset(b,{"lat":p.site_lat,"lng":p.site_lng,"radius_km":p.site_radius_km},{"start":p.window_start,"end":p.window_end})
 except Exception as exc:raise HTTPException(502,f"could not analyze image: {exc}")
 found=[{"asset_id":a.id,"project_id":a.project_id,"phash":a.phash} for a in db.query(models.Asset).filter(models.Asset.phash.isnot(None)).all()];r["duplicates"]=find_duplicate_candidates(r["phash"],found)
 if r["duplicates"]:r["flags"].append("reused_image");r["hard_fail"]=True
 verdict="FAKE / FLAGGED" if r["hard_fail"] or r["flags"] else "no issues found";return make_json_safe({"verdict":verdict,"report":r})
