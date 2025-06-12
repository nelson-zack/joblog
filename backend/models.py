from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.dialects.sqlite import JSON
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    link = Column(String)
    status = Column(String)
    date_applied = Column(String)  
    notes = Column(String)
    tags = Column(String)  # comma-separated values (e.g., "remote,referral")
    status_history = Column(JSON, default=list)