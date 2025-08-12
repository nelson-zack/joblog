from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import re
from datetime import date

from database import Base, engine, SessionLocal
import models
import schemas
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://joblog.zacknelson.dev"
]


# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables
Base.metadata.create_all(bind=engine)

# Dependency: get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === API Key Protection ===
API_KEY = os.environ.get("API_KEY")

def verify_api_key(request: Request):
    key = request.query_params.get("key")
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

# === Normalization Helpers ===
_DATE_RE = re.compile(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$")

def normalize_ymd(s: str | None) -> str | None:
    """
    Accepts 'YYYY-MM-DD' or 'YYYY/M/D' or 'YYYY-MM-D' variants and returns strict 'YYYY-MM-DD'.
    Returns None on invalid input (including impossible dates).
    """
    if not s:
        return None
    m = _DATE_RE.match(s.strip())
    if not m:
        return None
    y, mo, d = map(int, m.groups())
    try:
        return date(y, mo, d).strftime("%Y-%m-%d")
    except ValueError:
        return None

def normalize_tags(csv: str | None) -> str:
    """
    Trim and dedupe tags in a comma-separated list.
    """
    if not csv:
        return ""
    seen = []
    for t in (x.strip() for x in csv.split(",")):
        if t and t not in seen:
            seen.append(t)
    return ",".join(seen)

@app.get("/")
def read_root():
    return {"message": "Job Tracker API is live"}

@app.post("/jobs/", response_model=schemas.JobOut, dependencies=[Depends(verify_api_key)])
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    job_data = job.dict()

    # Normalize date_applied
    date_norm = normalize_ymd(job_data.get("date_applied")) or date.today().strftime("%Y-%m-%d")
    job_data["date_applied"] = date_norm

    # Normalize status_history dates; ensure structure is consistent
    raw_hist = job_data.get("status_history") or []
    norm_hist = []
    for entry in raw_hist:
        status_val = entry.get("status")
        date_val = normalize_ymd(entry.get("date")) or date_norm
        if status_val:
            norm_hist.append({"status": status_val, "date": date_val})
    job_data["status_history"] = norm_hist

    # Normalize tags
    job_data["tags"] = normalize_tags(job_data.get("tags"))

    db_job = models.Job(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get("/jobs/", response_model=list[schemas.JobOut])
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

@app.delete("/jobs/{job_id}", dependencies=[Depends(verify_api_key)])
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).get(job_id)
    if not job:
        return {"error": "Job not found"}
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

@app.put("/jobs/{job_id}", response_model=schemas.JobOut, dependencies=[Depends(verify_api_key)])
def update_job(job_id: int, updated_job: schemas.JobCreate, db: Session = Depends(get_db)):
    job = db.query(models.Job).get(job_id)
    if not job:
        return {"error": "Job not found"}

    updated_data = updated_job.dict()

    # Normalize tags
    updated_data["tags"] = normalize_tags(updated_data.get("tags"))

    # Normalize date_applied if provided; otherwise keep existing
    if updated_data.get("date_applied") is not None:
        date_norm = normalize_ymd(updated_data.get("date_applied")) or job.date_applied or date.today().strftime("%Y-%m-%d")
        updated_data["date_applied"] = date_norm
    else:
        date_norm = job.date_applied or date.today().strftime("%Y-%m-%d")

    # Normalize any provided status_history entries
    raw_hist = updated_data.get("status_history") or []
    norm_hist = []
    for entry in raw_hist:
        status_val = entry.get("status")
        date_val = normalize_ymd(entry.get("date")) or date_norm
        if status_val:
            norm_hist.append({"status": status_val, "date": date_val})
    updated_data["status_history"] = norm_hist

    # If status changed, append a history entry with today's (or date_applied) date
    if updated_data.get("status") is not None and updated_data["status"] != job.status:
        append_date = date_norm or date.today().strftime("%Y-%m-%d")
        # Ensure existing history is a list
        if not isinstance(job.status_history, list):
            job.status_history = []
        job.status_history.append({"status": updated_data["status"], "date": append_date})

    # Apply updates
    for key, value in updated_data.items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)
    return job