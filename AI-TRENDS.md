# TrendsDuniya Gemini AI

Article drafting and trending selection use the server-only service in backend/src/services/gemini.service.js.

## Setup

In backend/.env, configure these separately, then restart the backend:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

Fill GEMINI_API_KEY with your Google AI Studio key. Never put it in frontend or admin environment variables. GEMINI_MODEL is independently editable; use a text model available to your project with JSON output support. There is no automatic model fallback.

The integration uses Google's [generateContent REST API](https://ai.google.dev/api/generate-content), with systemInstruction, contents and JSON responseMimeType. Model availability is listed in the [official model catalog](https://ai.google.dev/gemini-api/docs/models).

## Prompts

- Article editorial instructions: backend/src/services/ai/prompt.js
- Trending selection instructions: backend/src/services/trending/prompt.js

Article content is an HTML fragment with inline CSS for headings, paragraph spacing, takeaway boxes and responsive tables. The backend preserves a restricted set of typography, color, spacing and table styles during both AI parsing and article saves. CSS URLs, positioning, hidden content, scripts and event handlers are removed. The public article page supplies the H1 and SEO tags; generated content uses H2/H3 and returns metadata separately. The requested length is a target, never a reason to invent facts or pad the article.

Schemas are appended in code. Supplied headlines and source data are untrusted input. The model has no live browsing: URL strings do not verify facts. Drafts must identify missing evidence and never fabricate to meet the requested length. Trends select exactly 20 distinct supplied candidates, with relative editorial scores.

## Behavior and checks

The admin AI status page displays Gemini configuration and tests the connection. Existing permissions, quotas, HTML sanitization, JSON validation and manual-content preservation remain in place. Invalid structured output is retried once within the same deadline; explicit HTTP 500/502/503 failures retry at most twice with exponential backoff within the same deadline and using the same model. Authentication, quota, network and invalid-output failures are not transport-retried. Provider errors are sanitized before returning or logging.

Run npm test and npm run lint in backend, and npm run lint and npm run build in admin. Backend npm run test:stack uses production builds with disposable MongoDB and mocked Gemini/RSS. Live generation requires a valid key and accessible model.
