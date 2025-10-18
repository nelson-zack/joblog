from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from freezegun import freeze_time


def test_analytics_heartbeat_and_stats(client, admin_headers):
    modes = ("demo", "local", "admin")
    frozen_time = "2025-01-01T12:00:00Z"

    with freeze_time(frozen_time):
        current_ts = int(datetime.utcnow().timestamp() * 1000)
        for index, mode in enumerate(modes, start=1):
            install_id = str(uuid4())
            heartbeat_payload = {
                "id": install_id,
                "mode": mode,
                "version": "test",
                "ts": current_ts + index,
            }
            heartbeat_response = client.post(
                "/analytics/heartbeat", json=heartbeat_payload
            )
            assert heartbeat_response.status_code == 204

            event_payload = {
                "id": install_id,
                "event": f"job_create_{mode}",
                "ts": current_ts + index + 10,
            }
            event_response = client.post(
                "/analytics/event", json=event_payload
            )
            assert event_response.status_code == 204

    with freeze_time(frozen_time):
        stats_response = client.get("/admin/stats", headers=admin_headers)
    assert stats_response.status_code == 200
    data = stats_response.json()

    assert data["unique_installs"] == 3
    assert data["active_7d"] == 3
    assert data["active_30d"] == 3
    assert data["total_launches"] == 3
    assert data["total_events"] == 3
    assert data["jobs_created"] == 3

    by_mode = data["by_mode"]
    for mode in modes:
        bucket = by_mode[mode]
        assert bucket["launches"] == 1
        assert bucket["installs"] == 1
        assert bucket["active_7d"] == 1
        assert bucket["active_30d"] == 1
        assert bucket["events_total"] == 1
        assert bucket["jobs_created"] == 1
        assert bucket["users_exported"] == 0
