# AI editorial drafts and daily trends

## Architecture and existing workflow

The existing three applications are preserved: Express 5/Mongoose API, Next.js 16 admin, and Next.js public frontend. Authentication still uses the existing JWT/session middleware. The admin still sends requests through `admin/src/lib/api.js` and the same-origin `/api/cms` proxy, which forwards the session bearer token. Article persistence still uses the existing article controller/service, transactions, revisions, sanitization, validation and publishing checks.

AI credentials belong to the backend. `AiConfig` has one unique `singleton=default` record. Its key is encrypted with AES-256-GCM, a random 96-bit IV and an authentication tag; the encryption key is supplied separately by the server environment. The encrypted field is excluded from normal queries and JSON serialization. Configuration responses use an explicit allowlist and only show `apiKeyConfigured` and a fully masked preview. Request bodies and upstream error bodies are not logged.

`TrendingSnapshot` stores one document per date/country, with a unique compound index, ranked embedded topics and source-health information. This permits atomic replacement of today's ranking without partial top-ten updates, preserves earlier dates, and keeps history queries simple. Topic IDs remain stable for unchanged normalized titles during same-day refreshes. An expiring MongoDB lease prevents concurrent refresh writers. `RequestQuota` provides shared counters with expiry for AI and manual trend requests across serverless instances.

## Files created

| File | Purpose |
| --- | --- |
| `backend/src/models/AiConfig.js` | Singleton encrypted provider configuration |
| `backend/src/models/TrendingSnapshot.js` | Indexed daily history and refresh lease |
| `backend/src/models/RequestQuota.js` | Durable per-admin quotas |
| `backend/src/utils/encryption.js` | Authenticated credential encryption |
| `backend/src/validators/ai.validator.js` | Configuration, input and generated JSON contracts |
| `backend/src/services/ai/ai.service.js` | Configuration, testing, editorial prompt, relevant articles, output validation |
| `backend/src/services/ai/transport.js` | Backend-only HTTP, bounded retries, shared timeout, safe errors and usage metadata |
| `backend/src/services/ai/providers/index.js` | OpenAI, OpenRouter, Groq, Gemini, Anthropic and custom adapters |
| `backend/src/controllers/ai.controller.js` | Response envelope and safe audit events |
| `backend/src/routes/ai.routes.js` | AI authorization and routes |
| `backend/src/middleware/aiRateLimit.middleware.js` | Atomic MongoDB quota enforcement |
| `backend/src/services/trending/providers/index.js` | Bounded, timed public RSS collectors |
| `backend/src/services/trending/trendRanking.service.js` | Unicode normalization, conservative deduplication and scoring |
| `backend/src/services/trending/trending.service.js` | Source isolation, leases and snapshot updates |
| `backend/src/controllers/trending.controller.js` | Listing, history, topic details, article-start audit and refresh |
| `backend/src/routes/trending.routes.js` | Admin routes and authenticated GET/POST cron job |
| `admin/src/app/setup-ai/page.jsx` | Provider setup and connection testing |
| `admin/src/app/trending/page.jsx` | Date/country browser, source health, history and article entry |
| `admin/src/lib/ai-draft.mjs` | Explicit safe merge preserving manual fields |
| `backend/tests/ai-trending.test.js` | Mocked AI and isolated MongoDB regression tests |
| `backend/.env.example` | New environment settings without real credentials |
| `AI-TRENDS.md` | Setup, deployment and limitations |

## Files modified

- `admin/src/components/admin-shell.jsx`: Trending Topics and Setup AI navigation, using existing styling.
- `admin/src/app/globals.css`: allow the expanded sidebar to scroll on shorter screens.
- `admin/src/components/article-editor.jsx`: AI card, generation state, safe merge, explicit draft payload, failure retention, trend prefill and readiness checks.
- `admin/src/lib/article-form.mjs`: preserve existing `articleSection` and `trendingTopic` fields through form round trips.
- `admin/src/lib/api.js`: optional request options for cancellation.
- `admin/src/app/api/cms/[...path]/route.js`: longer AI timeout and 120-second function budget.
- `backend/src/app.js`, `backend/src/routes/index.js`: route registration.
- `backend/src/config/env.js`: new configuration values.
- `backend/src/models/index.js`: export new models.
- `backend/package.json`, `backend/package-lock.json`: RSS parser moved to production dependencies; declared the MongoDB memory server already used by existing integration tests.
- `backend/tests/cms.test.js`: isolated test database URI is also used by application initialization.
- `backend/vercel.json`: daily cron entry.

The public frontend and the Article schema are unchanged. Existing article HTML, metadata, FAQ, canonical URL and structured-data paths are reused.

## API routes

All responses retain `{ success, message, data }`.

