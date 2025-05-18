from sqlalchemy import Column, Integer, String, Date
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    link = Column(String)
    status = Column(String)
    date_applied = Column(String)  # Can use Date if you prefer
    notes = Column(String)