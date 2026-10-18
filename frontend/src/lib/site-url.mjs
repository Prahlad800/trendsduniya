export const DEFAULT_SITE_URL = "https://trendsduniya.vercel.app";

function isLocal(url) {
  const host = url.hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "[::1]" || host === "0.0.0.0" || /^127\./.test(host);
}

export function resolveSiteUrl(configured) {
  try {
    const url = new URL(configured?.trim());
    if (!configured.includes(",") && ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !isLocal(url)) return url.origin;
  } catch {}
  return DEFAULT_SITE_URL;
}

// SEO URLs describe the public website even when the newsroom runs locally.
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function articleCanonical(article, siteUrl = SITE_URL) {
  const fallback = `${siteUrl}/article/${encodeURIComponent(article.slug)}`;
  const value = article.seo?.canonicalUrl;
  if (!value || value.includes(",") || !/^(https?:\/\/|\/)/i.test(value)) return fallback;
  try {
    const url = new URL(value, siteUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || isLocal(url)) return fallback;
    return url.href;
  } catch { return fallback; }
}
