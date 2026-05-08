from __future__ import annotations

import importlib

from fastapi.testclient import TestClient


def _client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'focus.sqlite'}")
    import app.database as database
    import app.database_ext as database_ext
    import app.main as main

    importlib.reload(database)
    importlib.reload(database_ext)
    importlib.reload(main)
    return TestClient(main.create_app())


def test_default_entry_types_and_crud(tmp_path, monkeypatch):
    with _client(tmp_path, monkeypatch) as client:
        types_response = client.get("/api/entry-types")
        assert types_response.status_code == 200
        entry_types = types_response.json()
        assert [row["name"] for row in entry_types] == [
            "Appointment",
            "Deadline",
            "Important",
            "Summary",
        ]
        appointment = next(row for row in entry_types if row["name"] == "Appointment")

        create_response = client.post(
            "/api/entries",
            json={
                "date": "2026-05-08",
                "time": None,
                "title": "Review inbox",
                "notes": "Daily summary",
                "entry_type_id": appointment["id"],
                "source": "manual",
            },
        )
        assert create_response.status_code == 200
        entry = create_response.json()
        assert entry["time"] is None
        assert entry["entry_type_name"] == "Appointment"

        update_response = client.put(
            f"/api/entries/{entry['id']}",
            json={
                "date": "2026-05-09",
                "time": "09:30",
                "title": "Updated review",
                "notes": None,
                "entry_type_id": appointment["id"],
                "source": "manual",
            },
        )
        assert update_response.status_code == 200
        assert update_response.json()["time"] == "09:30"

        assert client.delete(f"/api/entries/{entry['id']}").status_code == 200
        assert client.get(f"/api/entries/{entry['id']}").status_code == 404


def test_entry_sorting_all_day_then_time(tmp_path, monkeypatch):
    with _client(tmp_path, monkeypatch) as client:
        appointment = next(
            row for row in client.get("/api/entry-types").json() if row["name"] == "Appointment"
        )
        for title, time in [
            ("Afternoon call", "15:00"),
            ("Whole day focus", None),
            ("Morning deadline", "08:00"),
        ]:
            response = client.post(
                "/api/entries",
                json={
                    "date": "2026-05-08",
                    "time": time,
                    "title": title,
                    "entry_type_id": appointment["id"],
                },
            )
            assert response.status_code == 200

        rows = client.get("/api/entries?start=2026-05-01&end=2026-05-31").json()
        assert [row["title"] for row in rows] == [
            "Whole day focus",
            "Morning deadline",
            "Afternoon call",
        ]


def test_summary_entries_are_one_all_day_entry_per_date(tmp_path, monkeypatch):
    with _client(tmp_path, monkeypatch) as client:
        summary = next(
            row for row in client.get("/api/entry-types").json() if row["name"] == "Summary"
        )
        important = next(
            row for row in client.get("/api/entry-types").json() if row["name"] == "Important"
        )

        first_summary = client.post(
            "/api/entries",
            json={
                "date": "2026-05-08",
                "time": "09:30",
                "title": "Daily summary",
                "notes": "A compact summary of the day.",
                "entry_type_id": summary["id"],
            },
        )
        assert first_summary.status_code == 200
        assert first_summary.json()["time"] is None

        duplicate_summary = client.post(
            "/api/entries",
            json={
                "date": "2026-05-08",
                "title": "Another daily summary",
                "entry_type_id": summary["id"],
            },
        )
        assert duplicate_summary.status_code == 409

        important_response = client.post(
            "/api/entries",
            json={
                "date": "2026-05-09",
                "title": "Important detail",
                "entry_type_id": important["id"],
            },
        )
        assert important_response.status_code == 200

        conflicting_update = client.put(
            f"/api/entries/{important_response.json()['id']}",
            json={
                "date": "2026-05-08",
                "title": "Converted summary",
                "entry_type_id": summary["id"],
            },
        )
        assert conflicting_update.status_code == 409

        same_summary_update = client.put(
            f"/api/entries/{first_summary.json()['id']}",
            json={
                "date": "2026-05-08",
                "time": "18:45",
                "title": "Updated daily summary",
                "entry_type_id": summary["id"],
            },
        )
        assert same_summary_update.status_code == 200
        assert same_summary_update.json()["time"] is None


def test_time_validation(tmp_path, monkeypatch):
    with _client(tmp_path, monkeypatch) as client:
        summary = next(
            row for row in client.get("/api/entry-types").json() if row["name"] == "Summary"
        )
        response = client.post(
            "/api/entries",
            json={
                "date": "2026-05-08",
                "time": "25:15",
                "title": "Invalid time",
                "entry_type_id": summary["id"],
            },
        )
        assert response.status_code == 422


def test_mcp_bulk_create_and_update(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'mcp.sqlite'}")
    import app.database as database
    import app.database_ext as database_ext
    import app.mcp_server as mcp_server

    importlib.reload(database)
    importlib.reload(database_ext)
    importlib.reload(mcp_server)

    types_result = mcp_server.list_entry_types({})
    appointment = next(row for row in types_result["entry_types"] if row["name"] == "Appointment")
    created = mcp_server.bulk_create_entries(
        {
            "entries": [
                {
                    "date": "2026-05-08",
                    "title": "Email appointment",
                    "entry_type_id": appointment["id"],
                    "source": "gmail",
                    "gmail_thread_id": "thread-1",
                }
            ]
        }
    )
    assert created["success"] is True
    entry_id = created["entries"][0]["id"]

    listed = mcp_server.list_entries({"start": "2026-05-08", "end": "2026-05-08"})
    assert [entry["id"] for entry in listed["entries"]] == [entry_id]
    viewed = mcp_server.get_entry({"entry_id": entry_id})
    assert viewed["entry"]["title"] == "Email appointment"

    updated = mcp_server.update_entry(
        {
            "entry_id": entry_id,
            "date": "2026-05-08",
            "time": "10:00",
            "title": "Email appointment updated",
            "entry_type_id": appointment["id"],
        }
    )
    assert updated["entry"]["time"] == "10:00"
    assert mcp_server.delete_entry({"entry_id": entry_id})["success"] is True


def test_mcp_bulk_create_by_type_name(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'mcp-by-name.sqlite'}")
    import app.database as database
    import app.database_ext as database_ext
    import app.mcp_server as mcp_server

    importlib.reload(database)
    importlib.reload(database_ext)
    importlib.reload(mcp_server)

    created = mcp_server.bulk_create_entries_by_type_name(
        {
            "entries": [
                {
                    "date": "2026-05-08",
                    "time": "11:52",
                    "title": "Firma electronica exitosa",
                    "entry_type_name": "Important",
                    "source": "gmail",
                    "gmail_thread_id": "thread-1",
                    "gmail_message_id": "message-1",
                }
            ]
        }
    )

    assert created["success"] is True
    assert created["entries"][0]["entry_type_name"] == "Important"
    assert created["entries"][0]["time"] == "11:52"
