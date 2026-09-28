from app.connectors import CsvConnector, FixtureConnector


def test_fixture_connector_is_valid() -> None:
    result = CsvConnector().validate(FixtureConnector().csv_bytes())

    assert len(result.accepted) == 2
    assert result.rejected == []
    assert str(result.accepted[0].amount) == "18400.00"


def test_duplicate_external_id_is_quarantined() -> None:
    payload = (
        b"external_id,occurred_at,description,amount,currency,account\n"
        b"DUP-1,2026-09-28T08:31:00Z,First,1.00,USD,Revenue\n"
        b"DUP-1,2026-09-28T08:32:00Z,Second,2.00,USD,Revenue\n"
    )

    result = CsvConnector().validate(payload)

    assert len(result.accepted) == 1
    assert result.rejected[0].reason == "duplicate external_id in file"
