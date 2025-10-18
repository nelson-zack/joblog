from __future__ import annotations

from .factories import job_payload


def test_create_and_list_jobs(client, admin_headers):
    payload = job_payload()
    create_response = client.post("/jobs/", headers=admin_headers, json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    assert created["title"] == payload["title"]
    assert created["status_history"], "status history should be initialized"

    list_response = client.get("/jobs/", headers=admin_headers)
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["id"] == created["id"]


def test_status_update_appends_single_history_entry(client, admin_headers):
    payload = job_payload()
    created = client.post("/jobs/", headers=admin_headers, json=payload).json()
    job_id = created["id"]

    initial_history_len = len(created["status_history"])

    update_payload = {
        "title": created["title"],
        "company": created["company"],
        "link": created["link"],
        "status": "Offer",
        "date_applied": created["date_applied"],
        "notes": created["notes"],
        "tags": created["tags"],
        "status_history": created["status_history"],
    }

    update_response = client.put(
        f"/jobs/{job_id}", headers=admin_headers, json=update_payload
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    history = updated["status_history"]
    assert history[-1]["status"] == "Offer"
    assert len(history) == initial_history_len + 1

    # Re-save with same status should not duplicate history entries
    update_payload_again = {
        **update_payload,
        "notes": "Changed notes",
        "status_history": history,
    }
    repeat_response = client.put(
        f"/jobs/{job_id}", headers=admin_headers, json=update_payload_again
    )
    assert repeat_response.status_code == 200
    repeated = repeat_response.json()
    assert len(repeated["status_history"]) == len(history)


def test_delete_job(client, admin_headers):
    created = client.post(
        "/jobs/", headers=admin_headers, json=job_payload()
    ).json()
    job_id = created["id"]

    delete_response = client.delete(f"/jobs/{job_id}", headers=admin_headers)
    assert delete_response.status_code == 200

    list_response = client.get("/jobs/", headers=admin_headers)
    assert list_response.status_code == 200
    assert list_response.json() == []
