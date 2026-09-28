from contextlib import asynccontextmanager
from dataclasses import asdict
from decimal import Decimal
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.connectors import CsvConnector
from app.db import Base, SessionLocal, engine, get_session
from app.models import AuditEvent, ImportBatch, LedgerEntry, ReconciliationItem
from app.schemas import AuditEventRead, ImportBatchRead, LedgerEntryRead
from app.security import read_csv_upload, require_write_access
from app.services import commit_import, rollback_import, seed_demo_data

settings = get_settings()
csv_connector = CsvConnector()
SessionDep = Annotated[Session, Depends(get_session)]
CsvUpload = Annotated[UploadFile, File()]
IdempotencyKey = Annotated[str, Form()]
WriteAccess = Annotated[None, Depends(require_write_access)]


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_demo_data(session)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Clean-room ledger import, reconciliation, and audit API.",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type", "X-LedgerFlow-Write-Key"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ledgerflow-api", "connector_mode": settings.connector_mode}


@app.get("/api/v1/dashboard")
def dashboard(session: SessionDep) -> dict:
    inflow = session.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.amount > 0)
    )
    outflow = session.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.amount < 0)
    )
    reviews = session.scalar(
        select(func.count()).select_from(LedgerEntry).where(LedgerEntry.status == "review")
    )
    return {
        "currency": "USD",
        "inflow": str(inflow),
        "outflow": str(abs(Decimal(outflow))),
        "net": str(Decimal(inflow) + Decimal(outflow)),
        "entries_needing_review": reviews,
    }


@app.get("/api/v1/entries", response_model=list[LedgerEntryRead])
def list_entries(session: SessionDep) -> list[LedgerEntry]:
    return list(session.scalars(select(LedgerEntry).order_by(desc(LedgerEntry.occurred_at))).all())


@app.post("/api/v1/imports/preview", dependencies=[Depends(require_write_access)])
async def preview_import(file: CsvUpload) -> dict:
    try:
        result = csv_connector.validate(await read_csv_upload(file))
    except (UnicodeDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {
        "file_name": file.filename,
        "accepted": [row.serializable() for row in result.accepted],
        "rejected": [asdict(row) for row in result.rejected],
    }


@app.post("/api/v1/imports", response_model=ImportBatchRead)
async def create_import(
    file: CsvUpload,
    idempotency_key: IdempotencyKey,
    session: SessionDep,
    _: WriteAccess,
) -> ImportBatch:
    if not idempotency_key.strip() or len(idempotency_key) > 128:
        raise HTTPException(status_code=422, detail="idempotency key must be 1 to 128 characters")
    try:
        result = csv_connector.validate(await read_csv_upload(file))
    except (UnicodeDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    batch, _ = commit_import(
        session,
        file_name=file.filename or "upload.csv",
        idempotency_key=idempotency_key,
        validation=result,
        actor=settings.audit_actor,
    )
    return batch


@app.get("/api/v1/imports", response_model=list[ImportBatchRead])
def list_imports(session: SessionDep) -> list[ImportBatch]:
    return list(session.scalars(select(ImportBatch).order_by(desc(ImportBatch.created_at))).all())


@app.post(
    "/api/v1/imports/{batch_id}/rollback",
    response_model=ImportBatchRead,
    dependencies=[Depends(require_write_access)],
)
def rollback_batch(
    batch_id: str,
    session: SessionDep,
) -> ImportBatch:
    batch = session.get(ImportBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="import batch not found")
    return rollback_import(session, batch, settings.audit_actor)


@app.get("/api/v1/reconciliations")
def list_reconciliations(session: SessionDep) -> list[dict]:
    rows = session.execute(
        select(ReconciliationItem, LedgerEntry)
        .join(LedgerEntry, ReconciliationItem.entry_id == LedgerEntry.id)
        .order_by(desc(func.abs(ReconciliationItem.variance)))
    ).all()
    return [
        {
            "id": item.id,
            "entry_id": entry.id,
            "external_id": entry.external_id,
            "account": entry.account,
            "ledger_amount": str(entry.amount),
            "source_amount": str(item.source_amount),
            "variance": str(item.variance),
            "status": item.status,
        }
        for item, entry in rows
    ]


@app.get("/api/v1/audit-events", response_model=list[AuditEventRead])
def list_audit_events(session: SessionDep) -> list[AuditEvent]:
    return list(session.scalars(select(AuditEvent).order_by(desc(AuditEvent.occurred_at))).all())
