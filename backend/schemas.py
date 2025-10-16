from pydantic import BaseModel
from typing import Optional, List, Literal, Dict
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
    event: str
    ts: int


class ModeBucket(BaseModel):
    installs: int = 0
    active_7d: int = 0
    active_30d: int = 0
    launches: int = 0
    events_total: int = 0
    jobs_created: int = 0
    users_exported: int = 0


class AdminStats(BaseModel):
    unique_installs: int
    active_7d: int
    active_30d: int
    total_launches: int
    total_events: int
    jobs_created: int
    users_exported: int
    by_mode: Dict[Literal["demo", "local", "admin"], ModeBucket]
