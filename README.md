# CampusLink

React/Vite + Express/Prisma + MySQL + Ollama. The production server serves both the frontend and `/api/v1` on one origin. This avoids hardcoded localhost URLs and split-host authentication/CORS problems.

## Current verification

See `VALIDATION.md` for completed checks and remaining launch gates. This is a deployment preparation package, not evidence of a completed production deployment. A live database, installed AI model, HTTPS domain and final browser audit are required.

## Deploy with Docker on a server

1. Extract this project and enter the `CampusLink` directory. Install Docker with Compose on your server.
2. Copy `.env.example` to `.env`. Generate **three different secrets** using `openssl rand -hex 32` and fill in `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, and `JWT_ACCESS_SECRET`. Set `CORS_ORIGINS` to your real HTTPS origin. Use hex passwords in Compose so the database URL needs no escaping. The old archive's `.env` is intentionally excluded; use fresh secrets.
3. Start the containers:

```bash
docker compose up -d --build
docker compose exec ollama ollama pull llama3.2
docker compose ps
docker compose logs --tail=100 app
```

The app runs migrations before starting. MySQL and model data live in named volumes. Do not delete those volumes when updating. Ollama and MySQL have no public ports. The app listens on the host's loopback port 5001.

4. Point your domain's DNS to the server. Install Caddy on that host, replace the example domain in `Caddyfile`, and use it as your Caddy configuration. It proxies HTTPS requests to `127.0.0.1:5001`. If that proxy is the only trusted hop, set `TRUST_PROXY_HOPS=1` and restart the app. Keep public access to port 5001 blocked. Check `https://YOUR-DOMAIN/health` and `/ready`.
5. Verify real registration, login, profile saving, a two-account skills exchange, project membership and resume generation. Review generated resumes for factual accuracy. Pull and pin the tested Ollama container version/digest before a production release; the provided `latest` tag is a provisioning default.
6. Run Lighthouse against the **deployed HTTPS site**, including the login page and an authenticated dashboard. Audit the production build, not `npm run dev` or port 5173. Save the report with your release record.

Ollama needs a persistent server with sufficient RAM/CPU or GPU for the selected model. Ordinary static website hosting cannot run this backend, database or model. If using an external private Ollama gateway, set `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and optionally `OLLAMA_API_KEY` on the backend; never put keys in `VITE_` variables. The model service must be protected from public access.

## Run locally on macOS

Use Node 22.12+ (Node 22 LTS recommended), a running MySQL database and Ollama. No Homebrew-specific commands are required.

```bash
npm run setup
cp backend/.env.example backend/.env
```

Edit `backend/.env`: set your MySQL connection and a new JWT secret. On a **new empty** database:

```bash
cd backend
npm run db:migrate
npm run ai:check
npm run dev
```

In a second terminal, from the project root:

```bash
npm run dev --prefix frontend
```

For a production-like local test, stop those development servers, run `npm run build` at the project root, then `npm start`. Open `http://localhost:5001`. `/health` tests the process; `/ready` also checks database connectivity. `npm run ai:check` must be run from `backend` so it loads that directory's `.env`.

If the database already contains CampusLink tables but has no Prisma migration history, **do not run the initial migration blindly**. Back it up, compare its schema with `backend/prisma/schema.prisma`, and establish an accurate Prisma baseline before `migrate deploy`. Never reset a database containing real data to make migrations pass.

## Checks

```bash
npm run lint
npm run build
npm test
npm audit --prefix frontend
npm audit --prefix backend
```

`npm test` runs HTTP and AI adapter regressions without a database and explicitly skips the MySQL workflow unless `TEST_DATABASE_URL` points to a disposable migrated MySQL database. GitHub Actions provisions MySQL and runs that workflow on push/PR, followed by a Docker build. Check the workflow result before release.

Optional real-browser smoke checks after a production build, with a **disposable** database configured in the shell:

```bash
npm install --no-save playwright
npx playwright install chromium
NODE_ENV=test node qa/browser-smoke.mjs
```

This creates and removes one test user. Never point automated tests at a production database. Run Lighthouse separately in Chrome DevTools against `http://localhost:5001/login`, then log in and audit the dashboard. For meaningful comparisons, keep Lighthouse device and throttling settings the same.

## AI behavior

- Resume generation/formatting uses Ollama (`llama3.2` by default). The model is configured on the server, with a 120-second timeout and at most two simultaneous model requests per process.
- JSON outputs are parsed and validated before saving or rendering. Invalid, truncated or unavailable outputs produce a controlled error. Source prompts instruct the model not to invent facts; this does not guarantee factual accuracy. Review every resume before use.
- Resume scores are **keyword match estimates**, not predictions of a proprietary ATS or hiring outcome. Skills matching is deterministic, not an AI model.
- Private resume/profile content is sent to the configured model service. Choose that service deliberately and communicate its data handling to your users.
- OCR loads only on image upload; it downloads the Tesseract worker/model on demand. The CSP permits the required jsDelivr and tessdata origins. Test OCR on the deployed host, especially if changing those providers or CSP.
- `/llms.txt`, `/.well-known/ard.json` and the legacy AI catalog describe discovery only. No unauthenticated agent tools or private student data are advertised.

## Operations

Use an HTTPS reverse proxy, database backups with a tested restore process, and monitoring for `/ready` and errors. The included rate limiter and AI concurrency cap are per process; a multi-instance deployment needs a shared rate-limit store and a model queue/capacity plan. JWT sessions expire after 15 minutes and require signing in again; sign out removes the browser token. Password reset and email verification are not implemented. Decide whether they are required for your launch audience. Database migrations should run once as a release job when scaling to multiple replicas.

Before upgrades, back up MySQL and test migrations on a restored copy. Retain the prior image for rollback; schema changes may require a forward fix rather than an image-only rollback. Do not commit `.env`, database dumps, model keys or `node_modules` to GitHub.
