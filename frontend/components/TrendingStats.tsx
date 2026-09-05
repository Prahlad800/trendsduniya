import { trends } from "@/data/trends";
export default function TrendingStats() {
  return (
    <dl className="stats">
      {[
        [trends.length, "Topics to explore"],
        [
          trends.filter((t) => t.source === "google").length,
          "Google snapshots",
        ],
        [trends.filter((t) => t.source === "x").length, "X snapshots"],
        [new Set(trends.map((t) => t.category)).size, "Categories represented"],
      ].map(([count, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {count}
            <span aria-hidden="true">↗</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
