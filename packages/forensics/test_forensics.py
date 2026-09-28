"""
Run from the project root, with a REAL phone photo (not a screenshot,
not a WhatsApp-downloaded image - those strip EXIF):

    python -m packages.forensics.test_forensics /path/to/some_photo.jpg

Prints the full ForensicsReport so you can sanity-check EXIF extraction and
phash computation before wiring this into the API. If has_exif comes back
False, the photo has been stripped of metadata somewhere along the way -
that's expected for downloaded/shared images, and is itself a real signal
your system should flag.
"""
import sys
import json
from packages.forensics.forensics import analyze_asset


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m packages.forensics.test_forensics <path_to_image>")
        return
    with open(sys.argv[1], "rb") as f:
        image_bytes = f.read()

    site = {"lat": 28.63982222222222, "lng": 77.33792777777778, "radius_km": 2.0}
    window = {"start": "2026-03-01T00:00:00", "end": "2026-06-30T23:59:59"}

    report = analyze_asset(image_bytes, site, window)
    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    main()
