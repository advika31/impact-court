"""
Temporary stand-in for the real vision module (packages/vision - Person 3's
job, or yours later if nobody else builds it). Every function signature here
matches the real interface exactly (project doc, section 7.1), so swapping
this out later is a ONE-LINE import change in main.py - nothing else needs
to change.

Delete this file once packages/vision/ has real implementations, and change
the import at the top of main.py from `vision_stub` to `packages.vision.vision`.
"""
import hashlib
import random


def embed_image(image_bytes: bytes) -> list[float]:
    """Fake 512-d embedding, deterministic per image so results are at least
    stable across runs. NOT semantically meaningful - just a placeholder."""
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    vec = [rng.uniform(-1, 1) for _ in range(512)]
    norm = sum(v * v for v in vec) ** 0.5
    return [v / norm for v in vec]


def embed_text(text: str) -> list[float]:
    seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    vec = [rng.uniform(-1, 1) for _ in range(512)]
    norm = sum(v * v for v in vec) ** 0.5
    return [v / norm for v in vec]


def classify_activity(image_bytes: bytes) -> dict:
    labels = ["tree_planting", "cleanup", "road_work", "water_sanitation", "construction"]
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16)
    label = labels[seed % len(labels)]
    return {"label": label, "score": 0.5}  # 0.5 flags this as a clear placeholder, not real confidence


def count_objects(image_bytes: bytes, target: str = "sapling") -> dict:
    return {"count": 0, "boxes": [], "score": 0.0}  # TODO real detector (YOLOv8 / OWLv2 / Grounding DINO)


def segment_scene(image_bytes: bytes) -> dict:
    return {"vegetation_pct": 0.0, "water_pct": 0.0, "built_pct": 0.0, "waste_pct": 0.0, "road_pct": 0.0}


def compare_pair(before_bytes: bytes, after_bytes: bytes) -> dict:
    return {
        "aligned": False,
        "alignment_score": 0.0,
        "class_delta_pct": {},
        "change_overlay_png": None,
    }
