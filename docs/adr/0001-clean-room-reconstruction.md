# ADR 0001: Build LedgerFlow as a clean-room portfolio project

- Status: Accepted
- Date: 2026-09-28

## Context

The portfolio needs a credible financial data operations artifact without publishing, adapting, or implying ownership of prior employer or client work.

## Decision

LedgerFlow is authored from a blank repository with a new name, new data model, new UI, synthetic fixtures, and new documentation. It does not copy code, database schemas, migrations, assets, branding, commit history, credentials, or proprietary sample data from any prior system.

The first release supports only CSV and fixture connectors. Money uses fixed-precision decimals, timestamps are UTC, imports are idempotent, audit events are append-only, and rollback is represented as a compensating state change rather than deletion.

## Consequences

The public artifact can be explained and demonstrated independently. Real provider connectivity is deferred until fresh scoped credentials, provider-specific threat modeling, and contract tests exist.
