const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, "..", `${relative}.ts`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => (name.startsWith("@/") ? load(name.slice(2)) : require(name)),
    mod,
    mod.exports,
  );
  return mod.exports;
}
const { trends, categories } = load("data/trends");
const { getTrends, getTrend, getRelatedTrends, isIndexable } =
  load("lib/trends");
const sitemap = load("app/sitemap").default;
const { jsonLd } = load("lib/seo");
test("unique URLs, distinct content and valid editorial dates", () => {
  assert.equal(trends.length, 30);
  assert.equal(new Set(trends.map((t) => t.slug)).size, trends.length);
  assert.equal(new Set(trends.map((t) => t.id)).size, trends.length);
  assert.equal(new Set(trends.map((t) => t.overview)).size, trends.length);
  for (const t of trends) {
    assert.match(t.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(categories.includes(t.category));
    assert.ok(t.overview.length > 100 && t.whyTrending.length > 60);
    assert.ok(t.keyPoints.length >= 2);
    assert.ok(Number.isFinite(Date.parse(t.publishedAt)));
    assert.ok(Date.parse(t.updatedAt) >= Date.parse(t.publishedAt));
    assert.equal(getTrend(t.slug), t);
  }
});
test("supplied metrics preserved; unknown values absent", () => {
  assert.equal(getTrends({ source: "google" }).length, 9);
  assert.equal(getTrends({ source: "x" }).length, 21);
  assert.equal(getTrend("real-betis-vs-real-madrid").searchVolume, "200K+");
  assert.equal(getTrend("teachers-day-quotes").relatedCount, 34);
  assert.equal(getTrend("himalayan-440").growth, "400%");
  assert.equal(getTrend("psg-vs-monaco").relatedCount, undefined);
  assert.equal(getTrend("machhli").searchVolume, undefined);
  for (const t of getTrends({ source: "x" }))
    assert.equal(t.searchVolume, undefined);
});
test("search combines titles, categories, related terms and source filters", () => {
  assert.equal(getTrends({ query: " REAL MADRID " }).length, 2);
  assert.equal(getTrends({ query: "cloudnative" })[0].slug, "scalability");
  assert.equal(getTrends({ query: "मछली" })[0].slug, "machhli");
  assert.ok(
    getTrends({ query: "sports", source: "x" }).every(
      (t) => t.category === "Sports" && t.source === "x",
    ),
  );
  assert.equal(getTrends({ query: "unmatched-xyz" }).length, 0);
});
test("related topics prioritize explicit matches and exclude self", () => {
  const t = getTrend("real-betis-vs-real-madrid");
  const related = getRelatedTrends(t);
  assert.equal(related[0].slug, "real-betis-vs-real-madrid-standings");
  assert.ok(related.every((r) => r.slug !== t.slug));
});
test("noindex defaults and sitemap exclusions", () => {
  assert.equal(isIndexable({ ...trends[0], indexable: undefined }), false);
  assert.ok(trends.every((t) => !isIndexable(t)));
  assert.ok(sitemap().every((entry) => !entry.url.includes("/trend/")));
  assert.ok(sitemap().every((entry) => !entry.url.endsWith("/category/india")));
});
test("one new reviewed object propagates automatically; noindex removes sitemap entry", () => {
  const added = {
    ...trends[0],
    id: "test-new-record",
    slug: "test-new-record",
    title: "New reviewed topic",
    updatedAt: "2026-09-06T09:00:00Z",
    indexable: true,
  };
  trends.push(added);
  try {
    assert.equal(getTrends()[0].slug, added.slug);
    assert.ok(
      getTrends({ source: added.source, category: added.category }).includes(
        added,
      ),
    );
    assert.equal(getTrend(added.slug), added);
    assert.ok(
      getRelatedTrends(
        getTrend("real-betis-vs-real-madrid-standings"),
      ).includes(added),
    );
    assert.equal(
      sitemap().find((e) => e.url.endsWith(`/trend/${added.slug}`))
        .lastModified,
      added.updatedAt,
    );
    added.indexable = false;
    assert.ok(!sitemap().some((e) => e.url.endsWith(`/trend/${added.slug}`)));
  } finally {
    trends.pop();
  }
});
test("JSON-LD prevents script breakout and preserves the value", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const encoded = jsonLd(value);
  assert.ok(!encoded.includes("<"));
  assert.deepEqual(JSON.parse(encoded), value);
});
