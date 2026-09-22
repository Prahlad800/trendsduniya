# TrendsDuniya AI CMS implementation report

Updated 22 September 2026. Changes extend the existing project at `D:\my data\developer\top project\trendsduniya`.

## Audit and implementation

The existing architecture is preserved: Next.js admin and public frontend, Express API, MongoDB/Mongoose, JWT access tokens plus database-backed refresh sessions, encrypted AI keys, Cloudinary media, article transactions/revisions, scheduling and existing public URLs. No Redis is installed; the daily MongoDB snapshot remains the cache and source of truth.

Audit locations:

- Admin: `src/components/auth-provider.jsx`, `src/lib/api.js`, `src/app/api/cms/[...path]/route.js`, `src/components/article-editor.jsx`, `src/lib/article-form.mjs`, `src/lib/ai-draft.mjs`, Setup AI and Trending pages.
- Backend: auth middleware/controller/session model; AI routes/controller/service/adapters/transport/config model; trending collectors/ranking/service/snapshot model; article validators/service/model, SEO service, sanitization, revisions and scheduler.
- Public frontend: existing article metadata, canonical URL, Open Graph/Twitter output and legacy news redirect.

Problems found: one shared AI singleton, user-facing output-mode controls, upstream error bodies discarded, unnecessary model-specific parameters, top-ten RSS-only ranking, no snapshot expiry, and AI completion automatically saving/demoting existing published or scheduled articles. Existing authentication already refreshed tokens and emitted 401 events, but did not suppress later protected requests or retain the return destination.

The original production provider error response was not available. The implementation now diagnoses provider rejection classes and adapts explicitly rejected request parameters; it does not claim to have reproduced a particular live account failure.

## Database changes and compatibility

- `AiConfig` retains its unique `singleton` index. Existing `singleton=default` is Article Writing AI; the new `singleton=trending` is Trending Topics AI. Existing article settings and ciphertext stay in place. No key copying between configurations and no duplicate model/collection.
- `TrendingSnapshot` gains provider/model/generatedAt and topic explanation, article angle, language priority and source count.
- A MongoDB TTL index on `createdAt` expires snapshots after 2,592,000 seconds (30 days). Refreshing a snapshot does not extend retention. MongoDB deletes expired snapshots asynchronously. This deliberately expires old trend history, not articles/users/categories/settings.
- Existing timestamps support the new index; Mongoose creates the additive index on connection. No destructive migration or collection reset is required. If production disables automatic index creation, run `db.trendingsnapshots.createIndex({createdAt:1},{expireAfterSeconds:2592000})` in that database as the normal deployment migration.
- Article schema, public URLs, revisions, categories, users and existing article APIs are preserved. No files or existing application data were manually deleted.

## Routes

Existing routes and response envelopes remain available. The legacy config/test routes operate on Article Writing AI.

| Method | Path | Purpose |
| --- | --- | --- |
| GET / PUT | `/api/admin/ai/config/:type` | Read/save independent `article` or `trending` configuration |
| POST | `/api/admin/ai/config/:type/test` | Test that configuration's actual selected provider/model |
| GET / PUT | `/api/admin/ai/config` | Backward-compatible Article AI configuration |
| POST | `/api/admin/ai/test` | Backward-compatible Article AI connection test |
| GET | `/api/admin/ai/status` | Article AI readiness for the editor |
| POST | `/api/admin/ai/generate-article` | Generate fields without writing or publishing an article |
| POST | `/api/admin/trending/refresh` | Source-backed AI selection and atomic snapshot save |
| GET | `/api/admin/trending?date=YYYY-MM-DD&country=IN` | Read a saved daily snapshot |
| GET | `/api/admin/trending/history?days=30&country=IN` | Existing history browser |
| GET / POST | `/api/internal/jobs/trending` | Existing cron endpoint; Bearer `CRON_SECRET` required |

Generation accepts the existing fields plus optional `targetWords` (300–10,000; default 10,000). The editor uses its existing save/publish APIs after human review. Admin/superadmin authorization protects settings; existing editor permissions and durable quotas remain.

## Authentication

- The existing HTTP-only cookie proxy and refresh-token flow remain.
- A terminal 401 clears server cookies, expires client session state, aborts pending protected requests and blocks new protected requests until login succeeds.
- Protected pages redirect to `/login?next=...`; validated same-origin paths restore the original page after login. Login/API routes and unsafe destinations cannot create redirect loops or open redirects.
- Session checks run on window focus and once per minute while the page is visible.
- Permission-only 403 responses remain visible without logging out an otherwise valid user. The backend uses 401 for invalid, expired, inactive and revoked sessions.

## AI providers and security

