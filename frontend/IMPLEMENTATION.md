# TrendsDuniya frontend implementation

The existing Next.js frontend now has a responsive red-and-white news design and a complete dynamic article detail page. Both written briefs were used; no reference image was attached.

## Architecture and files inspected

- Frontend: Next.js 16.3.5 App Router, React 19.2.8, Tailwind 4 and shared CSS. Inspected package/config files, AGENTS.md, installed Next.js documentation, app routes, shared components, API helpers, sitemap and metadata.
- Backend: Express 5, Mongoose/MongoDB, Cloudinary images and JWT admin authentication. Inspected article/category/trending routes, article/trending controllers, Article/Author models, article/SEO services, sanitizer, environment template and existing stack tests.
- Admin: separate Next.js application under `admin/`; existing publishing, revisions, AI and upload workflows remain intact.
- Existing public article responses include title, slug, summary/excerpt, HTML content, category, tags, author, media, dates, reading time and SEO fields.
- All application changes are inside `frontend/`. Backend, admin, schemas, authentication and stored article content were not modified.

## Updated files

| Files | Change |
| --- | --- |
| `src/app/page.js` | Live homepage, hero carousel, featured stories, latest grid, categories, published-tag topic strip, most-read and category sections |
| `src/app/layout.js`, `icon.svg` | Shared red brand, mobile safe-area viewport and homepage/social metadata |
| `src/app/article/[slug]/page.jsx` | Dynamic article, metadata, hero/gallery, formatted body, related/trending sidebar and category recommendations |
| `src/app/latest/page.jsx`, `search/page.jsx` | News listing/search labels and metadata |
| `src/components/site-header.jsx`, `site-footer.jsx` | Responsive navigation, mobile search/menu, bottom navigation, theme toggle and existing footer destinations |
| `src/components/article-card.jsx`, `story-listing.jsx` | Reusable news cards, category lead stories and pagination |
| `src/components/empty-state.jsx`, `icons.jsx`, `article-actions.jsx` | Safe empty/error UI, icons, retained saves/sharing and same-origin view tracking |
| `src/lib/api.js` | Safe API error messages, validated dates and India-time formatting |
| `package.json`, `package-lock.json`, `.gitignore` | Server-side sanitizer, development-only Playwright, test command and ignored verification artifacts |

## New components and routes

- `src/app/news.css`: shared responsive news/article design system, layered over retained route styling.
- `src/components/hero-carousel.jsx`: manual accessible hero controls, without autoplay.
- `src/components/news-image.jsx`: optimized responsive images and branded missing/broken-image fallback.
- `src/components/news-sections.jsx`: section headings, topic strip and ranked news.
- `src/components/retry-button.jsx`: refreshes server data on the current route.
- `src/components/article-meta.jsx`: real author/avatar, dates, reading time and optional public views.
- `src/components/article-content.jsx`: formatted body, gallery, tags, FAQ, sources and author biography.
- `src/components/article-sidebar.jsx`: related/most-read lists with thumbnails.
- `src/components/share-buttons.jsx`: Facebook, X, WhatsApp, LinkedIn and working copy-link controls.
- `src/lib/article.js`: sanitization, text/reading-time fallbacks, link validation and deduplication.
- `src/app/article/[slug]/loading.jsx`, `error.jsx`, `not-found.jsx`: article-specific skeleton, retry and missing-article states.
- `src/app/trending/page.jsx`: paginated most-read news.
- `src/app/api/articles/[id]/view/route.js`: narrowly scoped proxy for the existing backend view endpoint.
- `.env.example`, `scripts/test-frontend.mjs`: configuration and isolated browser checks.

## API integration and routing

| Purpose | Existing backend endpoint |
| --- | --- |
| Homepage/latest | `GET /api/articles?limit=24`; listing pages use page/limit |
| Article detail | `GET /api/articles/:slug` |
| Related articles | `GET /api/articles/:slug/related` |
| Categories | `GET /api/categories`, `GET /api/categories/:slug` |
| Category articles | `GET /api/articles/category/:slug` |
| Search | `GET /api/articles/search?q=...&page=...&limit=12` |
| Most-read/trending | `GET /api/articles?sort=-analytics.views&limit=...` |
| Tags/authors | Existing tag/author detail and article taxonomy endpoints |
| View tracking | Frontend `POST /api/articles/:id/view` forwards to the existing backend endpoint |

