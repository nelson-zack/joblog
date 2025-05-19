from pydantic import BaseModel
from typing import Optional

class JobCreate(BaseModel):
    title: str
    company: str
    link: Optional[str] = None
    status: Optional[str] = "Applied"
    date_applied: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = ""

class JobOut(JobCreate):
    id: int
    tags: Optional[str] = ""

    class Config:
        orm_mode = True