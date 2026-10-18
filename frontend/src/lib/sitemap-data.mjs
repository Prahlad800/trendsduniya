import {articleCanonical, SITE_URL} from "./site-url.mjs";

export async function buildSitemap(getPublic, siteUrl = SITE_URL) {
  const pages = [
    {url: siteUrl, changeFrequency: "daily", priority: 1},
    {url: `${siteUrl}/latest`, changeFrequency: "daily", priority: 0.9},
    {url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.7},
    {url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4},
  ];
  const seen = new Set(pages.map(page => page.url));
  let page = 1, more = true;
  while (more && pages.length < 49900) {
    const result = await getPublic(`/articles?limit=100&page=${page}`);
    for (const article of result.data || []) {
      if (!article.slug || article.seo?.robots?.index === false) continue;
      const url = articleCanonical(article, siteUrl);
      // Respect deliberate cross-domain canonicals without emitting them here.
      if (new URL(url).origin !== new URL(siteUrl).origin || seen.has(url)) continue;
      const modified = article.updatedAt || article.publishedAt;
      pages.push({url, ...(modified && !Number.isNaN(Date.parse(modified)) ? {lastModified: modified} : {}), changeFrequency: "weekly", priority: 0.8});
      seen.add(url);
      if (pages.length >= 49900) break;
    }
    more = result.pagination?.hasNextPage;
    page++;
  }
  return pages;
}
