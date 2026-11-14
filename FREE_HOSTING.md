# Free deployment: Render + Neon + Groq

## 1. Apply the update and push

Unzip `CampusLink-free-hosting.zip` into Downloads. It contains a complete `CampusLink` project and `APPLY_UPDATE.py`. From IntelliJ's terminal inside your **existing committed CampusLink repository**, run:

```bash
python3 ~/Downloads/CampusLink-free-hosting/APPLY_UPDATE.py .
git status
```

The updater checks that tracked files are clean, verifies file hashes against the previous package, copies only changed files, and removes only the obsolete MySQL initial migration file. It preserves `.git`, `.env`, local dependencies and unrelated files. If it reports local changes, commit/back up your intended work first and resolve the differences; do not force it. It never connects to a database or changes database contents.

Then commit/push:

```bash
git add .
git commit -m "Configure free hosting with Neon and Groq"
git -c credential.helper= push -u origin main
```

Use the same GitHub fine-grained token with Contents and Workflows write access if prompted. After pushing, check GitHub Actions. The workflow now tests PostgreSQL, not MySQL.

## 2. Create a fresh Neon database

In [Neon](https://console.neon.tech/), create a project named `campuslink` on the Free plan. Choose a region close to your Render service, preferably Singapore when available. Use the default database/role or create a dedicated application database and role.

Open **Connect** and copy both connection strings privately:

| Variable | Which URL |
| --- | --- |
| `DATABASE_URL` | Connection pooling **on**; hostname normally includes `-pooler`. Used by application queries. |
| `DIRECT_URL` | Connection pooling **off**; direct hostname. Used by Prisma migrations. |

Use Neon-provided connection strings for the same database/role, retaining `sslmode=require`. For `DATABASE_URL`, add `connection_limit=3&pool_timeout=30&connect_timeout=15` using `&` if it already has a `?` query. For `DIRECT_URL`, add `connect_timeout=15` if desired. Do not manually paste raw passwords into URLs; Neon produces the properly encoded connection string.

**Use a new empty PostgreSQL database.** No old MySQL data is transferred by this update. Local MySQL data remains untouched; migrating existing data is a separate task.

## 3. Create a Groq key

In [Groq](https://console.groq.com/keys), create an API key for CampusLink. Keep it private. Stay on the Free plan and check the limits/model availability shown in your console. The configured model is `llama-3.3-70b-versatile`, which supports JSON object mode. If that model is unavailable for your account, use an available JSON-capable model through `GROQ_MODEL` and retest output quality.

Resume AI submits resume/profile/job-description text to Groq. Review its [data handling/settings](https://console.groq.com/docs/your-data) before using real students' personal data.

## 4. Deploy with the included Render blueprint

In [Render](https://dashboard.render.com/):

1. Choose **New → Blueprint** and connect `DeekshaKriti07/CampusLink`.
2. Use branch `main`. Render should detect root `render.yaml`.
3. Confirm the service plan is **Free**. The blueprint contains one Docker web service; do not add a paid Render database or background worker.
4. Fill the three prompted secrets: `DATABASE_URL`, `DIRECT_URL`, `GROQ_API_KEY`.
5. Deploy. The blueprint generates `JWT_ACCESS_SECRET` automatically. It also sets the AI provider/model, production mode, proxy hop count and timeout.

The Dockerfile builds frontend/backend, then runs `prisma migrate deploy` against `DIRECT_URL` before starting. The app listens on Render's assigned `PORT`; no custom start/build commands or separate frontend service are needed. The website and API share one `https://...onrender.com` origin. CORS automatically uses `RENDER_EXTERNAL_URL` unless you explicitly override it.

If you choose **New → Web Service** manually instead of Blueprint, select this repository, Docker runtime, repository root, Free instance and health check `/ready`. Add:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `JWT_ACCESS_SECRET` | A new random secret of at least 32 characters; generate locally with `openssl rand -hex 32` |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | Your private Groq key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `TRUST_PROXY_HOPS` | `1` |
| `AI_TIMEOUT_MS` | `60000` |

Leave `VITE_API_URL` unset. Do not set `PORT` manually; use Render's assigned value. Do not put secrets in the public repository. If using a custom domain later, set `CORS_ORIGINS` to the actual permitted origins, separated by commas.

## 5. Verify the deployed app

- Check that Render finishes the image build and migration/startup without errors.
- Open `https://YOUR-SERVICE.onrender.com/health` and `/ready`; expect `ok` and `ready` respectively.
- Register and log in. Save profile details; add skills. Use a second test account to verify requests and project membership.
- Test Resume AI with made-up sample details first. Verify structured output and factual accuracy. Check quota/error messages as well as success.
- Test calendar times, OCR, image download and browser print/PDF on desktop/mobile.
- Check `/robots.txt`, `/llms.txt`, `/.well-known/ard.json`, and `/.well-known/ai-catalog.json`.
- Run Lighthouse against this deployed site, including an authenticated dashboard. Compare results using the same device/throttling settings as before.

The local `backend` command `npm run ai:check` can verify your real Groq key/model using synthetic sample data. It needs your private backend `.env`; do not share that file. Alternatively test Resume AI through the deployed app.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Prisma connection or SSL error | Both URLs point to the same Neon PostgreSQL database, are copied completely and retain SSL; migrations use direct `DIRECT_URL`. |
| `P3019` or SQL syntax errors involving MySQL | Old MySQL migration files remain, or the wrong branch/version was deployed. Apply the updater and push the new PostgreSQL migration. Do not reset a real database. |
| Missing `GROQ_API_KEY` startup error | Add the key to Render Environment and redeploy. |
| AI quota message | Wait for the free limit to reset, shorten input or reduce request frequency. The adapter does not automatically retry requests. |
| AI upstream/model error | Check Groq key validity, account model access and the configured model name. Never paste your key into troubleshooting messages. |
| Page initially loads slowly | A free service or database may be waking after inactivity. This is a free-tier limitation. |
| Authentication expires | Sign in again; JWT sessions last 15 minutes. |

## Cost and availability limits

Keep Render, Neon and Groq on their Free plans and within their allowances; review the limits visible in each dashboard. No paid resources are requested by `render.yaml`. Free offers can change. Render explicitly positions free services for demos/hobby use rather than production workloads and can suspend idle services; Neon and Groq also have quotas. This setup cannot promise always-on availability or unlimited AI usage.

Sources checked on 14 November 2026: [Render free services](https://render.com/docs/free), [Render blueprint settings](https://render.com/docs/blueprint-spec), [Neon Prisma connection guidance](https://neon.com/docs/guides/prisma), [Groq model capabilities](https://console.groq.com/docs/model/llama-3.3-70b-versatile), and [Groq API compatibility](https://console.groq.com/docs/openai).
