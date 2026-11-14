# CampusLink deployment preparation — 14 November 2026

## Outcome

The supplied source has been updated and builds successfully. The code is prepared for deployment, with important release gates still unverified: live MySQL workflows, live Ollama model output, Docker execution and a new browser/Lighthouse run. Do not describe this package as a fully certified production release until those gates pass.

## Lighthouse findings addressed

| Supplied finding | Change |
| --- | --- |
| Large, unminified JavaScript and Vite development modules | Production `vite build`; Express serves `frontend/dist`; development middleware is absent from the output. |
| Unused html2canvas and Tesseract code on initial load | Resume AI is a lazy route. Image export and OCR libraries load only when used. |
| Google Fonts request chains and render-blocking CSS | Fonts are self-hosted via locked Fontsource dependencies with font-display swap. Removed both remote font stylesheets. |
| Primary button contrast | Explicit readable foreground/background pairs in light and dark themes. Browser contrast recheck still required. |
| Unnamed profile link/accessibility tree failure | Added a stable accessible link name, even before the avatar loads. Added field labels, request-dialog focus handling and reduced-motion support. |
| Unauthorized startup requests | Guest pages do not mount protected screens. Expired token requests are stopped locally; user-specific data loads only after successful identity lookup. Server authorization remains enforced. |
| Missing meta description/title | Added CampusLink title, description and theme color. |
| robots.txt returned index.html | Added a real text file; missing extension-based resources return 404. |
| llms.txt missing heading/links | Added a real Markdown file with public page links and authentication boundaries. |
| Invalid ai-catalog JSON | Added schema-valid empty legacy catalogs and a current ARD manifest. There are no public callable AI tools to advertise. Both catalog schema generations were validated. |

## Additional changes

- Same-origin API URL by default; development proxy and environment examples.
- Backend build/start/migration scripts; initial MySQL migration; non-root Docker image; persistent Compose database and model volumes; HTTPS reverse-proxy example.
- Security headers/CSP, response compression, immutable caching for hashed assets, no-store API responses, bounded request bodies and rate limits.
- Required environment validation, graceful shutdown, liveness and database-readiness endpoints, sanitized error responses.
- Input validation for dates, IDs, pagination, text, partial updates and URLs. Restricted JWT verification algorithm, stronger new-account passwords and email normalization.
- Skill requests can only be accepted/rejected by the receiver. Booking conflicts and team acceptance use serializable transactions; project deletion is transactional. Non-owners do not receive project application records.
- Ollama URL/model/key configuration, bounded concurrency, input/output limits, timeout, JSON mode, runtime resume schema validation, malformed/truncated response rejection and a live model smoke-check command.
- Removed instructions encouraging invented resume metrics. Restored source account name/email on generated resumes. Keyword scoring no longer counts Java inside JavaScript; UI calls it an estimate.
- Profile saving now uses the real API. Calendar submissions preserve the browser's intended instant through ISO timezone conversion and support custom event types. Added sign out, auth submit protection and a render-error fallback.
- Removed obsolete duplicate frontend screens. Secrets, local dependencies and build directories are excluded from the deliverable.

## Checks actually completed here

| Check | Result |
| --- | --- |
| Frontend production build | Pass |
| Backend TypeScript build | Pass |
| Frontend lint | Pass, no warnings |
| npm audit, frontend and backend | Zero reported vulnerabilities at the time checked; this is not a complete security audit |
| HTTP/adapter regression suite | 5 tests passed; MySQL workflow test explicitly skipped |
| Guest/protected API access, invalid inputs, crawler resources | Pass in HTTP regression suite |
| Model adapter JSON/error/timeout/concurrency behavior | Pass against a controlled local fake upstream, not the real model |
| DOM rendering smoke check | 11 routes rendered without runtime errors using fixture API data; this is not a browser layout or real-data workflow test |
| Current ARD and Lighthouse 13.5 legacy catalog schema checks | Pass |
| Production main JavaScript | Approximately 349 kB raw / 109 kB gzip; optional resume/OCR/export chunks are separate |

The screenshots' approximately 11 MB network payload came from the development server. The production figures above are build outputs, not a measured replacement Lighthouse performance score. Fonts and CSS add to initial transfer size.

## Remaining release gates

1. **Database:** Run the included GitHub Actions workflow or set `TEST_DATABASE_URL` to a disposable migrated MySQL database and run `npm test`. Test backup/restore and any baseline needed for an existing database. No MySQL service was available here.
2. **AI:** Start/pull the selected model and run `npm run ai:check` from `backend`. The live check here failed with a connection error because no Ollama service is reachable. Evaluate actual resumes, Indian/other language input if needed, accuracy, latency and memory use on the target hardware. One smoke sample is not a quality benchmark.
3. **Browser/Lighthouse:** Chromium could not start because this environment blocks required browser socket operations. Run the supplied browser smoke script, test OCR/image/PDF exports, check keyboard/mobile flows and rerun Lighthouse on production output. No new scores or 100/100 claims are supplied.
4. **Deployment:** Build/run the Docker image or configured Node service on the host, supply fresh secrets, confirm persistent storage and HTTPS, check `/ready`, and observe logs. Docker was unavailable here, so the container recipe has not been executed.
5. **Launch scope:** Password reset, email verification, shared rate limiting for multiple replicas, monitoring and privacy/data retention policy need decisions appropriate to the intended audience. These features are not falsely presented as implemented.

See README.md for exact deployment and test commands. Third-party references used during review: [Vite production deployment](https://vite.dev/guide/static-deploy), [Vite production builds](https://vite.dev/guide/build), and [Ollama generate API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md); catalog validation used the schemas actually bundled with Lighthouse.
