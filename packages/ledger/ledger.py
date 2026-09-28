"""
Impact Court - Ledger module
Provides: hashing helpers, Merkle tree construction + proofs, Ed25519 signing/
verification, hash-chained ledger entries, and certificate build/verify.

No external dependencies on the DB or other packages - pure functions and
small classes. This is deliberately the first thing you build: you can test
it completely on its own before touching Cloudinary, Postgres, or FastAPI.
"""
import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any

from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import HexEncoder
from nacl.exceptions import BadSignatureError


# ---------- Hashing helpers ----------

def sha256_bytes(data: bytes) -> str:
    """Return hex sha256 digest of raw bytes (used for original image files)."""
    return hashlib.sha256(data).hexdigest()


def sha256_json(obj: Any) -> str:
    """
    Return hex sha256 digest of a JSON-serializable object, using a canonical
    (sorted keys, no whitespace) encoding so the same logical object always
    hashes the same way, no matter what order its fields were built in.
    """
    canonical = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def combine_hashes(left: str, right: str) -> str:
    """Hash two hex digests together (used for Merkle tree parent nodes)."""
    return hashlib.sha256((left + right).encode("utf-8")).hexdigest()


# ---------- Merkle tree ----------

@dataclass
class MerkleProof:
    leaf_index: int
    siblings: list  # list of {"hash": str, "position": "left"|"right"}


class MerkleTree:
    """
    Simple binary Merkle tree over a list of leaf hashes (hex strings).
    If a level has an odd number of nodes, the last node is duplicated
    (the standard convention) so every level pairs up cleanly.

    What this buys you: given just ONE leaf plus its short proof, anyone
    can confirm that leaf was part of the original set, without needing
    every other leaf. That's what makes the certificate lightweight and
    independently re-checkable.
    """

    def __init__(self, leaf_hashes: list[str]):
        if not leaf_hashes:
            raise ValueError("MerkleTree needs at least one leaf")
        self.leaves = list(leaf_hashes)
        self.levels: list[list[str]] = [self.leaves]
        self._build()

    def _build(self):
        current = self.levels[0]
        while len(current) > 1:
            nxt = []
            for i in range(0, len(current), 2):
                left = current[i]
                right = current[i + 1] if i + 1 < len(current) else current[i]
                nxt.append(combine_hashes(left, right))
            self.levels.append(nxt)
            current = nxt

    @property
    def root(self) -> str:
        return self.levels[-1][0]

    def get_proof(self, leaf_index: int) -> MerkleProof:
        if leaf_index < 0 or leaf_index >= len(self.leaves):
            raise IndexError("leaf_index out of range")
        siblings = []
        idx = leaf_index
        for level in self.levels[:-1]:
            is_right = idx % 2 == 1
            sibling_idx = idx - 1 if is_right else idx + 1
            if sibling_idx >= len(level):
                sibling_idx = idx  # duplicated-node case
            siblings.append({
                "hash": level[sibling_idx],
                "position": "left" if is_right else "right",
            })
            idx = idx // 2
        return MerkleProof(leaf_index=leaf_index, siblings=siblings)

    @staticmethod
    def verify_proof(leaf_hash: str, proof: MerkleProof, expected_root: str) -> bool:
        current = leaf_hash
        for step in proof.siblings:
            if step["position"] == "left":
                current = combine_hashes(step["hash"], current)
            else:
                current = combine_hashes(current, step["hash"])
        return current == expected_root


# ---------- Signing ----------

def generate_keypair() -> dict:
    """Generate a new Ed25519 keypair. Run this ONCE (see generate_keys.py),
    store the private key in .env, never commit it to git."""
    sk = SigningKey.generate()
    vk = sk.verify_key
    return {
        "private_key_hex": sk.encode(encoder=HexEncoder).decode("utf-8"),
        "public_key_hex": vk.encode(encoder=HexEncoder).decode("utf-8"),
    }


def sign_hex(message_hex: str, private_key_hex: str) -> str:
    """Sign a hex string (e.g. a Merkle root) with an Ed25519 private key."""
    sk = SigningKey(private_key_hex, encoder=HexEncoder)
    signed = sk.sign(message_hex.encode("utf-8"))
    return signed.signature.hex()


def verify_signature(message_hex: str, signature_hex: str, public_key_hex: str) -> bool:
    try:
        vk = VerifyKey(public_key_hex, encoder=HexEncoder)
        vk.verify(message_hex.encode("utf-8"), bytes.fromhex(signature_hex))
        return True
    except BadSignatureError:
        return False


