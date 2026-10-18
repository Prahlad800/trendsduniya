# TrendsDuniya AI integrations

## AI News Automation (Groq + Cloudflare)

Open `/automation` in the existing admin. Overview, Trending Topics, Article Generator, Image Manager, Publishing Calendar, API Settings and Job History use authenticated Express APIs at `/api/admin/automation`. Article drafting and trending selection also use the shared Groq connection.

## Worldwide top five, Hindi and English

The existing `/trending` page now defaults to `WORLD` coverage and displays exactly five current editorial selections. Worldwide research reads news RSS providers across India, USA, UK, Australia, Brazil, Germany, Japan and South Africa, plus the global BBC World feed. Bare Google Trends search queries are excluded from worldwide news selection. Regional India/USA/UK views remain available. Source publication timestamps, URLs and region labels are retained. One event is grouped before ranking, and normalization/token signatures are cached so thousands of feed entries do not block the worker for minutes.

Groq must return exactly five distinct source-backed IDs, English/Hindi headlines, and explanations/article angles in both languages. Missing Hindi output is rejected. Select English, Hindi or both in the admin; article buttons open the existing editor with the corresponding headline and language. Existing historical records remain stored, while API responses expose only the first five; refresh a legacy regional shortlist to add bilingual fields.

Live verification on 16 October 2026 saved five bilingual worldwide topics from 3,269 feed entries across 65 active feeds covering eight regions and the global BBC World feed. Worldwide integration tests cover partial feed failure, eight-region aggregation, exactly-five validation, Hindi output and legacy snapshot preservation. These are editorial news selections based on available coverage, not an independently measured worldwide popularity chart.

The worldwide/bilingual regression suite passed 29 checks; admin build and targeted lint passed. Database operations use a 15-second client-side timeout so stalled queries return sanitized 503 responses before the admin proxy's deadline. The development watcher tracks backend source and `.env`, and ignores tests, scripts and logs to avoid restarting during routine verification.

## Generate five images inside the article editor

The article editor now has **Generate 5 AI Images** in both the AI Assistant and Media tab. Fill Article title, Article content and Summary. Groq creates five distinct section-specific prompts; Cloudflare FLUX.1 Schnell generates one image per request. The first available generated image becomes featured when there is no existing featured image; other generated images join the gallery. Existing media and manual content are preserved. Review the images, then save the article to attach them. English and Hindi alt text/captions follow the article language. Public article rendering already inserts gallery visuals between content sections.

Exports are 1920×1080 WebP, resized/cropped through the existing Cloudinary storage service. This is a Full HD delivery size derived from the model's native output; native 1920×1080 generation is not assumed. Cloudflare receives only supported prompt/steps inputs, with four steps.

New durable `ArticleImageBatch` records store the plan, each completed image, errors and a worker lease. The same owner/article/content context reuses its batch, so retrying resumes unfinished images without regenerating successful ones. Successful partial images are available in the editor while other images are still being generated. Concurrent calls are locked. A crash after a provider response but before checkpointing can repeat that individual billed request.

The existing server-only credentials are reused: GROQ_API_KEY, GROQ_MODEL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and the three CLOUDINARY_* credentials. Create the Cloudflare token through **AI → Workers AI → Use REST API → Create a Workers AI API Token**; custom tokens need Workers AI Read and Edit for the target account. Save it in `backend/.env`. A rejected provider token returns a clear image-generation error and does not expire the admin's login session. See [Cloudflare token setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/).

The editor's application quota is `AI_IMAGE_DAILY_LIMIT=50` image attempts per administrator per UTC day, configurable in the backend environment. Provider account limits still apply independently. Cloudflare currently includes 10,000 free neurons daily and resets at 00:00 UTC (05:30 India time). At the documented 1024×1024/four-step rates, one image is approximately 57.6 neurons, giving a theoretical roughly 170-image daily budget if other usage and retries do not consume it. This is an estimate, not a guaranteed account allowance. Cloudinary storage/transformation usage has its own quota. [Current pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

Endpoints under `/api/admin/ai`: POST `/image-batches` (title/content/summary/language and optional articleId), GET `/image-batches/:id`, and POST `/image-batches/:id/next` (call once per pending image). Editor/admin/superadmin permissions are required; batch access is owner-scoped. Provider keys never enter browser responses. `node scripts/initAutomation.js` also creates image-batch indexes.

