# Deployment security

LedgerFlow uses a split public/read and private/write model. The portfolio UI and synthetic read endpoints are public so reviewers can inspect the system. Preview, import, and rollback are operator operations and require a high-entropy secret that is stored only in the API host.

Current production endpoints:

- Web: https://ledgerflow-web-steel.vercel.app/
- API health: https://ledgerflow-api-nine.vercel.app/health

## Trust boundaries

```mermaid
flowchart LR
    Visitor[Public visitor] --> Edge[Vercel edge and DDoS protection]
    Edge --> Web[Next.js portfolio UI]
    Web -->|server-side GET only| API[FastAPI]
    Operator[Authorized operator] -->|X-LedgerFlow-Write-Key| API
    API --> DB[(Managed PostgreSQL)]
    API -. blocked without key .-> Mutations[Preview / import / rollback]
```

- The browser never receives `WRITE_API_KEY` or database credentials.
- Next.js fetches live read models on the server. GitHub Pages continues to use deterministic fixtures.
- FastAPI checks mutation keys with constant-time comparison and assigns the audit actor server-side.
- Production startup fails if the write key is shorter than 32 characters, CORS is wildcarded, or the database is SQLite.
- CSV uploads require an accepted MIME type and `.csv` extension, are read only to a one-megabyte ceiling, and reject empty bodies.
- Production API docs and the OpenAPI document are disabled.
- API and web responses include restrictive framing, content-type, referrer, permissions, HSTS, and content-security headers.

## Required Vercel settings

Create separate Vercel projects rooted at `apps/api` and `apps/web`.

API environment:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `ENVIRONMENT=production` | Preview and production | Enables fail-closed checks and hides API docs |
| `DATABASE_URL` | Preview and production | Managed PostgreSQL connection; never SQLite |
| `WRITE_API_KEY` | Preview and production, sensitive | At least 32 random characters; mutation authorization |
| `CORS_ORIGINS` | Preview and production | Exact web origins, comma separated; never `*` |
| `CONNECTOR_MODE=fixture` | Preview and production | Prevents unreviewed external connectors |
| `MAX_UPLOAD_BYTES=1048576` | Preview and production | Application-level upload ceiling |

Web environment:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `LEDGERFLOW_API_URL` | Preview and production | Server-only API origin; do not prefix with `NEXT_PUBLIC_` |

Use a Vercel Marketplace PostgreSQL resource with a free plan when available. Review the provider plan before provisioning. The database URL and write key must be marked sensitive and must never be copied into GitHub Actions logs or repository files.

## Edge controls

Vercel system DDoS mitigations remain enabled. Preview deployments should use Vercel Authentication. The production UI remains public; mutation routes are authenticated in the application.

After the API project exists:

1. Add a firewall rule matching `POST /api/v1/imports*` with a generous rate threshold and action `log`.
2. Add a log-only rule for common exploit-probe paths.
3. Review traffic and false positives.
4. Inspect the staged diff and preview enforcement.
5. The account owner publishes the firewall configuration only after review.

Do not begin with a broad deny rule. Attack Mode is an incident control, not a permanent substitute for endpoint authorization.

The two rules are currently staged in log-only mode and are not published. The account owner must inspect the Vercel firewall diff and publish them explicitly. They do not block traffic until publication, and log mode should be observed before any enforcement action is considered.

## Optional Cloudflare layer

Wrangler is installed locally, but no Cloudflare account is authenticated and no Cloudflare-managed custom hostname has been selected. The current `vercel.app` deployment should not be proxied through an improvised second routing layer. If a custom portfolio domain is added later, Cloudflare Access can gate an operator surface and Cloudflare WAF/rate controls can protect that hostname while Vercel remains the origin. Store Cloudflare credentials outside the repository and grant only the minimum zone/account permissions needed.

## Verification

The release gate must prove:

- unauthenticated mutations return `401`;
- missing production secrets or durable storage fail startup;
- over-limit uploads return `413`;
- static Pages and dynamic Vercel builds both compile;
- API lint/tests, web lint/type checks, secret scanning, and container builds pass;
- the preview deployment is checked before production promotion;
- production GETs succeed while an unauthenticated POST stays blocked;
- Vercel runtime logs show no new error cluster after promotion.

## Incident response

If abuse is observed, enable Attack Mode for a bounded period, inspect runtime and firewall logs, and rotate `WRITE_API_KEY`. If database credentials may be exposed, rotate them through the provider, update Vercel environment variables, redeploy, and invalidate the old credential. Never pause Vercel system mitigations.
