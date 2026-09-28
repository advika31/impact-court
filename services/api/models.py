"""
Impact Court - Database models (SQLAlchemy)

Note on embeddings: we store them as a plain JSON array of floats, NOT a
pgvector column. At hackathon scale (dozens to a few hundred assets), doing
cosine similarity in plain Python is fast enough and needs zero extra
Postgres setup. If you have spare time later, swap to pgvector for a real
speed upgrade - not needed to win the hackathon.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    site_lat = Column(Float, nullable=False)
    site_lng = Column(Float, nullable=False)
    site_radius_km = Column(Float, default=2.0)
    window_start = Column(String, nullable=False)  # ISO date string, e.g. "2026-03-01"
    window_end = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assets = relationship("Asset", back_populates="project")


class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    cloudinary_public_id = Column(String, nullable=False)
    resource_type = Column(String, default="image")  # image | video
    sha256 = Column(String, nullable=False)
    phash = Column(String, nullable=True)
    capture_time = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    exif_json = Column(JSON, nullable=True)
    embedding = Column(JSON, nullable=True)  # list[float] - see note above
    activity_label = Column(String, nullable=True)
    activity_score = Column(Float, nullable=True)
    tags = Column(JSON, default=list)
    seg_area_json = Column(JSON, nullable=True)
    count_json = Column(JSON, nullable=True)
    forensics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="assets")


class Claim(Base):
    __tablename__ = "claims"
    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    text = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending | audited | certified
    overall_verdict = Column(String, nullable=True)
    overall_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SubClaim(Base):
    __tablename__ = "subclaims"
    id = Column(String, primary_key=True, default=gen_id)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False)
    type = Column(String, nullable=False)
    statement = Column(Text, nullable=False)
    params_json = Column(JSON, default=dict)
    verdict = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    reasons = Column(JSON, default=list)


class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(String, primary_key=True, default=gen_id)
    subclaim_id = Column(String, ForeignKey("subclaims.id"), nullable=False)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    role = Column(String, default="supports")  # supports | contradicts | context
    detail_json = Column(JSON, default=dict)


class Comparison(Base):
    __tablename__ = "comparisons"
    id = Column(String, primary_key=True, default=gen_id)
    before_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    after_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    alignment_score = Column(Float, nullable=True)
    class_delta_json = Column(JSON, nullable=True)
    transform_urls = Column(JSON, default=list)


class LedgerEntryRow(Base):
    __tablename__ = "ledger_entries"
    id = Column(String, primary_key=True, default=gen_id)
    kind = Column(String, nullable=False)
    payload_hash = Column(String, nullable=False)
    prev_hash = Column(String, nullable=False)
    entry_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(String, primary_key=True, default=gen_id)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False)
    merkle_root = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    public_key = Column(String, nullable=False)
    proofs_json = Column(JSON, nullable=False)
    leaves_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
