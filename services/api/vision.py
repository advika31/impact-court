"""Gemini-backed multimodal embeddings and image analysis. Missing keys return explicit unavailable values."""
import json, os
from functools import lru_cache
from google import genai
from google.genai import types
EMBEDDING_MODEL=os.getenv("VISION_EMBEDDING_MODEL","gemini-embedding-2")
VISION_MODEL=os.getenv("VISION_LLM_MODEL",os.getenv("CLAIMS_LLM_MODEL","gemini-2.5-flash-lite"))
EMBEDDING_DIMENSIONS=768
@lru_cache(maxsize=1)
def _client():
    key=os.getenv("GEMINI_API_KEY"); return genai.Client(api_key=key) if key else None
def _mime(b):
    import io
    from PIL import Image
    try: fmt=(Image.open(io.BytesIO(b)).format or "JPEG").upper()
    except Exception: fmt="JPEG"
    return {"JPG":"image/jpeg","JPEG":"image/jpeg","PNG":"image/png","WEBP":"image/webp"}.get(fmt,"image/jpeg")
def embed_image(b):
    c=_client()
    if not c: return None
    r=c.models.embed_content(model=EMBEDDING_MODEL,contents=[types.Part.from_bytes(data=b,mime_type=_mime(b))],config={"output_dimensionality":EMBEDDING_DIMENSIONS})
    return list(r.embeddings[0].values)
def embed_text(s):
    c=_client()
    if not c or not s.strip(): return None
    r=c.models.embed_content(model=EMBEDDING_MODEL,contents=s,config={"output_dimensionality":EMBEDDING_DIMENSIONS})
    return list(r.embeddings[0].values)
def _json(prompt, images):
    c=_client()
    if not c: return None
    parts=[types.Part.from_text(text=prompt)]+[types.Part.from_bytes(data=b,mime_type=_mime(b)) for b in images]
    r=c.models.generate_content(model=VISION_MODEL,contents=[types.Content(parts=parts)],config=types.GenerateContentConfig(response_mime_type="application/json"))
    return json.loads(r.text)
def _unit(v):
    try:return max(0.,min(1.,float(v)))
    except (TypeError,ValueError):return None
def analyze_image(b,target="sapling"):
    r=_json("Inspect this field photo. Return JSON keys activity (short label), activity_confidence (0..1), object_count (integer estimate for "+target+"), count_confidence (0..1), class_percentages (vegetation, water, built, waste, road as 0..100), description (one sentence). Report only visible evidence and uncertainty.",[b])
    if r is None:return {"available":False,"activity":None,"activity_confidence":None,"object_count":None,"count_confidence":None,"count_target":target,"class_percentages":None,"description":None}
    try: count=max(0,int(r.get("object_count")))
    except (TypeError,ValueError):count=None
    pct={str(k):max(0.,min(100.,float(v))) for k,v in (r.get("class_percentages") or {}).items()}
    return {"available":True,"activity":str(r.get("activity") or "unknown"),"activity_confidence":_unit(r.get("activity_confidence")),"object_count":count,"count_confidence":_unit(r.get("count_confidence")),"count_target":target,"class_percentages":pct,"description":str(r.get("description") or ""),"model":VISION_MODEL}
def count_objects(b,target="sapling"):
    x=analyze_image(b,target);return {"count":x.get("object_count"),"score":x.get("count_confidence"),"target":target,"available":x["available"]}
def segment_scene(b):
    x=analyze_image(b);return {"available":x["available"],**(x.get("class_percentages") or {})}
def compare_pair(before,after):
    r=_json("Compare these site photos in order BEFORE then AFTER. Return JSON aligned (boolean: sufficiently same view), alignment_score (0..1), class_delta_pct (numeric percentage-point change for vegetation, water, built, waste, road), summary. These are visual estimates, not precise measurements.",[before,after])
    if r is None:return {"available":False,"aligned":None,"alignment_score":None,"class_delta_pct":None,"summary":None}
    return {"available":True,"aligned":bool(r.get("aligned")),"alignment_score":_unit(r.get("alignment_score")),"class_delta_pct":{str(k):float(v) for k,v in (r.get("class_delta_pct") or {}).items()},"summary":str(r.get("summary") or ""),"model":VISION_MODEL}
