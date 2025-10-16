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

    launch_event = models.AnalyticsEvent(
        install_id=install_id,
        event=f"launch_{payload.mode}",
        ts=seen_at,
    )
    db.add(launch_event)
    db.commit()
    return Response(status_code=204)


@app.post("/analytics/event", status_code=204)
def analytics_event(payload: schemas.AnalyticsEventIn, db: Session = Depends(get_db)):
    event_name = payload.event
    base_event = event_name
    if event_name not in ALLOWED_ANALYTICS_EVENTS:
        base_part, sep, suffix = event_name.rpartition("_")
        if sep and suffix in {"demo", "local", "admin"} and base_part in ALLOWED_ANALYTICS_EVENTS:
            base_event = base_part
        else:
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
    launch_event_names = {f"launch_{m}" for m in ("demo", "local", "admin")}

    by_mode = {mode: schemas.ModeBucket() for mode in ("demo", "local", "admin")}
    launch_events = (
        db.query(models.AnalyticsEvent.event, func.count(models.AnalyticsEvent.id))
        .filter(models.AnalyticsEvent.event.in_(launch_event_names))
        .group_by(models.AnalyticsEvent.event)
        .all()
    )
    for event_name, count in launch_events:
        _, mode_key = event_name.split("_", 1)
        if mode_key in by_mode:
            by_mode[mode_key].launches = count

    launch_installs = (
        db.query(models.AnalyticsEvent.event, func.count(func.distinct(models.AnalyticsEvent.install_id)))
        .filter(models.AnalyticsEvent.event.in_(launch_event_names))
        .group_by(models.AnalyticsEvent.event)
        .all()
    )
    for event_name, count in launch_installs:
        _, mode_key = event_name.split("_", 1)
        if mode_key in by_mode:
            by_mode[mode_key].installs = count

    launch_active7 = (
        db.query(models.AnalyticsEvent.event, func.count(func.distinct(models.AnalyticsEvent.install_id)))
        .filter(models.AnalyticsEvent.event.in_(launch_event_names))
        .filter(models.AnalyticsEvent.ts >= seven_days_ago)
        .group_by(models.AnalyticsEvent.event)
        .all()
    )
    for event_name, count in launch_active7:
        _, mode_key = event_name.split("_", 1)
        if mode_key in by_mode:
            by_mode[mode_key].active_7d = count

    launch_active30 = (
        db.query(models.AnalyticsEvent.event, func.count(func.distinct(models.AnalyticsEvent.install_id)))
        .filter(models.AnalyticsEvent.event.in_(launch_event_names))
        .filter(models.AnalyticsEvent.ts >= thirty_days_ago)
        .group_by(models.AnalyticsEvent.event)
        .all()
    )
    for event_name, count in launch_active30:
        _, mode_key = event_name.split("_", 1)
        if mode_key in by_mode:
            by_mode[mode_key].active_30d = count

    install_modes = {
        install_id: mode_value
        for install_id, mode_value in db.query(models.AnalyticsInstall.id, models.AnalyticsInstall.mode)
    }

    total_events = 0
    jobs_created = 0
    users_exported = 0

    event_rows = (
        db.query(models.AnalyticsEvent.event, models.AnalyticsEvent.install_id)
        .filter(~models.AnalyticsEvent.event.in_(launch_event_names))
        .all()
    )

    for event_name, install_id in event_rows:
        base_event = event_name
        mode_for_event = None

        if event_name in ALLOWED_ANALYTICS_EVENTS:
            mode_for_event = install_modes.get(install_id)
        else:
            base_part, sep, suffix = event_name.rpartition("_")
            if sep and base_part in ALLOWED_ANALYTICS_EVENTS and suffix in by_mode:
                base_event = base_part
                mode_for_event = suffix

        total_events += 1
        if base_event == "job_create":
            jobs_created += 1
        elif base_event == "export_json":
            users_exported += 1

        if mode_for_event in by_mode:
            by_mode[mode_for_event].events_total += 1
            if base_event == "job_create":
                by_mode[mode_for_event].jobs_created += 1
            elif base_event == "export_json":
                by_mode[mode_for_event].users_exported += 1

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
