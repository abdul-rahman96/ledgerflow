from secrets import compare_digest
from typing import Annotated

from fastapi import Header, HTTPException, UploadFile, status

from app.config import get_settings

WriteKey = Annotated[str | None, Header(alias="X-LedgerFlow-Write-Key")]


def require_write_access(write_key: WriteKey = None) -> None:
    """Deny every mutation unless a server-managed key is configured and supplied."""
    configured = get_settings().write_api_key
    if configured is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="write operations are disabled",
        )
    candidate = write_key or ""
    if not compare_digest(candidate, configured.get_secret_value()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="valid write access is required",
            headers={"WWW-Authenticate": "LedgerFlow-Write-Key"},
        )


async def read_csv_upload(file: UploadFile) -> bytes:
    settings = get_settings()
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    accepted_types = {"text/csv", "application/csv", "application/vnd.ms-excel"}
    if not filename.endswith(".csv") or content_type not in accepted_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="upload must be a CSV file",
        )

    payload = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    if len(payload) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"CSV exceeds the {settings.max_upload_bytes}-byte limit",
        )
    if not payload:
        raise HTTPException(status_code=422, detail="CSV file is empty")
    return payload
