"""Database models."""
import uuid
from datetime import datetime
from sqlalchemy import Column,String,Float,DateTime,ForeignKey,JSON,Text
from sqlalchemy.orm import declarative_base,relationship
from pgvector.sqlalchemy import Vector
EMBEDDING_DIMENSIONS=512
Base=declarative_base()
def gen_id():return uuid.uuid4().hex[:12]
class Project(Base):
 __tablename__="projects"
 id=Column(String,primary_key=True,default=gen_id);name=Column(String,nullable=False);site_lat=Column(Float,nullable=False);site_lng=Column(Float,nullable=False);site_radius_km=Column(Float,default=2.0);window_start=Column(String,nullable=False);window_end=Column(String,nullable=False);created_at=Column(DateTime,default=datetime.utcnow)
 assets=relationship("Asset",back_populates="project")
class Asset(Base):
 __tablename__="assets"
 id=Column(String,primary_key=True,default=gen_id);project_id=Column(String,ForeignKey("projects.id"),nullable=False);cloudinary_public_id=Column(String,nullable=False);resource_type=Column(String,default="image");sha256=Column(String,nullable=False);phash=Column(String);capture_time=Column(String);lat=Column(Float);lng=Column(Float);exif_json=Column(JSON);embedding=Column(Vector(EMBEDDING_DIMENSIONS));activity_label=Column(String);activity_score=Column(Float);tags=Column(JSON,default=list);seg_area_json=Column(JSON);count_json=Column(JSON);vision_json=Column(JSON);forensics_json=Column(JSON);created_at=Column(DateTime,default=datetime.utcnow)
 project=relationship("Project",back_populates="assets")
class Claim(Base):
 __tablename__="claims"
 id=Column(String,primary_key=True,default=gen_id);project_id=Column(String,ForeignKey("projects.id"),nullable=False);text=Column(Text,nullable=False);status=Column(String,default="pending");overall_verdict=Column(String);overall_confidence=Column(Float);created_at=Column(DateTime,default=datetime.utcnow)
class SubClaim(Base):
 __tablename__="subclaims"
 id=Column(String,primary_key=True,default=gen_id);claim_id=Column(String,ForeignKey("claims.id"),nullable=False);type=Column(String,nullable=False);statement=Column(Text,nullable=False);params_json=Column(JSON,default=dict);verdict=Column(String);confidence=Column(Float);reasons=Column(JSON,default=list)
class Evidence(Base):
 __tablename__="evidence"
 id=Column(String,primary_key=True,default=gen_id);subclaim_id=Column(String,ForeignKey("subclaims.id"),nullable=False);asset_id=Column(String,ForeignKey("assets.id"),nullable=False);role=Column(String,default="supports");detail_json=Column(JSON,default=dict)
class Comparison(Base):
 __tablename__="comparisons"
 id=Column(String,primary_key=True,default=gen_id);before_asset_id=Column(String,ForeignKey("assets.id"),nullable=False);after_asset_id=Column(String,ForeignKey("assets.id"),nullable=False);alignment_score=Column(Float);class_delta_json=Column(JSON);transform_urls=Column(JSON,default=list);analysis_json=Column(JSON)
class LedgerEntryRow(Base):
 __tablename__="ledger_entries"
 id=Column(String,primary_key=True,default=gen_id);kind=Column(String,nullable=False);payload_hash=Column(String,nullable=False);prev_hash=Column(String,nullable=False);entry_hash=Column(String,nullable=False);created_at=Column(DateTime,default=datetime.utcnow)
class Certificate(Base):
 __tablename__="certificates"
 id=Column(String,primary_key=True,default=gen_id);claim_id=Column(String,ForeignKey("claims.id"),nullable=False);merkle_root=Column(String,nullable=False);signature=Column(String,nullable=False);public_key=Column(String,nullable=False);proofs_json=Column(JSON,nullable=False);leaves_json=Column(JSON,nullable=False);created_at=Column(DateTime,default=datetime.utcnow)
class Job(Base):
 __tablename__="jobs"
 id=Column(String,primary_key=True,default=gen_id);kind=Column(String,nullable=False);status=Column(String,nullable=False,default="queued");input_json=Column(JSON,nullable=False);result_json=Column(JSON);error=Column(Text);created_at=Column(DateTime,default=datetime.utcnow);updated_at=Column(DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)
class Report(Base):
 __tablename__="reports"
 id=Column(String,primary_key=True,default=gen_id);claim_id=Column(String,ForeignKey("claims.id"),nullable=False);status=Column(String,nullable=False,default="completed");file_path=Column(String,nullable=False);created_at=Column(DateTime,default=datetime.utcnow)
