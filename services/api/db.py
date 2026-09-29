import os
from dotenv import load_dotenv
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker
from services.api.models import Base
load_dotenv()
DATABASE_URL=os.environ.get("DATABASE_URL")
if not DATABASE_URL:raise RuntimeError("DATABASE_URL is required; configure .env")
engine=create_engine(DATABASE_URL,pool_pre_ping=True);SessionLocal=sessionmaker(bind=engine,autoflush=False,autocommit=False)
def init_db():
 with engine.begin() as conn:
  conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
  old=conn.execute(text("SELECT data_type FROM information_schema.columns WHERE table_name='assets' AND column_name='embedding'")).scalar()
  if old and old!="USER-DEFINED":conn.execute(text("ALTER TABLE assets ALTER COLUMN embedding TYPE vector(768) USING NULL"))
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
