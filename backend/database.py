import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load from environment, or fall back to local SQLite for dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobs.db")

# Use different connect_args depending on the database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def ensure_indexes():
    statements = [
        "CREATE INDEX IF NOT EXISTS ix_analytics_installs_last_seen ON analytics_installs (last_seen)",
        "CREATE INDEX IF NOT EXISTS ix_analytics_events_install_id ON analytics_events (install_id)",
        "CREATE INDEX IF NOT EXISTS ix_analytics_events_event ON analytics_events (event)",
    ]
    with engine.begin() as connection:
        for stmt in statements:
            connection.exec_driver_sql(stmt)
