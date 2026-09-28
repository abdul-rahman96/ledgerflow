# Connector policy

LedgerFlow begins with two deliberately safe connectors:

- FixtureConnector produces deterministic synthetic records for local demos and tests.
- CsvConnector accepts a documented six-column format, validates ISO timestamps and decimal amounts, and quarantines duplicate or malformed rows.

There are no live banking, payment, accounting, or cloud connectors in this public build. There are no copied environment values.

## Adding a future connector

1. Start with a new provider application and a new least-privilege credential.
2. Keep the interface read-only until audit and idempotency behavior is proven.
3. Store credentials outside Git using a protected environment or secret manager.
4. Add contract tests with mocked provider responses.
5. Document scopes, rotation, revocation, and data-retention behavior before enabling it.
