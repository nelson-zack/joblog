from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import re
from datetime import date, datetime, timedelta

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


# === Analytics ===
ALLOWED_ANALYTICS_EVENTS = {
    "job_create",
    "job_update",
    "job_delete",
    "export_json",
    "import_json",
}


def _ts_to_datetime(ts: int) -> datetime:
    # Accept milliseconds or seconds epoch
    value = ts / 1000 if ts > 10**11 else ts
    return datetime.utcfromtimestamp(value)


@app.post("/analytics/heartbeat", status_code=204)
def analytics_heartbeat(payload: schemas.AnalyticsHeartbeat, db: Session = Depends(get_db)):
    seen_at = _ts_to_datetime(payload.ts)
    install_id = str(payload.id)

    install = db.query(models.AnalyticsInstall).get(install_id)
    if install is None:
        install = models.AnalyticsInstall(
            id=install_id,
            first_seen=seen_at,
            last_seen=seen_at,
            launch_count=1,
            mode=payload.mode,
            version=payload.version,
        )
        db.add(install)
    else:
        install.last_seen = seen_at
        install.launch_count = (install.launch_count or 0) + 1
        install.mode = payload.mode
        install.version = payload.version

    db.commit()
    return Response(status_code=204)


@app.post("/analytics/event", status_code=204)
def analytics_event(payload: schemas.AnalyticsEventIn, db: Session = Depends(get_db)):
    if payload.event not in ALLOWED_ANALYTICS_EVENTS:
        raise HTTPException(status_code=400, detail="Unsupported event type")

    event_ts = _ts_to_datetime(payload.ts)
    event = models.AnalyticsEvent(
        install_id=str(payload.id),
        event=payload.event,
        ts=event_ts,
    )
    db.add(event)
    db.commit()
    return Response(status_code=204)


@app.get("/admin/stats", response_model=schemas.AdminStats, dependencies=[Depends(verify_api_key)])
def admin_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    unique_installs = db.query(models.AnalyticsInstall).count()
    active_7d = db.query(models.AnalyticsInstall).filter(models.AnalyticsInstall.last_seen >= seven_days_ago).count()
    active_30d = db.query(models.AnalyticsInstall).filter(models.AnalyticsInstall.last_seen >= thirty_days_ago).count()
    total_launches = db.query(func.coalesce(func.sum(models.AnalyticsInstall.launch_count), 0)).scalar() or 0
    total_events = db.query(func.count(models.AnalyticsEvent.id)).scalar() or 0
    jobs_created = db.query(models.AnalyticsEvent).filter(models.AnalyticsEvent.event == "job_create").count()
    users_exported = db.query(models.AnalyticsEvent).filter(models.AnalyticsEvent.event == "export_json").count()

    by_mode = {mode: schemas.ModeBucket() for mode in ("demo", "local", "admin")}

    install_counts = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsInstall.id))
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in install_counts:
        if mode in by_mode:
            by_mode[mode].installs = count

    active7_counts = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsInstall.id))
        .filter(models.AnalyticsInstall.last_seen >= seven_days_ago)
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in active7_counts:
        if mode in by_mode:
            by_mode[mode].active_7d = count

    active30_counts = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsInstall.id))
        .filter(models.AnalyticsInstall.last_seen >= thirty_days_ago)
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in active30_counts:
        if mode in by_mode:
            by_mode[mode].active_30d = count

    launch_sums = (
        db.query(models.AnalyticsInstall.mode, func.coalesce(func.sum(models.AnalyticsInstall.launch_count), 0))
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, launches in launch_sums:
        if mode in by_mode:
            by_mode[mode].launches = int(launches or 0)

    events_per_mode = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsEvent.id))
        .join(
            models.AnalyticsInstall,
            models.AnalyticsInstall.id == models.AnalyticsEvent.install_id,
        )
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in events_per_mode:
        if mode in by_mode:
            by_mode[mode].events_total = count

    jobs_created_per_mode = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsEvent.id))
        .join(
            models.AnalyticsInstall,
            models.AnalyticsInstall.id == models.AnalyticsEvent.install_id,
        )
        .filter(models.AnalyticsEvent.event == "job_create")
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in jobs_created_per_mode:
        if mode in by_mode:
            by_mode[mode].jobs_created = count

    users_exported_per_mode = (
        db.query(models.AnalyticsInstall.mode, func.count(models.AnalyticsEvent.id))
        .join(
            models.AnalyticsInstall,
            models.AnalyticsInstall.id == models.AnalyticsEvent.install_id,
        )
        .filter(models.AnalyticsEvent.event == "export_json")
        .group_by(models.AnalyticsInstall.mode)
        .all()
    )
    for mode, count in users_exported_per_mode:
        if mode in by_mode:
            by_mode[mode].users_exported = count

    return schemas.AdminStats(
        unique_installs=unique_installs,
        active_7d=active_7d,
        active_30d=active_30d,
        total_launches=int(total_launches),
        total_events=total_events,
        jobs_created=jobs_created,
        users_exported=users_exported,
        by_mode=by_mode,
    )