# ---------- Hash-chained ledger entries ----------

@dataclass
class LedgerEntry:
    kind: str  # "asset" | "transformation" | "model_output" | "verdict"
    payload_hash: str
    prev_hash: str
    entry_hash: str = field(init=False)
    created_at: float = field(default_factory=time.time)

    def __post_init__(self):
        self.entry_hash = sha256_json({
            "kind": self.kind,
            "payload_hash": self.payload_hash,
            "prev_hash": self.prev_hash,
            "created_at": self.created_at,
        })


class Ledger:
    """
    In-memory helper for building a hash chain, mirroring the ledger_entries
    table. Each entry's hash depends on the previous entry's hash, so editing
    or deleting an old entry breaks every entry after it - that's the whole
    point of a hash chain.
    """

    GENESIS = "0" * 64

    def __init__(self):
        self.entries: list[LedgerEntry] = []

    def append(self, kind: str, payload: dict) -> LedgerEntry:
        prev_hash = self.entries[-1].entry_hash if self.entries else self.GENESIS
        entry = LedgerEntry(kind=kind, payload_hash=sha256_json(payload), prev_hash=prev_hash)
        self.entries.append(entry)
        return entry

    def verify_chain(self) -> bool:
        """Recompute every entry_hash and prev_hash link; False if anything's broken."""
        prev = self.GENESIS
        for e in self.entries:
            recomputed = sha256_json({
                "kind": e.kind, "payload_hash": e.payload_hash,
                "prev_hash": e.prev_hash, "created_at": e.created_at,
            })
            if recomputed != e.entry_hash or e.prev_hash != prev:
                return False
            prev = e.entry_hash
        return True


# ---------- Certificates ----------

def build_certificate(claim_id: str, leaves: list[dict], private_key_hex: str) -> dict:
    """
    leaves: list of dicts, e.g.
      {"kind": "asset", "sha256": "...", "cloudinary_public_id": "..."}
      {"kind": "transformation", "url": "..."}
      {"kind": "model_output", "sha256": "..."}
      {"kind": "verdict", "sha256": "..."}

    Each leaf dict is hashed (canonical JSON) to get its leaf hash. A Merkle
    tree is built over those leaf hashes, the root is signed, and a proof is
    stored for every leaf so any single leaf can later be independently
    re-verified without needing the whole database.
    """
    leaf_hashes = [sha256_json(leaf) for leaf in leaves]
    tree = MerkleTree(leaf_hashes)
    root = tree.root
    signature = sign_hex(root, private_key_hex)
    sk = SigningKey(private_key_hex, encoder=HexEncoder)
    public_key_hex = sk.verify_key.encode(encoder=HexEncoder).decode("utf-8")

    proofs = {}
    for i, leaf in enumerate(leaves):
        proof = tree.get_proof(i)
        proofs[str(i)] = {"leaf_hash": leaf_hashes[i], "siblings": proof.siblings}

    return {
        "claim_id": claim_id,
        "merkle_root": root,
        "signature": signature,
        "public_key": public_key_hex,
        "leaves": leaves,
        "proofs": proofs,
    }


def verify_certificate(certificate: dict) -> dict:
    """
    Fully independent re-verification: recompute every leaf hash from the
    leaf data itself, rebuild the Merkle tree, check the root matches, and
    check the signature is valid for that root.

    Returns {"valid": bool, "failures": [str, ...]}.
    This is the function your public /verify/{certificate_id} page calls,
    and it's also exactly what the "alter one byte, watch it fail" demo
    moment runs under the hood.
    """
    failures = []
    leaves = certificate.get("leaves", [])
    if not leaves:
        return {"valid": False, "failures": ["no leaves in certificate"]}

    leaf_hashes = [sha256_json(leaf) for leaf in leaves]

    for i_str, proof_data in certificate.get("proofs", {}).items():
        i = int(i_str)
        if i >= len(leaf_hashes):
            failures.append(f"leaf index {i} out of range")
            continue
        if proof_data["leaf_hash"] != leaf_hashes[i]:
            failures.append(f"leaf {i} data does not match its stored hash (tampered)")

    tree = MerkleTree(leaf_hashes)
    if tree.root != certificate.get("merkle_root"):
        failures.append("recomputed Merkle root does not match certificate root")

    sig_ok = verify_signature(
        certificate.get("merkle_root", ""),
        certificate.get("signature", ""),
        certificate.get("public_key", ""),
    )
    if not sig_ok:
        failures.append("signature invalid for the given root and public key")

    return {"valid": len(failures) == 0, "failures": failures}
