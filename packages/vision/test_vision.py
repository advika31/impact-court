"""
Unit test for packages/vision/vision.py
Verifies all 6 functions fulfill the Section 7.1 contract.
"""
import io
import numpy as np
from PIL import Image
from packages.vision import vision

def create_dummy_image(color=(34, 139, 34)):
    img = Image.new('RGB', (224, 224), color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

def run_tests():
    print("Testing packages/vision...")
    dummy_bytes = create_dummy_image()
    dummy_bytes_2 = create_dummy_image(color=(139, 69, 19))

    # 1. embed_image
    emb = vision.embed_image(dummy_bytes)
    assert len(emb) == 512, f"Expected 512-d vector, got {len(emb)}"
    norm = sum(x*x for x in emb)**0.5
    print(f"1. embed_image: OK (dim={len(emb)}, L2 norm={norm:.3f})")

    # 2. embed_text
    txt_emb = vision.embed_text("tree planting in the field")
    assert len(txt_emb) == 512, f"Expected 512-d vector, got {len(txt_emb)}"
    print(f"2. embed_text: OK (dim={len(txt_emb)})")

    # 3. classify_activity
    act = vision.classify_activity(dummy_bytes)
    assert "label" in act and "score" in act, f"Invalid format: {act}"
    print(f"3. classify_activity: OK ({act})")

    # 4. segment_scene
    seg = vision.segment_scene(dummy_bytes)
    assert "vegetation_pct" in seg and "waste_pct" in seg, f"Invalid format: {seg}"
    print(f"4. segment_scene: OK ({seg})")

    # 5. count_objects
    cnt = vision.count_objects(dummy_bytes, target="sapling")
    assert "count" in cnt and "boxes" in cnt and "score" in cnt, f"Invalid format: {cnt}"
    print(f"5. count_objects: OK ({cnt})")

    # 6. compare_pair
    comp = vision.compare_pair(dummy_bytes, dummy_bytes_2)
    assert "aligned" in comp and "class_delta_pct" in comp, f"Invalid format: {comp}"
    print(f"6. compare_pair: OK (aligned={comp['aligned']}, delta={comp['class_delta_pct']})")

    print("\nALL VISION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
