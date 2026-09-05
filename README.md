# TrendsDuniya

Independent Hindi and English news context and explainers, built inside the existing `frontend/` Next.js 16, React 19, TypeScript, Tailwind 4 and App Router project. No backend, external database, CMS or article API is required.

## Run locally

Requires Node.js 20.9 or newer (the implementation was checked using Node 25).

```sh
cd frontend
npm ci
npm run dev
```

Visit http://localhost:3000. For production:

```sh
npm run build
npm start
npm run lint
node scripts/check-content.mjs
```

The lockfile preserves the existing Next.js and React versions. If dependencies intentionally change, use `npm install`. A project-local cache can be used on restricted Windows systems: `npm ci --cache .npm-cache`.

## Add tomorrow's story

Open **`frontend/data/topics.ts`** and add one object to the exported `topics` array. `Topic` is exported there for convenience and defined strictly in `frontend/lib/types.ts`.

```ts
{
  id: 'your-unique-topic',
  slug: 'your-unique-topic',
  title: 'The Actual Topic Name',
  language: 'en', // only 'en' or 'hi'
  category: 'Technology',
  excerpt: 'A unique, useful description of this particular story.',
  introduction: 'Original context supported by sources you have checked.',
  sections: [
    { heading: 'A topic-specific heading', paragraphs: ['A useful paragraph.', 'Another supported detail.'] },
  ],
  keyPoints: ['An optional concise takeaway.'],
  relatedSearches: ['A relevant alternate phrase'],
  relatedTopics: ['poco-x8'], // existing article slugs, never category URLs
  sources: [{ name: 'Name of the actual source', url: 'https://your-verified-source.example/article' }],
  publishedAt: '2026-09-06T08:00:00+05:30', // use your actual publication time
  updatedAt: '2026-09-06T08:00:00+05:30',
  featured: false,
  indexable: true,
}
```

The example is a schema illustration, not a story to publish: replace every placeholder, source URL and date. Visible card titles and article H1s use `title` unchanged. Metadata adds a descriptive suffix separately.

After saving, the development server updates automatically. **Rebuild and redeploy a production site** to publish the change. Static pages are not edited live after deployment. No per-article `page.tsx` is needed.

The new object appears in the homepage's full story browser, `/latest`, its category, search, its `/topic/[slug]` page and the sitemap when indexable. Latest sorting uses `updatedAt`, then `publishedAt`, newest first. Article related sections combine explicit links, incoming links and the latest same-category stories automatically (up to six). Card counts use only unique valid explicit related slugs, ignoring self-links and missing pages. For deliberate editorial placement, add the new slug to existing related arrays.

## Editorial fields

- Use natural Hindi (`hi`) or English (`en`) throughout an article. Mixed-language site navigation does not translate the article. Hindi article containers carry `lang="hi"`.
- Choose one of the twelve categories in `lib/types.ts`: Sports, Entertainment, Technology, Automobile, Education, Science, Health, Business, Finance, India, World, Lifestyle.
- Use a unique, lowercase ASCII hyphenated slug. Do not rename a published slug without adding an intentional redirect in Next configuration.
- `sections` are rendered in order and automatically populate the desktop contents navigation. Avoid generic repeated paragraphs.
- `sources` should link to original announcements or dependable reporting. Verify the specific statement, not merely that a website exists. External links use safe new-tab attributes.
- `faqs` are optional. Only visible FAQs generate FAQ structured data.
- Optional `image`, `imageAlt` and `imageCredit` support licensed local assets in `frontend/public/`. Use a path such as `/images/your-photo.jpg` and meaningful alt text. No news-publisher hotlinks or unrelated filler pictures are bundled.
- `featured: true` makes an article eligible for the first three top-story positions. The seed collection does not use `breaking`; set it only when editorially justified. No invented live ticker is shown.
- Set `indexable: false` for limited or draft-like material. It remains accessible to readers but receives `noindex,follow` and is omitted from the sitemap. This is not access control and does not make unsupported claims acceptable.
- Change `updatedAt` only for a substantive edit. Publication dates refer to this publication's article creation, not the historical event date.

