# CampusLink

A campus collaboration application built with React/Vite, Express, Prisma and PostgreSQL, with Groq-powered resume assistance. Local Ollama remains an optional AI provider.

## Free online deployment

Use **Render Free** for the combined website/API, **Neon Free PostgreSQL** for persistent data, and **Groq Free** for hosted AI. See [FREE_HOSTING.md](FREE_HOSTING.md) for the exact account setup, environment variables and deployment steps. `render.yaml` configures a free Docker web service and generates the JWT secret.

This is a usage-limited student/demo deployment. Free hosting can sleep or hit quotas and does not provide production availability guarantees. The code is prepared for hosting; the real Render/Neon/Groq deployment is not claimed to have run until it is configured and tested in those accounts.

**Database change:** this edition uses PostgreSQL. Use a new empty Neon database. The PostgreSQL migration is not a MySQL data migration; existing local users/data are not automatically transferred. Never apply it to a MySQL database or reset a database containing real data.

## Local development

Use Node 22.12+ and PostgreSQL. From the project root:

```bash
npm run setup
cp backend/.env.example backend/.env
```

Fill `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `AI_PROVIDER=groq` and `GROQ_API_KEY` in `backend/.env`. Never commit the real `.env`. For a local PostgreSQL server without a pooler, the two database URLs can be the same. Neon uses the pooled URL for application queries and direct URL for migrations; keep SSL enabled on Neon.

```bash
cd backend
npm run db:migrate
npm run ai:check
npm run dev
```

In another terminal, from the project root:

```bash
npm run dev --prefix frontend
```

For a production-like local test, stop development servers, run `npm run build` and then `npm start` at the project root. The production server serves both the website and `/api/v1` on port 5001. Audit this output with Lighthouse, not the Vite development server on port 5173.

Optional local containers: copy root `.env.example` to `.env`, fill its PostgreSQL/Groq/JWT settings, then run `docker compose up -d --build`. Compose runs PostgreSQL and the app. It is not used for Render; Render connects to Neon. Keep named database volumes, and back up real data before changes.

## Checks

```bash
npm run lint
npm run build
npm test
npm audit --prefix frontend
npm audit --prefix backend
```

`npm test` runs HTTP/AI adapter tests and explicitly skips the database workflow unless `TEST_DATABASE_URL` points to a disposable migrated PostgreSQL database. GitHub Actions provisions PostgreSQL and runs it automatically on push/PR, followed by a Docker build. See [VALIDATION.md](VALIDATION.md) for the checks actually completed.

Optional browser smoke check, after builds, using a disposable database and its environment variables:

```bash
npm install --no-save playwright
npx playwright install chromium
NODE_ENV=test node qa/browser-smoke.mjs
```

It creates and removes one test user. Set `DATABASE_URL`, `DIRECT_URL`, and `JWT_ACCESS_SECRET` in that terminal first. Never use a production database for automated tests.

## AI and privacy

- Hosted default: `AI_PROVIDER=groq`, `GROQ_MODEL=llama-3.3-70b-versatile`, and a private server-side `GROQ_API_KEY`. No model downloads or separate GPU server are needed.
- Groq receives the resume/profile/job-description text submitted for AI processing. A notice appears in Resume AI. Choose the provider deliberately and review its data settings before handling real student data.
- To run locally with Ollama instead, set `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. This retains local-inference support, but the database remains PostgreSQL.
- Model calls have a configurable timeout, a two-request concurrency limit per process, no automatic provider fallback, and output validation. Quota errors return a clear retry message. Invalid/truncated JSON is never saved as a generated resume.
- Generated facts need human review. The numeric score is a keyword match estimate, not a proprietary ATS or hiring prediction. Skills matching is deterministic.
- OCR loads only when needed and uses Tesseract worker/model downloads. Test OCR, image export and PDF print on the real deployed host.

## Operations

Use HTTPS, backups with a tested restore, and monitoring appropriate to your audience. Render handles public TLS. `/health` checks the process and `/ready` checks PostgreSQL. Rate/concurrency limits are per process; multiple replicas require shared limits and migration coordination. JWT sessions expire after 15 minutes and require sign-in again. Password reset and email verification are not implemented. Do not put secrets in `VITE_` variables, GitHub, screenshots or chat.
