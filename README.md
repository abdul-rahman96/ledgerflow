# LedgerFlow

LedgerFlow is a clean-room financial data operations control plane: import a synthetic CSV, validate and deduplicate its rows, reconcile source evidence against a normalized ledger, and roll back a batch without destroying its audit trail.

It is a portfolio project, not a fork or modernization of an employer/client system. The repository is MIT-licensed and uses synthetic records only.

- [Live full-stack product](https://ledgerflow-web-steel.vercel.app/)
- [Live API health](https://ledgerflow-api-nine.vercel.app/health)
- [Static fallback walkthrough](https://abdul-rahman96.github.io/ledgerflow/)
- [v0.1.1 release and video](https://github.com/abdul-rahman96/ledgerflow/releases/tag/v0.1.1)
- API image: `ghcr.io/abdul-rahman96/ledgerflow-api:0.1.1`
- [Project defense and system-design guide](docs/DEFENSE_PREPARATION.md)
- [Deployment security and gatekeeping](docs/DEPLOYMENT_SECURITY.md)

## Product surface

- **Overview** — cash movement, control health, queue priority, and recent batches.
- **Ledger** — provenance-aware normalized entries with decimal amounts and UTC timestamps.
- **Import & validate** — strict CSV preview, row quarantine, and idempotent commit.
- **Reconciliation** — source-versus-ledger variance ordered by material impact.
- **Audit & rollback** — append-only events and reversible batch state.

## Stack

- Next.js 16, TypeScript, Tailwind CSS, shadcn/Radix, self-hosted Geist
- FastAPI, SQLAlchemy 2, PostgreSQL 17
- Docker Compose for the complete local stack
- GitHub Actions for lint, type checking, tests, builds, secret scanning, Pages deployment, and GHCR image releases

All application dependencies in this repository are free/open source. GitHub Pages and public-repository Actions/GHCR can run without an external paid service. The Vercel deployment path is designed for free-tier hosting and a reviewed free-tier Marketplace PostgreSQL plan.

## Run with Docker

```bash
docker compose up --build
```

- UI: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

The Compose credentials are explicit local-only placeholders. External connectors are disabled.

## Run without Docker

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd apps/web
npm ci
npm run dev
```

The API defaults to local SQLite when DATABASE_URL is absent, while Compose uses PostgreSQL. Production refuses SQLite, wildcard CORS, or a weak/missing write key.

## CSV contract

```text
external_id,occurred_at,description,amount,currency,account
```

See fixtures/september-settlements.csv and docs/CONNECTORS.md.

## CI/CD

The CI workflow gates changes on secret scanning, API lint/tests, web lint/type checks/static export, and both container builds. On main, the verified static site is deployed to GitHub Pages. Tagged releases publish the API image to GHCR using only the repository-scoped GITHUB_TOKEN. The live full-stack deployment uses separate Vercel web/API projects and a free-tier managed PostgreSQL database. Its public interface is read-only; preview, import, and rollback require a server-side operator key that is never shipped to the browser.

## Clean-room boundary

See docs/adr/0001-clean-room-reconstruction.md. No legacy credentials are trusted even if they are believed to be expired; they are excluded rather than tested or reused.
