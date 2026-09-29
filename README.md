# LedgerFlow

LedgerFlow is a clean-room financial data operations control plane: import a synthetic CSV, validate and deduplicate its rows, reconcile source evidence against a normalized ledger, and roll back a batch without destroying its audit trail.

It is a portfolio project, not a fork or modernization of an employer/client system. The repository is MIT-licensed and uses synthetic records only.

- [Live full-stack product](https://ledgerflow-web-steel.vercel.app/)
- [Protected operator workspace](https://ledgerflow-operator.vercel.app/) — Vercel account access required
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
- **Protected operator** — live CSV preview, explicit idempotent commit, compensating rollback, and audit evidence behind Vercel Authentication.

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

To run the separate operator console, provide server-only local values and start its Next.js runtime:

```bash
cd apps/operator
npm ci
LEDGERFLOW_API_URL=http://localhost:8000 WRITE_API_KEY=local_dev_only_replace_me npm run dev
```

The browser calls only same-origin operator routes. Those routes inject the write key on the server; the key is never included in client JavaScript. Production uses a rotated random value rather than the Compose placeholder.

The API defaults to local SQLite when DATABASE_URL is absent, while Compose uses PostgreSQL. Production refuses SQLite, wildcard CORS, or a weak/missing write key.

## CSV contract

```text
external_id,occurred_at,description,amount,currency,account
```

See fixtures/september-settlements.csv and docs/CONNECTORS.md.

## CI/CD

The CI workflow gates changes on secret scanning, API lint/tests, public-web lint/type checks/static export, operator lint/type checks/security tests/build, and both container builds. On main, the verified static site is deployed to GitHub Pages. Tagged releases publish the API image to GHCR using only the repository-scoped GITHUB_TOKEN. The live deployment uses separate Vercel web, API, and operator projects plus a free-tier managed PostgreSQL database. The public interface remains read-only. The operator deployment is protected on every URL by Vercel Authentication and forwards mutations through server-only routes using a scoped API write key.

## Clean-room boundary

See docs/adr/0001-clean-room-reconstruction.md. No legacy credentials are trusted even if they are believed to be expired; they are excluded rather than tested or reused.