- Existing OpenAI, OpenRouter, Groq, Gemini, Anthropic and allowlisted custom adapters are reused.
- Test Connection sends a minimal text request to the exact configured model. No silent model substitution.
- Structured Output controls are removed. JSON mode is requested internally where supported; an explicit unsupported-parameter rejection can trigger a bounded compatibility adjustment. JSON extraction, schema validation and one regeneration attempt handle malformed output.
- Provider errors return safe codes including `INVALID_API_KEY`, `ACCESS_DENIED`, `MODEL_NOT_FOUND`, `RATE_LIMITED`, `TOKEN_LIMIT`, `UNSUPPORTED_PARAMETER`, `OUTPUT_TRUNCATED` and timeout/unreachable errors. Upstream text is classified but never echoed, avoiding credential/prompt leakage.
- Temporary failures have bounded exponential backoff and one overall timeout. Permanent key/model errors are not retried.
- Keys remain AES-256-GCM encrypted server-side. Responses expose only key-presence/masking information. Blank keys preserve existing keys; changing provider/endpoint requires an explicitly supplied key so credentials cannot accidentally move to another recipient.
- Custom endpoints require an operator-allowlisted public hostname, HTTPS/443, no URL credentials/query/fragment and no redirects. Literal IPs and local/internal hostnames are rejected. Only trusted operator-controlled hostnames should be allowlisted; the allowlist is the trust boundary.
- AI HTML is sanitized; only supplied link URLs survive validation. No image generation code or API was added.

Provider contract references: [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create), [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output). Model availability and account access still depend on the provider account.

## Trending Topics

- Public Google Trends, Google News (including six category feeds) and BBC RSS provide timestamped candidates. Google News RSS redirects are bounded and restricted to the same HTTPS origin and RSS path.
- The requested trending prompt is stored in `prompt.js`; actual current date/time and country are injected on each generation.
- Trending AI selects from up to 120 distinct recent candidates. It cannot supply replacement headlines or source URLs: the server retains the selected candidates' exact source data.
- Exactly 20 distinct sourced topics are required before replacing a snapshot. Too few current sources, duplicate/invalid AI selections or provider failures preserve previous topics and report a useful error.
- Keywords, category, relative editorial score, explanation, article angle, language, source count and timestamps are stored. Scores are explicitly not official Google Trends scores.
- Existing unique daily date/country records and database leases prevent concurrent duplicate generations. Page reads do not call AI. Existing topic IDs/first-seen times survive same-day refreshes.
- The existing Create article flow pre-fills the title and trend reference, with no automatic publishing.

## Article AI and SEO

- Complete with AI uses only Article Writing AI. It fills empty fields and preserves manual title/content, media, category, tags, SEO, publication state and schedule.
- Target length defaults to approximately 10,000 words when evidence supports it; the admin can request a shorter article. No filler or invented facts are requested. Up to 64,000 output tokens and 500,000 content characters are accepted; the selected model's actual limits still apply.
- Semantic HTML includes headings, lists and tables. Markdown-only responses are rejected. Optional FAQ/internal/source links default to empty arrays and do not block publishing.
- Existing category/tag names can be matched to real active taxonomy IDs; unmatched tags remain editorial suggestions. No fake category/tag IDs are created.
- Existing SEO title/description, focus keyword, secondary keywords and related topics are generated. Existing save/public SEO services generate canonical, Open Graph/Twitter fields, robots and Article/NewsArticle schema using the saved slug and editorial state. No duplicate SEO schema was introduced.
- Generation only populates the form. The user chooses Save draft, Save changes, Schedule or Publish. Existing publishing requirements (including manually uploaded image and alt text) remain.

## Run locally (PowerShell)

Use Node.js 24 and npm. MongoDB must support transactions: Atlas or a local replica set, not a standalone server. Tests use a disposable MongoDB 7.0.14 replica set and do not use your application data.

Backend, in its own terminal:

```powershell
Set-Location 'D:\my data\developer\top project\trendsduniya\backend'
npm ci
npm run dev
```

Admin, in another terminal:

```powershell
Set-Location 'D:\my data\developer\top project\trendsduniya\admin'
npm ci
npm run dev
```

Public frontend, in another terminal:

```powershell
Set-Location 'D:\my data\developer\top project\trendsduniya\frontend'
npm ci
npm run dev
```

Default addresses: backend `http://localhost:5000`, admin `http://localhost:3001`, public site `http://localhost:3000`. Production: backend `npm start`; admin/frontend `npm run build` followed by `npm start` in their respective directories.

For a new database only, provision an admin with the existing command:

```powershell
npm run create:admin -- 'Your Name' 'you@example.com' 'your-strong-password' superadmin
```

## Environment