Cards navigate to `/article/[slug]`; `/news/[slug]` remains a legacy redirect. Renamed slugs resolve to the canonical route. Missing articles show the article-specific not-found page.

Requests use `cache: "no-store"`. New publications and edits appear on the next server render/navigation or refresh; an already-open page does not poll automatically. Only published public articles are requested.

Related stories use the existing related endpoint, with same-category/recent articles as fallback. The current slug is excluded and duplicates removed. Additional category stories appear when available. Trending uses the backend's supported descending view sort; homepage topic pills use actual published tags.

## Article rendering and SEO

- Server-rendered article and sidebar; client JavaScript is limited to interactions and image fallback handling.
- Frontend sanitization supplements the backend sanitizer. Semantic headings, lists, emphasis, quotes, tables, figures and links are retained. Scripts, iframes, event handlers and unsafe URLs are removed. Arbitrary inline styling is removed in favor of shared typography.
- Missing author information is omitted. Missing summary falls back to excerpt/plain article text. Missing hero images use a branded placeholder. Numeric views are shown only if exposed publicly.
- Dynamic title, description, canonical, Open Graph and Twitter metadata use actual article fields. JSON-LD includes Article or NewsArticle according to article type, real author/publisher data and BreadcrumbList.
- One H1, semantic navigation, image alternatives, visible focus, accessible controls, Escape dismissal and reduced-motion support.

## Responsive behavior

- Centered 1400px maximum layout. Desktop hero and side cards; responsive latest-news grids.
- Article reading column plus 330px sidebar, with body text limited to 800px. Below 1000px, related/trending content stacks below the article.
- Mobile compact header, horizontal category/topic scrolling, one-column cards and touch-friendly share controls.
- Fixed mobile navigation reserves safe-area space at the end of the page.
- Long breadcrumbs wrap/truncate; tables/code scroll within the article.
- Images retain aspect ratio, with lazy loading below the fold and fallbacks on failure.
- Additional article photos are distributed between complete paragraphs throughout the body. Existing inline/hero images are deduplicated; very short articles keep only photos that cannot fit between paragraphs in the end gallery. Captions and image order are preserved.

## Environment and running

```env
API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`API_URL` is server-side and must include `/api`. `NEXT_PUBLIC_API_URL` remains an optional legacy fallback when `API_URL` is absent. The view tracker no longer needs a public API URL. No credentials are exposed.

Use the existing `npm run dev`, `npm run lint`, `npm run build` and `npm start` commands. The preview prepared during this work uses frontend **3100** and backend **5100**, because other projects occupied 3000/5000. Existing environment files were not overwritten. Before deployment, configure production origins and keep the backend SITE_URL consistent with the frontend public origin.

## Verification

- Production build and ESLint passed.
- **19 browser integration checks passed**, using isolated public-API fixtures without inserting fixture content into MongoDB.
- Homepage, category and article overflow checks passed at **320, 360, 375, 390, 414, 430, 768, 820, 912, 1024, 1280, 1366, 1440, 1536 and 1920px**.
- Verified hero controls, mobile search/menu, category navigation, pagination, saves, share URLs/copy-link, sanitization, metadata/JSON-LD, missing fields/images, invalid articles, view proxy, API errors/retry, empty data and streamed article loading.
- No browser JavaScript or hydration errors in the suite. A deliberately failed image request verifies the fallback.
- The real local article also rendered at desktop/mobile sizes; its hero and four gallery images loaded.
- Rerun with `npm run build`, then `npm run test:frontend`. Tests use installed Microsoft Edge by default; set `BROWSER_CHANNEL=chrome` for installed Chrome.
- Screenshots and the machine-readable report are in ignored `test-results/`.

## Remaining data/configuration limitations

- The local database had one published article during verification. Additional sections appear as suitable content is published.
- Trend research is admin-only; public trending uses supported view ranking. Public article responses omit numeric view counts and video fields, so neither fake counts nor video controls were added.
- No language-filter API, public account system, push-notification service, official social-profile URLs, contact page or legal routes were present. These were not fabricated. The bell opens latest news; footer links use existing routes.
- Theme is session UI state. No translation or account-level preference storage is claimed.
- No date/time API exists; the top bar uses the browser clock formatted for India.
- A non-blocking Next.js warning reports a package-lock file outside this repository. It did not prevent the successful build.
