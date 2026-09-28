# Security

## Credentials

LedgerFlow's connectors are intentionally keyless. It ships only with local fixture and CSV connectors. No value from a legacy repository, account, environment file, pipeline, or third-party integration is copied into this project.

Expired credentials are still treated as compromised material: they must not be reused, tested, logged, or committed. If a real connector is added later, create a new least-privilege credential and store it in a secret manager or protected GitHub environment.

CI runs a secret scan on every pull request and push. The env example contains only explicit local-development placeholders.

A deployed API uses a newly generated operator key for mutation authorization and a managed database credential. Both exist only in the deployment secret store. They are not connector keys, are never exposed to browser code, and are never committed.

## Deployed attack surface

The public application is read-only. CSV preview, import, and rollback require a secret header, upload size and type are constrained, CORS origins are explicit, production documentation is disabled, and unsafe production configuration fails startup. Vercel's automatic DDoS protections remain enabled. See [the deployment security runbook](docs/DEPLOYMENT_SECURITY.md).

## Reporting

Do not open a public issue containing a credential or sensitive data. Contact the repository owner privately with a concise reproduction.
