import os
import tempfile
from importlib import import_module
import atexit

TEST_DB_FD, TEST_DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(TEST_DB_FD)
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ.setdefault("API_KEY", "test-admin-key")

# Import application modules after configuring env vars

DatabaseModule = import_module("database")
MainModule = import_module("main")

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import pytest

Base = DatabaseModule.Base
engine = DatabaseModule.engine
API_KEY = os.environ["API_KEY"]

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
MainModule.API_KEY = API_KEY

atexit.register(lambda: os.path.exists(TEST_DB_PATH) and os.remove(TEST_DB_PATH))

SessionTesting = sessionmaker(bind=engine, autocommit=False, autoflush=False)

@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionTesting(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    MainModule.app.dependency_overrides[MainModule.get_db] = override_get_db
    with TestClient(MainModule.app) as test_client:
        yield test_client
    MainModule.app.dependency_overrides.clear()


@pytest.fixture()
def admin_headers():
    return {"X-Admin-Key": API_KEY}

