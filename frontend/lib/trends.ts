import {
  trends,
  type Trend,
  type Category,
  type TrendSource,
} from "@/data/trends";
const priority = { active: 0, cooling: 1, ended: 2 };
export function getTrends(
  filters: { query?: string; category?: Category; source?: TrendSource } = {},
) {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  return trends
    .filter(
      (t) =>
        (!filters.source || t.source === filters.source) &&
        (!filters.category || t.category === filters.category) &&
        (!query ||
          [t.title, t.category, ...t.relatedKeywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query)),
    )
    .sort(
      (a, b) =>
        priority[a.status] - priority[b.status] ||
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
}
export function getTrend(slug: string) {
  return trends.find((t) => t.slug === slug);
}
export function getRelatedTrends(trend: Trend) {
  const normalize = (s: string) => s.toLowerCase().replace(/^#/, "");
  const score = (t: Trend) =>
    (trend.relatedKeywords.some((k) => normalize(k) === normalize(t.title)) ||
    t.relatedKeywords.some((k) => normalize(k) === normalize(trend.title))
      ? 100
      : 0) +
    (t.category === trend.category ? 10 : 0) +
    (t.source === trend.source ? 1 : 0);
  return getTrends()
    .filter((t) => t.slug !== trend.slug)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4);
}
export function latestUpdate() {
  return trends.reduce(
    (latest, trend) => (trend.updatedAt > latest ? trend.updatedAt : latest),
    trends[0]?.updatedAt ?? "2026-09-05T00:00:00Z",
  );
}
export function isIndexable(trend: Trend) {
  return trend.indexable === true;
}
