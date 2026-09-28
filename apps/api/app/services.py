from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.connectors import ValidationResult
from app.models import AuditEvent, ImportBatch, LedgerEntry, ReconciliationItem


def seed_demo_data(session: Session) -> None:
    if session.scalar(select(func.count()).select_from(ImportBatch)):
        return

    batch = ImportBatch(
        file_name="fixture-seed.csv",
        idempotency_key="fixture-seed-v1",
        status="committed",
        imported_count=3,
        rejected_count=0,
    )
    session.add(batch)
    session.flush()
    entries = [
        LedgerEntry(
            external_id="FIX-1001",
            occurred_at=datetime(2026, 9, 28, 8, 31, tzinfo=UTC),
            description="Synthetic subscription settlement",
            amount=Decimal("18400.00"),
            currency="USD",
            account="Revenue - SaaS",
            source="fixture",
            status="matched",
            source_batch_id=batch.id,
        ),
        LedgerEntry(
            external_id="FIX-1002",
            occurred_at=datetime(2026, 9, 28, 9, 10, tzinfo=UTC),
            description="Synthetic cloud infrastructure",
            amount=Decimal("-4720.18"),
            currency="USD",
            account="Operations - Cloud",
            source="fixture",
            status="matched",
            source_batch_id=batch.id,
        ),
        LedgerEntry(
            external_id="FIX-1003",
            occurred_at=datetime(2026, 9, 28, 10, 5, tzinfo=UTC),
            description="Synthetic partner settlement",
            amount=Decimal("26750.00"),
            currency="USD",
            account="Revenue - Services",
            source="fixture",
            status="review",
            source_batch_id=batch.id,
        ),
    ]
    session.add_all(entries)
    session.flush()
    session.add(
        ReconciliationItem(
            entry_id=entries[2].id,
            source_amount=Decimal("26775.00"),
            variance=Decimal("-25.00"),
            status="review",
        )
    )
    session.add(
        AuditEvent(
            action="fixture_seeded",
            entity_type="import_batch",
            entity_id=batch.id,
            actor="system",
            event_metadata={"synthetic": True, "entry_count": 3},
        )
    )
    session.commit()


def commit_import(
    session: Session,
    *,
    file_name: str,
    idempotency_key: str,
    validation: ValidationResult,
    actor: str,
) -> tuple[ImportBatch, bool]:
    existing = session.scalar(
        select(ImportBatch).where(ImportBatch.idempotency_key == idempotency_key)
    )
    if existing:
        return existing, True

    batch = ImportBatch(
        file_name=file_name,
        idempotency_key=idempotency_key,
        status="committed",
        imported_count=len(validation.accepted),
        rejected_count=len(validation.rejected),
    )
    session.add(batch)
    session.flush()
    session.add_all(
        [
            LedgerEntry(
                external_id=row.external_id,
                occurred_at=row.occurred_at,
                description=row.description,
                amount=row.amount,
                currency=row.currency,
                account=row.account,
                source="csv",
                status="pending",
                source_batch_id=batch.id,
            )
            for row in validation.accepted
        ]
    )
    session.add(
        AuditEvent(
            action="import_committed",
            entity_type="import_batch",
            entity_id=batch.id,
            actor=actor,
            event_metadata={
                "file_name": file_name,
                "imported": len(validation.accepted),
                "rejected": len(validation.rejected),
            },
        )
    )
    session.commit()
    session.refresh(batch)
    return batch, False


def rollback_import(session: Session, batch: ImportBatch, actor: str) -> ImportBatch:
    if batch.status == "rolled_back":
        return batch
    entries = session.scalars(
        select(LedgerEntry).where(LedgerEntry.source_batch_id == batch.id)
    ).all()
    for entry in entries:
        entry.status = "rolled_back"
    batch.status = "rolled_back"
    batch.rolled_back_at = datetime.now(UTC)
    session.add(
        AuditEvent(
            action="import_rolled_back",
            entity_type="import_batch",
            entity_id=batch.id,
            actor=actor,
            event_metadata={"compensated_entries": len(entries)},
        )
    )
    session.commit()
    session.refresh(batch)
    return batch
