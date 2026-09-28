"""
Run from the project root:
    python -m packages.ledger.test_ledger

This is your very first "does anything work" checkpoint. It builds a fake
certificate, verifies it (should pass), then tampers with one leaf and
verifies again (should fail). This IS the "alter one byte -> verification
fails" demo moment from your pitch - run it now so you've seen it work
before you ever touch the API or database.
"""
from packages.ledger.ledger import generate_keypair, build_certificate, verify_certificate


def main():
    keys = generate_keypair()
    print("Generated a throwaway keypair for this test run:")
    print(keys)
    print()

    leaves = [
        {"kind": "asset", "sha256": "aaa111", "cloudinary_public_id": "impact-court/site-a/before1"},
        {"kind": "asset", "sha256": "bbb222", "cloudinary_public_id": "impact-court/site-a/after1"},
        {"kind": "transformation", "url": "https://res.cloudinary.com/demo/before_after_composite.jpg"},
        {"kind": "model_output", "sha256": "ccc333"},
        {"kind": "verdict", "sha256": "ddd444"},
    ]

    cert = build_certificate("claim_demo_1", leaves, keys["private_key_hex"])
    print("Certificate built. Merkle root:", cert["merkle_root"])

    result = verify_certificate(cert)
    print("\nVerification of untouched certificate (expect valid=True):")
    print(result)

    tampered = dict(cert)
    tampered["leaves"] = [dict(l) for l in cert["leaves"]]
    tampered["leaves"][0]["sha256"] = "aaa112"  # one character changed

    result_tampered = verify_certificate(tampered)
    print("\nVerification after changing ONE character in ONE leaf (expect valid=False):")
    print(result_tampered)


if __name__ == "__main__":
    main()
