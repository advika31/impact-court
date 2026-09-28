"""
Run this ONCE from the project root:
    python generate_keys.py

Copy the printed LEDGER_PRIVATE_KEY line into your .env file. Never commit
this value to git - it's what lets your server sign certificates; if it
leaks, anyone could forge a "verified" certificate.
"""
from packages.ledger.ledger import generate_keypair

if __name__ == "__main__":
    keys = generate_keypair()
    print("Add this line to your .env file:\n")
    print(f"LEDGER_PRIVATE_KEY={keys['private_key_hex']}")
    print(f"\n(public key, safe to share, for reference: {keys['public_key_hex']})")