| Method | Backend path | Access |
| --- | --- | --- |
| GET | `/api/admin/ai/config` | admin, superadmin |
| PUT | `/api/admin/ai/config` | admin, superadmin |
| POST | `/api/admin/ai/test` | admin, superadmin |
| GET | `/api/admin/ai/status` | editor, admin, superadmin |
| POST | `/api/admin/ai/generate-article` | editor, admin, superadmin |
| GET | `/api/admin/trending?date=2026-09-21&country=IN` | editor, admin, superadmin |
| GET | `/api/admin/trending/history?days=30&country=IN` | editor, admin, superadmin |
| GET | `/api/admin/trending/:id` | editor, admin, superadmin |
| POST | `/api/admin/trending/:id/start-article` | editor, admin, superadmin |
| POST | `/api/admin/trending/refresh` | editor, admin, superadmin |
| GET / POST | `/api/internal/jobs/trending` | `Authorization: Bearer CRON_SECRET` |

Generation accepts `title`, `language`, optional `content`, `summary`, `sourceUrl`, `trendingTopic`, and `trendId`. It returns `{ article, provider, model, durationMs, usage }`. The editor then uses the existing article POST/PATCH API with `status=draft` and `scheduledAt=null`. Generation itself does not publish or persist an article.

Manual trend refresh accepts `{ "country": "IN" }`. The cron defaults to India; POST may supply another supported country. GET exists for Vercel Cron. Historical dates can be read but are never backfilled with today's feeds.

## Environment and local commands

Keep existing MongoDB, JWT, Cloudinary, CORS and URL configuration. Add:

```dotenv
AI_ENCRYPTION_KEY=<64 hex characters, 32 random bytes>
CRON_SECRET=<independent random secret>
AI_TIMEOUT_MS=75000
AI_GENERATION_LIMIT=10
TREND_REFRESH_HOURS=24
AI_CUSTOM_HOSTS=
```

Generate each secret independently:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit generated secrets. Back up `AI_ENCRYPTION_KEY` in a secret manager; changing or losing it requires re-entering the provider key. No AI provider key is required in `.env`. Missing AI encryption configuration does not prevent trends from working.

`AI_CUSTOM_HOSTS` is optional and contains comma-separated trusted HTTPS hostnames, without paths. Only allow hosts you explicitly trust with credentials. Custom endpoints cannot include URL credentials, a query string, a fragment, a non-443 port, or use HTTP. Redirects are not followed. Known providers always use their fixed default endpoint.

Run in separate terminals from each application directory:

```sh
# backend
npm install
npm test
npm start

# admin
npm install
npm run lint
npm run build
npm run dev

# frontend
npm install
npm run lint
npm run build
npm run dev
```

For local development, `admin/.env.development.local` and `frontend/.env.development.local` should set both `API_URL` and `NEXT_PUBLIC_API_URL` to `http://localhost:5000/api`. These ignored development-only files override an older deployed API URL in `.env` without changing production configuration. The current workspace has these overrides configured. A deployed backend must also receive the new code before its AI/trending endpoints will work.

After both Next.js applications have been built, run `npm run test:stack` from `backend`. This launches the production admin and public frontend against a temporary backend database, tests authentication cookies through the actual admin proxy, AI configuration/testing/generation, draft persistence, manual publishing, article metadata, trending collection/history, and public routes. AI and RSS responses are mocked; live data and paid provider accounts are not used.

The existing article transaction service requires MongoDB Atlas or another replica set. Tests start temporary local replica sets and mock AI calls; they do not spend AI credits. The first test run may download a MongoDB test binary.

## Configure and use AI

1. Sign in as admin/superadmin and open **Setup AI**.
2. Choose the provider and enter an available text model ID. For example, OpenRouter accepts provider-prefixed IDs such as `openai/gpt-5-mini`; access is determined by your account.
3. Enter the API key, temperature and output budget. Known base URLs populate automatically.
4. Choose JSON mode by default, JSON schema for a model that supports it, or prompt-only for compatible APIs without JSON mode. Anthropic uses prompt-only generation plus the same server validation. Reasoning model families omit unsupported temperature and use a low reasoning budget.
5. **Test connection** performs a small backend request with at most 512 output tokens. A test of unsaved settings does not save those credentials. Save configuration afterward. Testing saved unchanged settings records the connection status and timestamp; changing configuration marks it untested.
6. Open **New article**, enter a title and choose English or Hindi. Add confirmed reporting and source URLs when available.
7. **Complete with AI** fills empty fields and saves a draft. Existing manual text, title, category, subcategory, author, tags, canonical/robots settings and all media stay under editorial control. Existing published/scheduled articles are moved to draft by this operation.
8. Review the draft and editorial verification notes, select a category, upload an image and manually publish. Suggested tags are displayed and retained in editorial notes; no tags are created automatically.

