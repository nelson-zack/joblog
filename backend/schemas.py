from pydantic import BaseModel
from typing import Optional, List, Literal
from uuid import UUID


class StatusEntry(BaseModel):
    status: str
    date: str
    
class JobCreate(BaseModel):
    title: str
    company: str
    link: Optional[str] = None
    status: Optional[str] = "Applied"
    date_applied: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = ""
    status_history: Optional[List[StatusEntry]] = []

class JobOut(JobCreate):
    id: int
    tags: Optional[str] = ""
    status_history: Optional[List[StatusEntry]] = []

    class Config:
        from_attributes = True


class AnalyticsHeartbeat(BaseModel):
    id: UUID
    mode: Literal["demo", "local", "admin"]
    version: str
    ts: int


class AnalyticsEventIn(BaseModel):
    id: UUID
    event: Literal["job_create", "job_update", "job_delete", "export_json", "import_json"]
    ts: int


class AdminStats(BaseModel):
    unique_installs: int
    active_7d: int
    active_30d: int
    total_launches: int
    total_events: int
    jobs_created: int
    users_exported: int
