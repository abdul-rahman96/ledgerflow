# Security

## Credentials

LedgerFlow is intentionally keyless. It ships only with local fixture and CSV connectors. No value from a legacy repository, account, environment file, pipeline, or third-party integration is copied into this project.

Expired credentials are still treated as compromised material: they must not be reused, tested, logged, or committed. If a real connector is added later, create a new least-privilege credential and store it in a secret manager or protected GitHub environment.

CI runs a secret scan on every pull request and push. The env example contains only explicit local-development placeholders.

## Reporting

Do not open a public issue containing a credential or sensitive data. Contact the repository owner privately with a concise reproduction.
