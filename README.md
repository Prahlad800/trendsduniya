# TrendsDuniya

Independent, manually curated trend discovery in the existing `frontend/` Next.js 16 App Router application. React 19, strict TypeScript and Tailwind CSS 4. No backend, database, scraping or admin panel.

## Run and deploy

Use Node.js 20.9+ (Node 22 LTS recommended).

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. Production validation:

```bash
npm run lint
npm test
npm run build
npm start
```

Deploy with `frontend` as project root, `npm ci` as install command and `npm run build` as build command. Use a Node-compatible Next.js host; query search is server rendered. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.example` before building to override `https://trendsduniya.com`. It drives canonical URLs, social metadata, JSON-LD, sitemap and robots.

## Add tomorrow's trends

Open `frontend/data/trends.ts` and add ONE object to `trends`:

```ts
{
  id: "2026-09-06-example",
  title: "Example Trend",
  slug: "example-trend",
  source: "google", // or "x"
  category: "Technology",
  region: "Not supplied", // Replace only when known
  status: "active", // Snapshot status: active, cooling or ended
  shortDescription: "Write a specific and accurate summary.",
  overview: "Write useful original topic context here.",
  whyTrending: "Give a verified explanation, or state that the cause is unknown.",
  keyPoints: ["A concrete useful point.", "Another verified point."],
  relatedKeywords: ["Relevant term", "Another relevant term"],
  publishedAt: "2026-09-06T09:00:00Z", // Actual site publication time
  updatedAt: "2026-09-06T09:00:00Z", // Actual editorial update time
  indexable: false, // Set true only after substantive editorial review
  // searchVolume: "50K+", // Only if supplied by a documented source
  // growth: "300%",
  // relatedCount: 3,
  // sourceUrl: "https://...", // Direct verified source URL
  // faqs: [{question: "A real question", answer: "A useful answer"}],
}
```

Replace this template text with reviewed content. Use unique IDs and lowercase hyphenated slugs; keep existing slugs stable when updating. Never invent unknown figures, regions, fixture dates, results, injuries or launches. Use actual editorial dates. Run checks, commit and redeploy; this is a manual workflow.

That object automatically supplies the detail URL, search, full listing, source and category listing, and related links. Homepage sections pick recent/active records, so newer records enter the selected cards automatically. Every record is accessible in the full listing. Setting `indexable: true` also adds its URL and actual `updatedAt` to the sitemap. No per-topic React page is needed.

## Editorial rules

- Initial data: 30 owner-supplied examples, 9 Google and 21 X. September 5, 2026 is the editorial publication date on this site, not an invented source capture date. Original source capture time and metric measurement window are unknown.
- All initial records are explicitly `indexable: false`, readable with `noindex, follow`, and excluded from the sitemap. An omitted indexable field also defaults to false. Enable only after checking sources, resolving ambiguities and writing meaningful original content.
- Supplied numbers are preserved. Missing X counts and the missing मछली volume stay absent. Unknown regions show “Not supplied.” Status reflects the supplied snapshot, not a live signal. Topics can be added daily; the site does not claim an automated daily refresh.
- Ordering: active, cooling, ended; newest editorial update within status; array order breaks ties. This is editorial selection, not a verified cross-platform popularity ranking.
- Related links prioritize related-keyword/title matches, then category, then source; self-links are excluded.
- Empty categories and search-query pages are noindex. Empty categories are excluded from the sitemap.
- Home emits WebSite/Organization JSON-LD. Detail pages emit visible breadcrumbs. Only reviewed/indexable records emit Article and, when present on the page, FAQPage data. No fake authors, ratings or dates.
- Configure a public contact channel and review starter privacy/terms for the real hosting arrangement before launch. Contact has no fake address or nonfunctional submission form.

## Routes

`/`, `/trends`, `/google-trends`, `/x-trends`, `/category/[slug]`, `/trend/[slug]`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/sitemap.xml`, `/robots.txt`. Unknown topics/categories return a custom 404.

## Files

- `frontend/data/trends.ts`: typed model, categories, editable content.
- `frontend/lib/trends.ts`: filtering, sorting, related logic and indexing rules.
- `frontend/lib/seo.ts`: domain, metadata and safe JSON-LD serialization.
- `frontend/components/`: reusable header, footer, hero, cards, listings, search and breadcrumbs. Only TrendExplorer needs browser state; other components are Server Components by default.
- `frontend/app/`: pages, native Metadata API, sitemap/robots, icon and responsive styles. System fonts avoid external font loading and font-swap shifts.
- `frontend/tests/`: content, search, related linking, indexing and automatic-propagation regression checks.

Measure Lighthouse on the deployed host; no scores or rankings are guaranteed.
