"""
Impact Court API - combined Person 1 (platform / Cloudinary / DB) + Person 2
(forensics / claims / ledger) service, in one FastAPI app.

Run locally (after following README.md setup):
    docker compose up -d db
    uvicorn services.api.main:app --reload --port 8000

Then open http://localhost:8000/docs for interactive API docs (FastAPI
generates this automatically - use it to test every endpoint by hand
before the frontend exists).

Vision outputs (embeddings, activity classification, object counting,
segmentation, before/after change) are NOT implemented here - that's
packages/vision (Person 3's job). Every place a vision call is needed calls
`vision_stub`, which returns clearly-labeled placeholder data so the WHOLE
flow runs end-to-end today. The moment real vision code exists, change one
import line (see vision_stub.py's docstring) and everything downstream
keeps working unchanged.
"""
import hashlib
import math
import os
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.api.db import get_db, init_db
from services.api import models
from services.api import cloudinary_utils
from packages.vision import vision as vision_stub

from packages.ledger.ledger import generate_keypair, build_certificate, verify_certificate
from packages.forensics.forensics import analyze_asset, find_duplicate_candidates
from packages.claims.claims import decompose, score_subclaim, apply_hard_fail, overall_verdict

app = FastAPI(title="Impact Court API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before deploying publicly
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- Request/response models ----------

class ProjectIn(BaseModel):
    name: str
    site_lat: float
    site_lng: float
    site_radius_km: float = 2.0
    window_start: str  # ISO date, e.g. "2026-03-01"
    window_end: str


class IngestIn(BaseModel):
    project_id: str
    public_id: str
    resource_type: str = "image"


class ClaimIn(BaseModel):
    project_id: str
    text: str


class CompareIn(BaseModel):
    before_asset_id: str
    after_asset_id: str


# ---------- Projects ----------

@app.post("/api/projects")
def create_project(body: ProjectIn, db: Session = Depends(get_db)):
    project = models.Project(**body.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "project not found")
    return project


# ---------- Upload / Ingest (Flow A) ----------

@app.get("/api/upload-signature")
def upload_signature(project_id: str):
    return cloudinary_utils.make_upload_signature(folder=f"impact-court/{project_id}")


@app.post("/api/assets/ingest")
def ingest_asset(body: IngestIn, db: Session = Depends(get_db)):
    project = db.get(models.Project, body.project_id)
    if not project:
        raise HTTPException(404, "project not found")

    # 1. Download the original bytes from Cloudinary and hash them
    image_bytes = cloudinary_utils.fetch_asset_bytes(body.public_id, body.resource_type)
    sha256 = hashlib.sha256(image_bytes).hexdigest()

    # 2. Forensics: EXIF, geo/time consistency, phash
    site = {"lat": project.site_lat, "lng": project.site_lng, "radius_km": project.site_radius_km}
    window = {"start": project.window_start, "end": project.window_end}
    forensics_report = analyze_asset(image_bytes, site, window)

    # Duplicate check against every other asset already ingested (any project)
    existing = [
        {"asset_id": a.id, "project_id": a.project_id, "phash": a.phash}
        for a in db.query(models.Asset).filter(models.Asset.phash.isnot(None)).all()
    ]
    duplicates = find_duplicate_candidates(forensics_report["phash"], existing)
    forensics_report["duplicates"] = duplicates
    if duplicates and any(d["project_id"] != body.project_id for d in duplicates):
        forensics_report["flags"].append("reused_from_other_project")
        forensics_report["hard_fail"] = True

    # 3. Vision (stubbed - see vision_stub.py)
    embedding = vision_stub.embed_image(image_bytes)
    activity = vision_stub.classify_activity(image_bytes)

    # 4. Persist
    asset = models.Asset(
        project_id=body.project_id,
        cloudinary_public_id=body.public_id,
        resource_type=body.resource_type,
        sha256=sha256,
        phash=forensics_report["phash"],
        capture_time=forensics_report["exif"]["captured_at"],
        lat=forensics_report["exif"]["lat"],
        lng=forensics_report["exif"]["lng"],
        exif_json=forensics_report["exif"],
        embedding=embedding,
        activity_label=activity["label"],
        activity_score=activity["score"],
        tags=[activity["label"]],
        forensics_json=forensics_report,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # 5. Mirror key fields onto Cloudinary itself (structured/contextual metadata)
    cloudinary_utils.set_structured_metadata(body.public_id, {
        "project_id": body.project_id,
        "activity_label": activity["label"],
        "verification_status": "flagged" if forensics_report["hard_fail"] else "unverified",
    }, body.resource_type)

    return asset


@app.get("/api/assets")
def list_assets(project_id: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Asset)
    if project_id:
        query = query.filter(models.Asset.project_id == project_id)
    assets = query.all()

    if q:
        # Semantic search: embed the query text, rank by cosine similarity.
        # Plain Python cosine is fine at hackathon scale (hundreds of assets).
        query_embedding = vision_stub.embed_text(q)
        assets = sorted(
            assets,
            key=lambda a: -_cosine(a.embedding, query_embedding) if a.embedding else 0,
        )
    return assets


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0


@app.get("/api/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.get(models.Asset, asset_id)
    if not asset:
        raise HTTPException(404, "asset not found")
    return asset


# ---------- Compare (before/after) ----------

@app.post("/api/compare")
def compare_assets(body: CompareIn, db: Session = Depends(get_db)):
    before = db.get(models.Asset, body.before_asset_id)
    after = db.get(models.Asset, body.after_asset_id)
    if not before or not after:
        raise HTTPException(404, "asset not found")

    before_bytes = cloudinary_utils.fetch_asset_bytes(before.cloudinary_public_id, before.resource_type)
    after_bytes = cloudinary_utils.fetch_asset_bytes(after.cloudinary_public_id, after.resource_type)

    result = vision_stub.compare_pair(before_bytes, after_bytes)  # swap for real vision later

    transform_url = cloudinary_utils.build_before_after_url(
        before.cloudinary_public_id, after.cloudinary_public_id
    )

    comparison = models.Comparison(
        before_asset_id=before.id,
        after_asset_id=after.id,
        alignment_score=result["alignment_score"],
        class_delta_json=result["class_delta_pct"],
        transform_urls=[transform_url],
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    return comparison


# ---------- Claims (Flow B) ----------

@app.post("/api/claims")
def create_claim(body: ClaimIn, db: Session = Depends(get_db)):
    project = db.get(models.Project, body.project_id)
    if not project:
        raise HTTPException(404, "project not found")

    claim = models.Claim(project_id=body.project_id, text=body.text)
    db.add(claim)
    db.commit()
    db.refresh(claim)

    project_ctx = {
        "name": project.name, "site_lat": project.site_lat, "site_lng": project.site_lng,
        "window_start": project.window_start, "window_end": project.window_end,
    }
    subclaims_raw = decompose(body.text, project_ctx)

    for sc in subclaims_raw:
        row = models.SubClaim(
            claim_id=claim.id, type=sc["type"], statement=sc["statement"],
            params_json=sc.get("params", {}),
        )
        db.add(row)
    db.commit()

    return {
        "claim": claim,
        "subclaims": db.query(models.SubClaim).filter(models.SubClaim.claim_id == claim.id).all(),
    }


@app.post("/api/claims/{claim_id}/audit")
def audit_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.get(models.Claim, claim_id)
    if not claim:
        raise HTTPException(404, "claim not found")

    subclaims = db.query(models.SubClaim).filter(models.SubClaim.claim_id == claim_id).all()
    assets = db.query(models.Asset).filter(models.Asset.project_id == claim.project_id).all()

    verdicts = []
    for sc in subclaims:
        # Simplified evidence-matching pass: uses ALL project assets as
        # evidence for every sub-claim. For the real build, narrow `relevant`
        # using sc.params (site/date/activity) + semantic search first -
        # that's the single biggest quality upgrade available here.
        relevant = assets

        signals = {
            "geo_consistency": _avg_signal(relevant, lambda a: a.forensics_json["geo_check"].get("within_site")),
            "time_consistency": _avg_signal(relevant, lambda a: a.forensics_json["time_check"].get("within_window")),
            "uniqueness": 1.0 if not any(a.forensics_json.get("flags", []) for a in relevant) else 0.3,
            "quantitative_agreement": 0.5,  # TODO: wire in vision_stub.count_objects / compare_pair once real
            "evidence_volume": min(len(relevant) / 10, 1.0),
        }
        result = score_subclaim(signals)
        any_hard_fail = any(a.forensics_json.get("hard_fail") for a in relevant)
        result = apply_hard_fail(result, any_hard_fail, "one or more evidence assets failed geo/time/reuse checks")

        sc.verdict = result["verdict"]
        sc.confidence = result["confidence"]
        sc.reasons = result.get("reasons", [f"scored from {len(relevant)} project assets"])
        verdicts.append(result)

    db.commit()

    overall = overall_verdict(verdicts)
    claim.status = "audited"
    claim.overall_verdict = overall["verdict"]
    claim.overall_confidence = overall["confidence"]
    db.commit()
    db.refresh(claim)

    return {"claim": claim, "subclaims": subclaims}


def _avg_signal(assets, extractor) -> float:
    values = [extractor(a) for a in assets if extractor(a) is not None]
    if not values:
        return 0.5  # unknown, not zero - missing data shouldn't tank a score
    return sum(1.0 if v else 0.0 for v in values) / len(values)


# ---------- Certificates ----------

LEDGER_PRIVATE_KEY = os.environ.get("LEDGER_PRIVATE_KEY")


@app.post("/api/claims/{claim_id}/certificate")
def issue_certificate(claim_id: str, db: Session = Depends(get_db)):
    if not LEDGER_PRIVATE_KEY:
        raise HTTPException(500, "LEDGER_PRIVATE_KEY not set - run generate_keys.py and add it to .env")

    claim = db.get(models.Claim, claim_id)
    if not claim:
        raise HTTPException(404, "claim not found")

    assets = db.query(models.Asset).filter(models.Asset.project_id == claim.project_id).all()
    subclaims = db.query(models.SubClaim).filter(models.SubClaim.claim_id == claim_id).all()

    leaves = []
    for a in assets:
        leaves.append({"kind": "asset", "sha256": a.sha256, "cloudinary_public_id": a.cloudinary_public_id})
    for sc in subclaims:
        leaves.append({
            "kind": "verdict",
            "sha256": hashlib.sha256(f"{sc.id}{sc.verdict}{sc.confidence}".encode()).hexdigest(),
        })

    cert_data = build_certificate(claim.id, leaves, LEDGER_PRIVATE_KEY)

    cert_row = models.Certificate(
        claim_id=claim.id,
        merkle_root=cert_data["merkle_root"],
        signature=cert_data["signature"],
        public_key=cert_data["public_key"],
        proofs_json=cert_data["proofs"],
        leaves_json=cert_data["leaves"],
    )
    db.add(cert_row)
    db.commit()
    db.refresh(cert_row)
    claim.status = "certified"
    db.commit()

    return {"certificate_id": cert_row.id, **cert_data}


@app.get("/api/verify/{certificate_id}")
def verify(certificate_id: str, db: Session = Depends(get_db)):
    cert_row = db.get(models.Certificate, certificate_id)
    if not cert_row:
        raise HTTPException(404, "certificate not found")

    certificate = {
        "claim_id": cert_row.claim_id,
        "merkle_root": cert_row.merkle_root,
        "signature": cert_row.signature,
        "public_key": cert_row.public_key,
        "leaves": cert_row.leaves_json,
        "proofs": cert_row.proofs_json,
    }
    result = verify_certificate(certificate)
    return {"certificate": certificate, "verification": result}

def make_json_safe(obj):
    if isinstance(obj, dict):
        return {
            str(k): make_json_safe(v)
            for k, v in obj.items()
        }

    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]

    if hasattr(obj, "item"):
        try:
            return obj.item()
        except Exception:
            pass

    if hasattr(obj, "tolist"):
        try:
            return obj.tolist()
        except Exception:
            pass

    return obj

# ---------- Red-team endpoint ----------

@app.post("/api/redteam/check")
def redteam_check(project_id: str, public_id: str, resource_type: str = "image", db: Session = Depends(get_db)):
    """
    Upload the suspect image via the SAME Cloudinary upload widget/signature
    used for normal ingestion (/api/upload-signature), then call this with
    the resulting public_id. Runs forensics + duplicate detection WITHOUT
    saving an Asset row, so a judge can test fakes without polluting your
    demo project's real data.
    """
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "project not found")

    image_bytes = cloudinary_utils.fetch_asset_bytes(public_id, resource_type)
    site = {"lat": project.site_lat, "lng": project.site_lng, "radius_km": project.site_radius_km}
    window = {"start": project.window_start, "end": project.window_end}
    report = analyze_asset(image_bytes, site, window)

    existing = [
        {"asset_id": a.id, "project_id": a.project_id, "phash": a.phash}
        for a in db.query(models.Asset).filter(models.Asset.phash.isnot(None)).all()
    ]
    report["duplicates"] = find_duplicate_candidates(report["phash"], existing)
    if report["duplicates"] and any(d["project_id"] != project_id for d in report["duplicates"]):
        report["flags"].append("reused_from_other_project")
        report["hard_fail"] = True

    verdict = "FAKE / FLAGGED" if (report["hard_fail"] or report["flags"]) else "no issues found"
    return make_json_safe({
        "verdict": verdict,
        "report": report
    })