Merge `backend/.env.example` into your existing environment; do not overwrite real environment files.

Backend `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/trendsduniya?replicaSet=rs0
PORT=5000
JWT_ACCESS_SECRET=<strong independent secret>
JWT_REFRESH_SECRET=<different strong secret>
SITE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CLOUDINARY_CLOUD_NAME=<existing value>
CLOUDINARY_API_KEY=<existing value>
CLOUDINARY_API_SECRET=<existing value>
AI_ENCRYPTION_KEY=<64 hex characters: 32 random bytes>
CRON_SECRET=<independent random secret>
AI_TIMEOUT_MS=240000
AI_GENERATION_LIMIT=10
TREND_REFRESH_HOURS=24
AI_CUSTOM_HOSTS=
```

Generate each new secret separately with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Preserve the existing AI encryption key if you already have stored credentials. Do not print, commit or send real secrets. No provider API key belongs in frontend variables.

Admin `.env`:

```dotenv
API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Public frontend `.env`:

```dotenv
API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep existing deployment-specific variables. If DNS overrides are needed for Atlas, the existing `MONGODB_DNS_SERVERS` option remains available. Configure the two provider keys independently in Setup AI. The admin proxy allows 270 seconds for AI/trending, with a 300-second route budget; backend hosting must permit the corresponding duration. An existing `AI_TIMEOUT_MS=75000` continues to work but may be too short for lengthy generation.

## Verification and practical limits

- Backend unit/integration tests cover isolation, encrypted keys, preserving blank keys, authorization, invalid/expired/revoked sessions, provider rejection codes/fallbacks/retries/truncation, malformed JSON repair, optional arrays, long HTML, sanitization, exact topic count, deduplication, daily snapshots, cron protection, real TTL expiration and existing publishing/revisions/scheduling/media behavior.
- Production stack test exercises admin HTTP-only-cookie proxy, backend, public rendering/SEO, draft/publish, history and trend-to-article APIs against isolated MongoDB and mocked AI/RSS.
- Browser verification used the isolated fixture: login return destination, independent settings tabs, Test Connection, 20-topic table, title prefill, AI-filled HTML, unsaved state and explicit manual draft save.
- A live read-only feed check returned all nine feeds successfully and at least 120 distinct current candidates. No live-provider paid generation or production database mutation was performed.
- Real provider credentials/model access and genuine 10,000-word model output require account-specific live validation. A one-shot generation remains subject to provider latency/token limits; truncated output returns an actionable error without overwriting editor content. Sparse evidence deliberately produces shorter cautious drafts, not invented reporting.
- RSS headlines are discovery evidence, not independently verified full reporting. Editors must review generated explanations/content. URL provenance and JSON/HTML safety can be checked mechanically; factual truth cannot be guaranteed by schema validation.
- Harmless existing tooling notices: Next.js ignores a parent lockfile outside this repository; Node notes the admin package's unspecified module type when tests import its ES modules.

Commands from each application directory: backend `npm test`, `npm run lint`, `npm run test:stack` (after both builds); admin/frontend `npm run lint`, `npm run build`. This is a JavaScript project; Next.js reports its build/type-validation phase, with no separate TypeScript project check configured.

## File inventory

Modified:

- `AI-TRENDS.md`
- `admin/src/app/api/cms/[...path]/route.js`
- `admin/src/app/setup-ai/page.jsx`
- `admin/src/app/trending/page.jsx`
- `admin/src/components/article-editor.jsx`
- `admin/src/components/auth-provider.jsx`
- `admin/src/lib/ai-draft.mjs`
- `admin/src/lib/api.js`
- `backend/.env.example`
- `backend/scripts/testStack.mjs`
- `backend/src/config/env.js`
- `backend/src/controllers/ai.controller.js`
- `backend/src/middleware/error.middleware.js`
- `backend/src/models/AiConfig.js`
- `backend/src/models/TrendingSnapshot.js`
- `backend/src/routes/ai.routes.js`
- `backend/src/services/ai/ai.service.js`
- `backend/src/services/ai/providers/index.js`
- `backend/src/services/ai/transport.js`
- `backend/src/services/trending/providers/index.js`
- `backend/src/services/trending/trendRanking.service.js`
- `backend/src/services/trending/trending.service.js`
- `backend/src/validators/ai.validator.js`
- `backend/tests/ai-trending.test.js`

Created:

- `admin/src/lib/session-state.mjs`
- `backend/src/services/ai/json.js`
- `backend/src/services/trending/aiRanking.service.js`
- `backend/src/services/trending/prompt.js`
- `backend/tests/ai-regression.test.js`

Removed: none. Public frontend application files and dependency manifests were not changed.
