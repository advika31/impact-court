"""
Impact Court - Cloudinary integration helpers.

Everything the API needs from Cloudinary lives here: signed upload params
(so the frontend never sees your API secret), downloading original bytes
for hashing/analysis, mirroring analysis results as structured/contextual
metadata, and building the transformation URLs (before/after composite,
verified badge) that go into reports and certificates.
"""
import os
import time

import cloudinary
import cloudinary.uploader
import cloudinary.utils
import requests

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)


def make_upload_signature(folder: str) -> dict:
    """
    Returns the params the frontend needs to do a signed direct upload to
    Cloudinary (Upload Widget, or a plain fetch()), without ever exposing
    your API secret to the browser.
    """
    timestamp = int(time.time())
    params_to_sign = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(
        params_to_sign, os.environ["CLOUDINARY_API_SECRET"]
    )
    return {
        "timestamp": timestamp,
        "signature": signature,
        "api_key": os.environ["CLOUDINARY_API_KEY"],
        "cloud_name": os.environ["CLOUDINARY_CLOUD_NAME"],
        "folder": folder,
    }


def fetch_asset_bytes(public_id: str, resource_type: str = "image") -> bytes:
    """Download the original asset bytes from Cloudinary for hashing and analysis."""
    url, _ = cloudinary.utils.cloudinary_url(public_id, resource_type=resource_type)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.content


def set_structured_metadata(public_id: str, fields: dict, resource_type: str = "image"):
    """
    Mirrors key analysis fields onto the Cloudinary asset itself (contextual
    metadata), so the asset stays searchable inside Cloudinary's own console
    and Search API too - not just in our Postgres DB. This is also one of
    the concrete things judges can point to as "real Cloudinary usage".
    """
    context_str = "|".join(f"{k}={v}" for k, v in fields.items())
    cloudinary.uploader.explicit(
        public_id, type="upload", resource_type=resource_type, context=context_str,
    )


def build_before_after_url(before_public_id: str, after_public_id: str) -> str:
    """Example Cloudinary transformation: side-by-side before/after composite."""
    url, _ = cloudinary.utils.cloudinary_url(
        after_public_id,
        transformation=[
            {"width": 500, "height": 500, "crop": "fill"},
            {"overlay": before_public_id, "width": 500, "height": 500, "crop": "fill", "x": -500},
        ],
    )
    return url


def build_verified_badge_url(public_id: str) -> str:
    """Overlays a 'VERIFIED' text badge - used on certificate/report images."""
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=[{
            "overlay": {"font_family": "Arial", "font_size": 40, "font_weight": "bold", "text": "VERIFIED"},
            "color": "#00c853", "gravity": "south_east", "x": 20, "y": 20,
        }],
    )
    return url
