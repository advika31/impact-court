import os
from dotenv import load_dotenv
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker
from services.api.models import Base,EMBEDDING_DIMENSIONS
load_dotenv()
DATABASE_URL=os.environ.get("DATABASE_URL")
if not DATABASE_URL:raise RuntimeError("DATABASE_URL is required; configure .env")
engine=create_engine(DATABASE_URL,pool_pre_ping=True);SessionLocal=sessionmaker(bind=engine,autoflush=False,autocommit=False)
def init_db():
 with engine.begin() as conn:
  conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
  current=conn.execute(text("""SELECT format_type(a.atttypid,a.atttypmod) FROM pg_attribute a
    JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname='assets' AND a.attname='embedding' AND a.attnum>0 AND NOT a.attisdropped
    AND n.nspname=current_schema()""")).scalar()
  expected=f"vector({EMBEDDING_DIMENSIONS})"
  if current and current!=expected:
   # Drop incompatible legacy JSON/768-d vectors rather than leave an invalid
   # column that cannot accept the current 512-d embedding outputs.
   conn.execute(text(f"ALTER TABLE assets ALTER COLUMN embedding TYPE {expected} USING NULL"))
 Base.metadata.create_all(bind=engine)
 # create_all does not add columns to tables created by older app versions.
 with engine.begin() as conn:
  additions={"assets":{"vision_json":"JSON"},"comparisons":{"analysis_json":"JSON"}}
  for table,columns in additions.items():
   for column,kind in columns.items():conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {kind}"))
  conn.execute(text("CREATE INDEX IF NOT EXISTS assets_embedding_cosine_idx ON assets USING hnsw (embedding vector_cosine_ops)"))
def get_db():
 db=SessionLocal()
 try:yield db
 finally:db.close()
