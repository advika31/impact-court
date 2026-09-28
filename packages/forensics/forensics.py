"""
Impact Court - Forensics module
Extracts EXIF metadata, checks geo/time consistency against a project's
declared site and window, and computes a perceptual hash for duplicate
detection. Pure functions - no DB access. The API layer is responsible for
fetching existing (asset_id, phash) pairs and passing them to
find_duplicate_candidates().
"""
import io
import math
from datetime import datetime
from typing import Optional

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import imagehash


# ---------- EXIF extraction ----------

def _convert_to_degrees(value) -> float:
    d, m, s = value
    return d + (m / 60.0) + (s / 3600.0)


def extract_exif(image_bytes: bytes) -> dict:
    """
    Returns:
      {
        "has_exif": bool,
        "lat": float | None, "lng": float | None,
        "captured_at": "ISO8601 string" | None,
        "software": str | None,   # presence of an editing tool tag is a soft flag
        "camera_make": str | None, "camera_model": str | None,
      }

    Note: photos downloaded from WhatsApp, Instagram, or most social apps
    have EXIF stripped by the platform. Use ORIGINAL phone camera photos for
    your demo dataset, or this will always show has_exif=False.
    """
    result = {
        "has_exif": False, "lat": None, "lng": None,
        "captured_at": None, "software": None,
        "camera_make": None, "camera_model": None,
    }
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif_raw = image._getexif()
        if not exif_raw:
            return result
        result["has_exif"] = True

        exif = {TAGS.get(k, k): v for k, v in exif_raw.items()}
        result["software"] = exif.get("Software")
        result["camera_make"] = exif.get("Make")
        result["camera_model"] = exif.get("Model")

        dt_str = exif.get("DateTimeOriginal") or exif.get("DateTime")
        if dt_str:
            try:
                dt = datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
                result["captured_at"] = dt.isoformat()
            except ValueError:
                pass

        gps_raw = exif.get("GPSInfo")
        if gps_raw:
            gps = {GPSTAGS.get(k, k): v for k, v in gps_raw.items()}
            lat, lng = gps.get("GPSLatitude"), gps.get("GPSLongitude")
            lat_ref, lng_ref = gps.get("GPSLatitudeRef"), gps.get("GPSLongitudeRef")
            if lat and lng and lat_ref and lng_ref:
                lat_deg = _convert_to_degrees(lat)
                lng_deg = _convert_to_degrees(lng)
                if lat_ref != "N":
                    lat_deg = -lat_deg
                if lng_ref != "E":
                    lng_deg = -lng_deg
                result["lat"] = lat_deg
                result["lng"] = lng_deg
    except Exception:
        # Corrupt or unsupported image - treat as "no EXIF" rather than crashing
        pass

    return result


# ---------- Geo / time consistency ----------

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points, in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def geo_check(lat: Optional[float], lng: Optional[float],
              site_lat: float, site_lng: float, site_radius_km: float) -> dict:
    if lat is None or lng is None:
        return {"distance_km": None, "within_site": None, "reason": "no GPS in EXIF"}
    dist = haversine_km(lat, lng, site_lat, site_lng)
    return {"distance_km": round(dist, 3), "within_site": dist <= site_radius_km}


def time_check(captured_at: Optional[str], window_start: str, window_end: str) -> dict:
    if not captured_at:
        return {"within_window": None, "reason": "no timestamp in EXIF"}
    try:
        cap = datetime.fromisoformat(captured_at)
        start = datetime.fromisoformat(window_start)
        end = datetime.fromisoformat(window_end)
        return {"within_window": start <= cap <= end}
    except ValueError:
        return {"within_window": None, "reason": "unparseable date"}


# ---------- Perceptual hash (duplicate detection) ----------

def compute_phash(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    return str(imagehash.phash(image))


def phash_distance(phash_a: str, phash_b: str) -> int:
    """Hamming distance between two phash hex strings.
    0 = identical, <=4 usually near-duplicate, <=8 possible crop/edit."""
    return imagehash.hex_to_hash(phash_a) - imagehash.hex_to_hash(phash_b)


# ---------- Combined report ----------

def analyze_asset(image_bytes: bytes, site: dict, window: dict) -> dict:
    """
    site:   {"lat": float, "lng": float, "radius_km": float}
    window: {"start": "2026-03-01T00:00:00", "end": "2026-06-30T23:59:59"}

    Returns a ForensicsReport dict (see project doc, section 7.3). Duplicate
    checking against OTHER assets is not done here since it needs DB access -
    do that with find_duplicate_candidates() in the API layer.
    """
    exif = extract_exif(image_bytes)
    phash = compute_phash(image_bytes)

    geo = geo_check(exif["lat"], exif["lng"], site["lat"], site["lng"], site["radius_km"])
    time_res = time_check(exif["captured_at"], window["start"], window["end"])

    flags = []
    if exif["software"]:
        flags.append("editing_software_tag")
    if not exif["has_exif"]:
        flags.append("missing_exif")
    if geo.get("within_site") is False:
        flags.append("outside_declared_site")
    if time_res.get("within_window") is False:
        flags.append("outside_declared_window")

    hard_fail = (geo.get("within_site") is False) or (time_res.get("within_window") is False)

    return {
        "exif": exif,
        "phash": phash,
        "geo_check": geo,
        "time_check": time_res,
        "flags": flags,
        "hard_fail": hard_fail,
    }


def find_duplicate_candidates(target_phash: str, existing: list[dict], threshold: int = 8) -> list[dict]:
    """
    existing: list of {"asset_id": str, "project_id": str, "phash": str}
    Returns entries whose phash is within `threshold` Hamming distance,
    each annotated with a similarity score and a rough "kind" guess.

    This catches exact reuse and near-duplicates (recompression, small crop,
    rotation). It will NOT catch a photo of a genuinely different but similar-
    looking site - that's a known, honest limitation, say so in your pitch.
    CLIP-embedding cosine similarity (from packages/vision) catches a wider
    net of "semantically the same scene" - combine both when vision is ready.
    """
    hits = []
    for item in existing:
        if not item.get("phash"):
            continue
        dist = phash_distance(target_phash, item["phash"])
        if dist <= threshold:
            similarity = round(1 - (dist / 64), 3)  # phash is 64 bits
            kind = "exact" if dist == 0 else ("near" if dist <= 4 else "crop_or_edit")
            hits.append({**item, "hamming_distance": dist, "similarity": similarity, "kind": kind})
    return sorted(hits, key=lambda h: h["hamming_distance"])
