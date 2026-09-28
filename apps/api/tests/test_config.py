import pytest
from pydantic import ValidationError

from app.config import Settings


def test_production_configuration_fails_closed_without_durable_storage() -> None:
    with pytest.raises(ValidationError, match="durable database"):
        Settings(
            environment="production",
            write_api_key="x" * 32,
            database_url="sqlite:///ledgerflow.db",
            cors_origins="https://ledgerflow.example",
        )


def test_production_configuration_rejects_weak_write_key() -> None:
    with pytest.raises(ValidationError, match="at least 32 characters"):
        Settings(
            environment="production",
            write_api_key="too-short",
            database_url="postgresql://example.invalid/ledgerflow",
            cors_origins="https://ledgerflow.example",
        )
