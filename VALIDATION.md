# CampusLink free-hosting update — 14 November 2026

## Changes

- PostgreSQL replaces MySQL for the requested Neon deployment. A fresh PostgreSQL initial migration replaces the previous MySQL initial migration; existing MySQL data is not copied or deleted.
- Groq is the hosted default, using server-side credentials, JSON object mode, validated resume output, bounded concurrency and timeout. Ollama remains an optional provider.
- Groq quota errors return HTTP 429 with a retry message; malformed AI JSON returns HTTP 502. No key or provider response body is printed in logs.
- `render.yaml` defines one Free Docker service with Neon/Groq secrets entered in the dashboard and an automatically generated JWT secret.
- Docker health checks respect the assigned `PORT`. Same-origin API serving and automatic Render origin handling avoid separate frontend configuration.
- CI and optional local Compose now use PostgreSQL. A privacy notice explains external AI processing in Resume AI.
- The previous performance, accessibility, crawler, authentication, input validation and security-header improvements remain in place.

## Checks completed here

| Check | Result |
| --- | --- |
| PostgreSQL schema/client generation | Passed |
| Initial migration executed on a fresh local PostgreSQL 18 instance | Passed |
| Real PostgreSQL multi-user workflow | Passed: registration, login, profile persistence, skills matching, request permissions, project acceptance/deletion and concurrent booking conflict |
| HTTP and AI adapter regressions | 6 tests passed, including Groq request shape, malformed/invalid/truncated response handling, quota and missing-key failures; this suite separately skips its DB test when no test database URL is supplied |
| Backend TypeScript build | Passed |
| Frontend production build | Passed |
| Frontend lint | Passed without warnings |
| Dependency audits | Zero reported vulnerabilities when checked |
| DOM rendering smoke check | 11 routes checked with fixture API data; not a real browser layout audit |

The database workflow was executed separately with a real temporary PostgreSQL instance. GitHub Actions provisions PostgreSQL 16; that remote CI run has not been executed here. The migration uses compatible SQL features.

## Not yet verified

- Live Neon connectivity/credentials, Render deployment and Docker execution on that host.
- Real Groq key, quota/model access, response quality and latency. Adapter tests use a controlled fake upstream; they are not a live model benchmark.
- A new Lighthouse/browser layout run, OCR downloads and image/PDF export on the deployed host. This workspace cannot start Chromium because required browser socket operations are blocked.

Use FREE_HOSTING.md to deploy and complete these checks. The source is prepared for a free student/demo deployment; this report does not claim an already running deployment, unlimited free capacity or production availability guarantees.
