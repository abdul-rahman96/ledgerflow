from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class LedgerEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    external_id: str
    occurred_at: datetime
    description: str
    amount: Decimal
    currency: str
    account: str
    source: str
    status: str
    source_batch_id: str


class ImportBatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    file_name: str
    idempotency_key: str
    status: str
    imported_count: int
    rejected_count: int
    created_at: datetime
    rolled_back_at: datetime | None


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action: str
    entity_type: str
    entity_id: str
    actor: str
    event_metadata: dict
    occurred_at: datetime
