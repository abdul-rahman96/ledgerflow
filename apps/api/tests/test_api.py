from uuid import uuid4

from fastapi.testclient import TestClient

from app.connectors import FixtureConnector
from app.main import app

WRITE_HEADERS = {"X-LedgerFlow-Write-Key": "test-write-key"}


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
        first = client.post(
            "/api/v1/imports",
            files=files,
            data={"idempotency_key": key},
            headers=WRITE_HEADERS,
        )
        second = client.post(
            "/api/v1/imports",
            files=files,
            data={"idempotency_key": key},
            headers=WRITE_HEADERS,
        )

        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["id"] == second.json()["id"]

        rollback = client.post(
            f"/api/v1/imports/{first.json()['id']}/rollback",
            headers=WRITE_HEADERS,
        )
        assert rollback.status_code == 200
        assert rollback.json()["status"] == "rolled_back"


def test_mutations_require_write_access() -> None:
    files = {"file": ("fixture.csv", FixtureConnector().csv_bytes(), "text/csv")}
    with TestClient(app) as client:
        response = client.post("/api/v1/imports/preview", files=files)

    assert response.status_code == 401
    assert response.json()["detail"] == "valid write access is required"


def test_upload_size_is_bounded() -> None:
    files = {"file": ("large.csv", b"x" * 1_048_577, "text/csv")}
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/imports/preview",
            files=files,
            headers=WRITE_HEADERS,
        )

    assert response.status_code == 413


def test_api_responses_include_security_headers() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
