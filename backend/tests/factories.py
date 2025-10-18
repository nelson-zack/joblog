from __future__ import annotations

from typing import Any, Dict

from faker import Faker

fake = Faker()


def job_payload(**overrides: Any) -> Dict[str, Any]:
    date_applied = overrides.get("date_applied", fake.date())
    status = overrides.get("status", "Applied")
    payload = {
        "title": overrides.get("title", fake.job()),
        "company": overrides.get("company", fake.company()),
        "link": overrides.get("link", fake.url()),
        "status": status,
        "date_applied": date_applied,
        "notes": overrides.get("notes", fake.text(max_nb_chars=120)),
        "tags": overrides.get("tags", "Remote"),
        "status_history": overrides.get(
            "status_history",
            [
                {
                    "status": "Applied",
                    "date": date_applied,
                }
            ],
        ),
    }
    payload.update(overrides)
    return payload
