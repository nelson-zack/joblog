from pydantic import BaseModel
from typing import Optional
from typing import List

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
        