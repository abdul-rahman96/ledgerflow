# LedgerFlow Operator

This Next.js application is the private mutation surface for LedgerFlow. It is deployed as an isolated Vercel project with Vercel Authentication enabled for every deployment.

## Trust model

- The browser submits CSVs only to same-origin route handlers.
- Route handlers require an exact same-origin `Origin` header.
- `WRITE_API_KEY` and `LEDGERFLOW_API_URL` are server-only environment variables.
- Inputs are revalidated before forwarding: CSV filename, MIME type, non-empty body, one-MiB maximum, and a bounded idempotency key.
- The upstream API independently validates the same file contract and write key.
- Rollback requires a second explicit confirmation in the UI and creates compensating state rather than deleting records.
- Responses are private/no-store and the deployment is excluded from indexing.

## Local run

Start the API first, then:

```bash
npm ci
LEDGERFLOW_API_URL=http://localhost:8000 WRITE_API_KEY=local_dev_only_replace_me npm run dev
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The tests cover same-origin enforcement, CSV validation and limits, and idempotency-key validation. CI runs every gate before GitHub Pages can deploy the public fallback.