Verification: six image integration checks passed using disposable MongoDB with mocked providers/storage, covering authorization, field validation, five outputs, 1920×1080 processing options, checkpoints, retry recovery, leases, preservation of manual media and daily quotas. Admin build and changed-file lint passed. Live Groq planning produced five concepts, and a separate live Cloudinary fixture exported/delivered a 1920×1080 WebP successfully (then the fixture was deleted). Live FLUX generation remains blocked by Cloudflare returning 401 / Invalid API Token; five live generated images have not been verified.

### Setup and deployment

1. Set server-only `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and the existing `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env` or deployment secrets. Never put keys in `NEXT_PUBLIC_*`. Cloudflare token needs Workers AI access for that account.
2. Use a MongoDB replica set (Atlas or local replica set); CMS saves already use transactions. Back up the database, then run `cd backend`, `npm ci`, `node scripts/initAutomation.js`. This creates two collections and indexes, including a unique partial Article.automationTask index. No destructive migration or existing status conversion is required.
3. Run `npm run dev` in backend, `npm ci` then `npm run dev` in admin. Existing frontend runs as before. Production: `npm start` in backend; `npm run build` and `npm start` in admin. Set admin `API_URL` to the backend `/api` URL. `SITE_URL` must be one absolute URL, not a comma-separated list; use `CORS_ORIGIN` for lists.
4. Test both providers from API Settings. These are real, potentially billed requests. Set GROQ_MODEL to a Groq text model available to your account and restart the backend. It applies to all AI text tools. The current implementation supports Cloudflare FLUX Schnell's base64 image contract; other image models are rejected rather than silently misparsed.
5. Enable automation only after configuration. A persistent Node server runs the worker every 30 seconds. On serverless infrastructure, call `POST /api/internal/jobs/automation` every minute using `Authorization: Bearer <CRON_SECRET>` and allow at least 240 seconds runtime. Do not rely on in-memory intervals on Vercel. The existing Vercel configuration does not provision this external cron for you.

### Editorial workflow and schedule

Research fetches current RSS candidates from configured IN/US/GB feeds, ranks recency/source diversity/feed placement and selects up to five nonduplicate topics. Feed snippets, source timestamps and links are retained. These are editorial scores, not measured global top-five rankings. If fewer than five qualifying topics exist, the system does not invent replacements. Reject a topic and research again to replace it.

Read source articles and supply verified evidence in Trending Topics, choose an active category and Hindi or English, then queue generation. Groq receives this evidence, not a claim of live browsing. Successful images checkpoint individually to MongoDB; Cloudinary stores optimized landscape WebP images. Existing successful images are reused on retries. Failed provider operations retry with bounded exponential backoff and Retry-After support. Quota/configuration errors appear in task history; raw provider errors and secrets are not returned.

The article remains a normal CMS draft. Edit and preview it in the existing editor; replace/reorder/remove images there. Approve the current version, then schedule or publish. Content and image edits invalidate the approval fingerprint. All generated news is conservatively treated as requiring review; disabling `humanReview` does not bypass this safeguard. This is assisted automation, not a claim of autonomous factual verification. Both-language generation in one action is not implemented: select Hindi or English per task.

Default slots are 06:00, 12:00, 19:00, 21:00 and 23:00 in Asia/Kolkata. Settings allow five distinct slots and an IANA timezone. Schedule changes apply to new tasks; existing schedules are explicitly editable in Calendar. Approving alone does not schedule: select a future time in Calendar. Overdue approved articles recover after restart with at least 30 minutes between automated publications. Pausing prevents worker generation/publication, while explicit manual publishing remains available to editors.

MongoDB stores task checkpoints, retry counts, usage tokens, the worker lease and publication state. Each generation step runs under a five-minute lease; successful article creation and publication are transactional/idempotent. A crash between provider response and checkpoint may repeat a billed generation call; successful checkpoints do not regenerate. Individual image replacement currently reuses a deterministic Cloudinary public ID, so CDN caching can delay previews. Job history retains the latest 100 entries per task. Overview displays selected-day tasks plus up to 50 outstanding older tasks. Cost estimates are unavailable; inspect Groq, Cloudflare and Cloudinary billing/quota dashboards.

### API and validation

Import `postman/AI-News-Automation.postman_collection.json`; set `apiUrl`, `accessToken`, `taskId`, and `cronSecret` locally. Available endpoints: GET `/admin/automation`, PUT `/admin/automation/settings`, POST `/admin/automation/research`, POST `/admin/automation/topics`, POST `/admin/automation/test/{groq|cloudflare}`, POST `/admin/automation/tasks/:id/{verify|generate|regenerate|regenerate-image|approve|draft|schedule|publish|retry|reject}`. Settings require admin/superadmin; task controls require editor/admin/superadmin. Sources and settings use strict validation. API keys are environment-only.

Run `npm test` and `npm run lint` in backend; `npm run lint` and `npm run build` in admin. `tests/automation.test.js` uses a disposable MongoDB replica set with mocked provider/storage calls; it covers exact slot conversion, authorization, configuration validation, quota redaction, image validation, restart checkpoints, approval invalidation, pause, concurrent publishing and lease recovery. Live provider generation, external cron delivery and real Cloudinary URLs still require configured account testing.

Implementation files: `backend/src/models/Automation.js`, `backend/src/services/automation/*`, `backend/src/routes/automation.routes.js`, `backend/scripts/initAutomation.js`, `backend/tests/automation.test.js`, `admin/src/app/automation/*`, and the Postman collection. Integration changes extend Article, article saving, scheduler, Cloudinary upload, RSS evidence, route registration, admin navigation, `.env.example` and `.gitignore`. The pre-existing modified AI validator and frontend sitemap are preserved.

Provider contracts checked against [Groq API reference](https://console.groq.com/docs/api-reference) and [Cloudflare FLUX Schnell documentation](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/). Availability, pricing and limits depend on your accounts; no free-tier allowance is assumed.

### Verification record (16 October 2026)

- Groq migration: 34 provider/article/trending/automation tests passed. The automation suite passed again with a stale stored model to verify it cannot override GROQ_MODEL. Admin production build and lint on all changed admin files passed. Backend syntax/lint passed. Local GROQ_MODEL is set to openai/gpt-oss-120b; GROQ_API_KEY remains unset, so live Groq requests are unverified.
- Automation integration suite: 8/8 passed with disposable MongoDB and mocked Groq/Cloudflare/Cloudinary, including durable rate-limit retries and source research/deduplication.
- Existing publishing tests: 2/2 passed; backend syntax check passed.
- Full backend run: 58/59 passed with `SITE_URL=http://localhost:3000`; production startup test hit its 60-second timeout during concurrent build work, then passed independently. The first run also exposed the local `.env` SITE_URL containing two comma-separated URLs; that file was not changed. Fix SITE_URL to a single deployment origin before production.
- Admin production build passed with `/automation` included. Admin lint completed with zero errors; after replacing the initial image element, targeted lint on changed admin files passed without warnings.
- Real provider credentials, live generated image URLs, live RSS availability, deployed cron delivery and browser visual/interaction testing were not verified. No production deployment, actual publishing or database migration was performed.

## Article drafting and trending selection

All text generation uses the server-only service in backend/src/services/groq.service.js, including automated article preparation. Configure these separately in backend/.env, then restart the backend:

```env
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

Use a model available to your Groq account with chat completions and JSON mode support. There is no automatic fallback model. The model displayed in admin is read-only; a previously stored automation model cannot override GROQ_MODEL. Keys never go to the browser.

Text requests default to a 4,096-token completion budget, configurable with `GROQ_MAX_COMPLETION_TOKENS` for article generation. Larger values need enough account TPM allowance for both input and requested output. Trending selection sends a compact shortlist of up to 40 ranked candidates, retains original source URLs on the server, and uses a 3,072-token output budget for five bilingual selections with low reasoning effort on GPT-OSS. Oversized requests return a specific `REQUEST_TOO_LARGE` error instead of a generic model error; the same oversized request is not retried unchanged.

The integration uses [Groq's chat completions API](https://console.groq.com/docs/api-reference), with Bearer authentication, system/user messages, response_format: json_object for structured requests, and choices[0].message.content for output. Private reasoning is omitted. Usage includes prompt, completion and total tokens. Truncated, refused, malformed and oversized responses are rejected.

Article instructions: backend/src/services/ai/prompt.js. Trending instructions: backend/src/services/trending/prompt.js. Existing HTML sanitization, schema validation, source restrictions, quotas and manual-content preservation remain active. Invalid structured output is repaired once within a shared deadline. Explicit HTTP 500/502/503 failures retry twice with exponential backoff; credential errors are not retried, and quotas retry only through the durable automation queue. Errors and logs contain sanitized metadata.

Run npm test and npm run lint in backend, and npm run lint and npm run build in admin. Backend npm run test:stack uses production builds with disposable MongoDB and mocked Groq/RSS. Live generation requires a valid GROQ_API_KEY and model access.