## Initial collection: important editorial limits

The collection contains 50 original entries, including shorter source/context briefs. It is **not 50 fully reported long-form current-news articles**. Google Trends India and the third-party Trends24 India X tracker were consulted on 5 September 2026 for discovery; linked official and publisher sources were checked for context. Related explainers are included and are not all independently verified as trending terms. The source tracker is not direct authenticated access to X.

Some original candidates were ambiguous, stale or unsupported. They were omitted or narrowed; no review was invented for Mirzapur, no speculative model announcement was published, and no unverified incident allegation was asserted. Short/limited entries are noindex. See `EDITORIAL_RESEARCH.md` and the content audit for the exact scope. A noindex flag is not a replacement for human review. The owner must review this AI-assisted starter collection before production and expand/recheck it as stories develop.

## Routes and SEO

- `/topic/[slug]` and `/category/[slug]` use static parameter generation and native Metadata API. Unknown slugs call `notFound()`.
- Unique titles, descriptions, absolute canonicals, Open Graph and Twitter metadata derive from each topic. Query parameters do not change an article canonical.
- Article and breadcrumb JSON-LD uses real topic dates and the editorial team label. Homepage JSON-LD defines WebSite and Organization. JSON is escaped before embedding.
- `app/sitemap.ts` derives all indexable article URLs, categories and policy URLs from local data. Rebuilding after a new topic updates the sitemap.
- `app/robots.ts` permits crawling and points to the sitemap. No category or topic path is blocked. Search is noindex to avoid low-value search pages.
- Seven publication pages are linked from the footer. No verification token, physical address, human author identity or review rating is invented.

## Owner configuration before launch

Copy `frontend/.env.example` to `frontend/.env.local`, then set genuine values. `frontend/config/site.ts` is the central configuration.

```dotenv
NEXT_PUBLIC_SITE_URL=https://trendsduniya.com
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```

Use the deployed HTTPS origin for the domain. Add the real contact email; the Contact page shows an honest unavailable notice until then. `socialUrls` is an empty array reserved for genuine profiles. Update policy wording and owner identity for the actual operation. Public environment values are not secrets. Rebuild when changing them.

To connect Search Console later, verify the real domain using Google's supplied DNS record or your chosen supported method, then submit `/sitemap.xml`. Do not add invented verification values. Canonicals alone cannot fix a misconfigured domain or redirects; configure your host to redirect alternate domains to the preferred origin.

## Advertising preparation

No ads, tracking analytics, fake ad units or blank ad boxes are enabled by default. The AdSense script loads only when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` matches a real-format `ca-pub-` identifier followed by 16 digits. The site does not validate ownership of that identifier.

Before enabling advertising, obtain the real ID from Google, review the actual site's policies, and implement any required regional consent/CMP flow. The opt-in script is an integration hook, **not a complete consent implementation**. Future manual units can be placed after the introduction, between substantive sections or after the article; create them only with real slot IDs and keep editorial content dominant. Auto ads, if enabled in Google's account, should be reviewed for density and usability.

After approval, add the exact official **ads.txt** entry provided by Google to `frontend/public/ads.txt`. No fake entry is supplied. Rebuild/deploy, verify `/ads.txt`, then check Google's account diagnostics. There is no guarantee of AdSense approval.

## Checks and review

`node scripts/check-content.mjs` checks unique IDs, slugs, excerpts, introductions and paragraphs; valid categories/languages/dates/sources; related-link integrity; and image alt requirements. It reports word counts and noindex slugs. It is a structural audit, not proof that every factual claim is correct.

Production smoke tests should verify every article and category, unknown-slug 404s, sitemap/noindex agreement, one H1 per page, canonical values, mobile menu, search and language filters. Re-check source facts manually before public release.