If automatic saving fails, generated data remains in the editor with a manual-save notice. The next ordinary save still forces draft status. The existing Story, Media, SEO, Sources & links and Revisions tabs remain available.

## Trends and scheduling

Collectors currently use Google Trends RSS, Google News RSS and BBC News RSS. All are backend requests without a paid API key, with source-independent timeouts, response size limits and failure isolation. Ranking combines source position, Google Trends traffic when present, freshness, source diversity and repeated coverage. Conservative token matching combines clear variants but rejects conflicting numeric entities. Scores are editorial heuristics, not a definitive measurement of the country's top searches.

India is the default. USA and UK have country-specific feed and date settings. Each country's snapshot date uses its configured local timezone. A topic can appear on multiple days; old snapshots are not deleted. If every source fails, the latest successful topics for that day remain, while source health records the failure. At most ten topics are displayed; fewer are possible when sources supply fewer usable topics.

Manual refresh has a country-wide one-minute cooldown and a per-admin quota of three requests per ten minutes. Scheduled duplicate calls reuse an existing fresh daily snapshot. A MongoDB lease serializes actual refreshes. Set `TREND_REFRESH_HOURS=6` and run the scheduler every six hours to allow more frequent same-day updates while retaining one daily snapshot.

The committed backend Vercel schedule is `30 1 * * *` (07:00 India time):

```json
{
  "installCommand": "npm install --omit=dev",
  "crons": [{ "path": "/api/internal/jobs/trending", "schedule": "30 1 * * *" }]
}
```

Set `CRON_SECRET` in the backend Vercel project. Vercel sends it as a bearer token. Deploy the backend project with `backend` as its root. Deploy admin and frontend separately with their existing root directories and URL configuration. Set the admin's server-side `API_URL` to the backend `/api` URL. Enable a backend function execution budget of at least 120 seconds and an admin proxy budget of at least 120 seconds on your hosting plan. Generation's timeout covers retry and JSON repair calls together; the admin proxy waits up to 100 seconds for AI requests. Trends normally finish within the 12-second parallel feed window.

For GitHub Actions, an external scheduler, or a server cron, send an HTTPS POST to the same endpoint with the bearer header, using the scheduler's secret storage. A daily schedule must be configured outside the process for local/server hosting; there is no permanent Node timer for trend collection. Monitor failed scheduler responses and retry later. Keep the API, admin and public site origins consistent with the existing deployment settings.

Before production traffic, ensure model indexes exist (`AiConfig.init()`, `TrendingSnapshot.init()`, `RequestQuota.init()`) if your deployment disables Mongoose automatic index creation.

## Validation and limitations

Verified locally: 30 backend tests passing; backend JavaScript syntax checks passing; backend startup and connected-database health check passing using a temporary replica set; admin and public frontend lint and production builds passing. A read-only live feed check returned items from all three India collectors. No live paid AI request was made. Browser-level visual testing was not performed.

- Backend tests cover authorization, configuration secrecy, encryption tampering, validation, connection testing, provider contracts, JSON repair, sanitization, supplied-link filtering, protected-field preservation, draft persistence, timeouts, trend deduplication, snapshot idempotency and source failure handling. Existing publishing/authentication tests are retained.
- A title or URL alone is not a verified news report. Source pages are not fetched; the prompt explicitly requires conservative drafting and verification notes. Human fact-checking remains necessary. Models can still make factual mistakes.
- AI-generated HTML cannot contain images or anchors. Link suggestions must exactly match supplied source URLs or at most ten relevant published articles. No category/media fields are accepted in generated JSON. Unsupported FAQ entries are dropped to match existing article validation.
- Optional AI trend enrichment is not enabled. Trends work without any AI configuration. Category guesses remain unassigned rather than fabricating classifications.
- Historical browsing begins when collection starts; feeds are not used to reconstruct earlier days. Sources can change or become unavailable independently. Review source terms for your deployment; only headlines and links are retained, not full articles.
- Connection testing confirms API access, not the model's factual quality or every structured-output capability. Use an output mode and token limit supported by your selected model. No real AI key or production AI call was used during implementation tests.
- SEO Readiness is a checklist, not a ranking prediction. Some items, such as FAQ or links, may be unnecessary for a particular story.

## Provider references

- [OpenAI Chat API](https://developers.openai.com/api/reference/resources/chat)
- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Gemini generateContent](https://ai.google.dev/api/generate-content)
- [Groq API reference](https://console.groq.com/docs/api-reference)
- [Anthropic API overview](https://platform.claude.com/docs/en/api/overview)
- [Google Trends export documentation](https://support.google.com/trends/answer/3076011?hl=en)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)
