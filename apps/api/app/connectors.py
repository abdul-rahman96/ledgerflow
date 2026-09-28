import csv
import io
from dataclasses import asdict, dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation

REQUIRED_COLUMNS = {
    "external_id",
    "occurred_at",
    "description",
    "amount",
    "currency",
    "account",
}


@dataclass(frozen=True)
class ValidatedRow:
    external_id: str
    occurred_at: datetime
    description: str
    amount: Decimal
    currency: str
    account: str

    def serializable(self) -> dict:
        result = asdict(self)
        result["occurred_at"] = self.occurred_at.isoformat()
        result["amount"] = str(self.amount)
        return result


@dataclass(frozen=True)
class RejectedRow:
    row: int
    reason: str


@dataclass(frozen=True)
class ValidationResult:
    accepted: list[ValidatedRow]
    rejected: list[RejectedRow]


class CsvConnector:
    """Keyless CSV connector with strict schema and duplicate validation."""

    def validate(self, payload: bytes) -> ValidationResult:
        text = payload.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(reader.fieldnames):
            missing = sorted(REQUIRED_COLUMNS - set(reader.fieldnames or []))
            raise ValueError(f"missing required columns: {', '.join(missing)}")

        accepted: list[ValidatedRow] = []
        rejected: list[RejectedRow] = []
        seen: set[str] = set()
        for row_number, row in enumerate(reader, start=2):
            try:
                external_id = row["external_id"].strip()
                if not external_id:
                    raise ValueError("external_id is empty")
                if external_id in seen:
                    raise ValueError("duplicate external_id in file")
                occurred_at = datetime.fromisoformat(row["occurred_at"].replace("Z", "+00:00"))
                amount = Decimal(row["amount"])
                currency = row["currency"].strip().upper()
                if len(currency) != 3:
                    raise ValueError("currency must be a 3-letter code")
                accepted.append(
                    ValidatedRow(
                        external_id=external_id,
                        occurred_at=occurred_at,
                        description=row["description"].strip(),
                        amount=amount,
                        currency=currency,
                        account=row["account"].strip(),
                    )
                )
                seen.add(external_id)
            except (InvalidOperation, KeyError, ValueError) as error:
                rejected.append(RejectedRow(row=row_number, reason=str(error)))
        return ValidationResult(accepted=accepted, rejected=rejected)


class FixtureConnector:
    """Deterministic local source for demos and tests; it requires no credentials."""

    def csv_bytes(self) -> bytes:
        return (
            b"external_id,occurred_at,description,amount,currency,account\n"
            b"FIX-1001,2026-09-28T08:31:00Z,Synthetic subscription,18400.00,USD,Revenue - SaaS\n"
            b"FIX-1002,2026-09-28T09:10:00Z,Synthetic cloud cost,-4720.18,USD,Operations - Cloud\n"
        )
