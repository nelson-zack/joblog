from __future__ import annotations

from .factories import job_payload


def test_jobs_requires_admin_key(client):
    response = client.get("/jobs/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"


def test_jobs_accepts_admin_key(client, admin_headers):
    response = client.get("/jobs/", headers=admin_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_write_operations_blocked_without_key(client):
    create = client.post("/jobs/", json=job_payload())
    assert create.status_code == 401

    update = client.put("/jobs/1", json=job_payload(status="Offer"))
    assert update.status_code == 401

    delete = client.delete("/jobs/1")
    assert delete.status_code == 401
