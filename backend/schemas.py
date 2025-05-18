from pydantic import BaseModel
from typing import Optional

class JobCreate(BaseModel):
    title: str
    company: str
    link: Optional[str] = None
    status: Optional[str] = "Applied"
    date_applied: Optional[str] = None
    notes: Optional[str] = None

class JobOut(JobCreate):
    id: int

    class Config:
        orm_mode = True