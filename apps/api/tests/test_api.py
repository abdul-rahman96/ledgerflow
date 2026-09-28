from uuid import uuid4

from fastapi.testclient import TestClient

from app.connectors import FixtureConnector
from app.main import app


def test_health_and_seeded_ledger() -> None:
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        entries = client.get("/api/v1/entries")
        assert entries.status_code == 200
        assert len(entries.json()) >= 3


def test_import_is_idempotent_and_reversible() -> None:
    key = f"test-{uuid4()}"
    files = {"file": ("fixture.csv", FixtureConnector().csv_bytes(), "text/csv")}
    with TestClient(app) as client:
        first = client.post("/api/v1/imports", files=files, data={"idempotency_key": key})
        second = client.post("/api/v1/imports", files=files, data={"idempotency_key": key})

        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["id"] == second.json()["id"]

        rollback = client.post(f"/api/v1/imports/{first.json()['id']}/rollback")
        assert rollback.status_code == 200
        assert rollback.json()["status"] == "rolled_back"
