import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker

import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resume_analysis.db")

# Render and other deployment platforms may provide database URLs starting with postgres://
# SQLAlchemy 1.4+ requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student") # "student", "mentor", "admin"
    reset_code = Column(String, nullable=True)
    reset_code_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=False)
    parsed_json = Column(Text, nullable=False) # Store serialized JSON representation
    created_at = Column(DateTime, default=datetime.utcnow)

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    overall_score = Column(Integer, nullable=False)
    section_scores = Column(Text, nullable=False) # JSON string of category scores
    recommendations = Column(Text, nullable=False) # JSON string of recommendations list
    role_matches = Column(Text, nullable=False) # JSON string of matches
    created_at = Column(DateTime, default=datetime.utcnow)

class Version(Base):
    __tablename__ = "versions"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    prev_resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    version_number = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

# Database initialization helper
def init_db():
    Base.metadata.create_all(bind=engine)
    # Check and add columns dynamically using sqlalchemy connection
    try:
        with engine.begin() as conn:
            # PRAGMA table_info is sqlite specific
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            columns = [col[1] for col in res]
            if "reset_code" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_code VARCHAR"))
            if "reset_code_expires" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_code_expires DATETIME"))
    except Exception as e:
        print(f"Error altering users table: {e}")

