import {test} from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_SITE_URL, resolveSiteUrl, articleCanonical} from "../src/lib/site-url.mjs";
import {buildSitemap} from "../src/lib/sitemap-data.mjs";

test("public SEO origin never falls back to a development host", () => {
  for (const value of [undefined, "", "broken", "http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000", "http://localhost:3000,https://trendsduniya.vercel.app", "javascript:alert(1)", "https://user:password@example.com"]) {
    assert.equal(resolveSiteUrl(value), DEFAULT_SITE_URL);
  }
  assert.equal(resolveSiteUrl(" https://news.example.com/ "), "https://news.example.com");
});

test("old local and malformed article canonicals become public URLs", () => {
  for (const canonicalUrl of [undefined, "http://localhost:3000/article/old", "http://127.0.0.1/article/old", "http://localhost:3000,https://trendsduniya.vercel.app/article/old", "javascript:alert(1)", "not a URL"]) {
    assert.equal(articleCanonical({slug: "हिंदी-news", seo: {canonicalUrl}}), `${DEFAULT_SITE_URL}/article/${encodeURIComponent("हिंदी-news")}`);
  }
  assert.equal(articleCanonical({slug: "story", seo: {canonicalUrl: "https://publisher.example/original"}}), "https://publisher.example/original");
});

test("sitemap reads every API page, includes new posts and omits noindex/external canonicals", async () => {
  let published = [{slug: "old", seo: {canonicalUrl: "http://localhost:3000/article/old"}}];
  const calls = [];
  const getPublic = async path => {
    calls.push(path);
    const page = Number(new URL(path, DEFAULT_SITE_URL).searchParams.get("page"));
    return {data: page === 1 ? published : [
      {slug: "hidden", seo: {robots: {index: false}}},
      {slug: "external", seo: {canonicalUrl: "https://publisher.example/original"}},
      {slug: "old"},
      {slug: "हिंदी", updatedAt: "2026-10-18T08:00:00Z"},
    ], pagination: {hasNextPage: page === 1}};
  };
  const before = await buildSitemap(getPublic);
  published = [...published, {slug: "newly-published"}];
  const after = await buildSitemap(getPublic);
  assert.equal(after.length, before.length + 1);
  assert.ok(after.some(page => page.url === `${DEFAULT_SITE_URL}/article/newly-published`));
  assert.ok(after.some(page => page.url === `${DEFAULT_SITE_URL}/article/${encodeURIComponent("हिंदी")}`));
  assert.equal(after.filter(page => page.url.endsWith("/article/old")).length, 1);
  assert.ok(after.every(page => !/localhost|publisher\.example|\/hidden$/.test(page.url)));
  assert.deepEqual(calls, ["/articles?limit=100&page=1", "/articles?limit=100&page=2", "/articles?limit=100&page=1", "/articles?limit=100&page=2"]);
});
