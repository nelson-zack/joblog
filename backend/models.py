from sqlalchemy import Column, Integer, String, Date, DateTime
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


class AnalyticsInstall(Base):
    __tablename__ = "analytics_installs"

    id = Column(String, primary_key=True, index=True)
    first_seen = Column(DateTime, nullable=False)
    last_seen = Column(DateTime, nullable=False)
    launch_count = Column(Integer, default=0, nullable=False)
    mode = Column(String, nullable=True)
    version = Column(String, nullable=True)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    install_id = Column(String, nullable=False, index=True)
    event = Column(String, nullable=False)
    ts = Column(DateTime, nullable=False)
