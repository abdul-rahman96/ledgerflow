from functools import lru_cache

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LedgerFlow API"
    environment: str = "development"
    database_url: str = "sqlite:///./ledgerflow.db"
    cors_origins: str = "http://localhost:3000"
    connector_mode: str = "fixture"
    write_api_key: SecretStr | None = None
    max_upload_bytes: int = 1_048_576
    audit_actor: str = "portfolio-operator"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if not self.is_production:
            return self
        if self.write_api_key is None or len(self.write_api_key.get_secret_value()) < 32:
            raise ValueError("production requires a write API key of at least 32 characters")
        if "*" in self.allowed_origins:
            raise ValueError("production CORS origins must be explicit")
        if self.database_url.startswith("sqlite"):
            raise ValueError("production requires a durable database")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
