import Link from "next/link";
import type { Trend } from "@/data/trends";
import TrendBadge from "./TrendBadge";
import TrendSourceBadge from "./TrendSourceBadge";
export default function TrendCard({
  trend,
  rank,
}: {
  trend: Trend;
  rank?: number;
}) {
  return (
    <article className="trend-card">
      <div className="card-top">
        <span className="eyebrow">
          {rank ? `#${String(rank).padStart(2, "0")} · ` : ""}
          {trend.category}
        </span>
        <TrendSourceBadge source={trend.source} />
      </div>
      <h3>
        <Link href={`/trend/${trend.slug}`}>{trend.title}</Link>
      </h3>
      <p className="card-description">{trend.shortDescription}</p>
      {trend.source === "x" && (
        <p className="related-caption">
          {trend.region !== "Not supplied" && (
            <>
              Trending in {trend.region}
              <br />
            </>
          )}
          Explore: {trend.relatedKeywords.join(" · ")}
        </p>
      )}
      <div className="card-metrics">
        {trend.searchVolume && (
          <span>
            <strong>{trend.searchVolume}</strong> searches
          </span>
        )}
        {trend.growth && <span className="growth">↑ {trend.growth}</span>}
      </div>
      <div className="card-bottom">
        <TrendBadge status={trend.status} />
        {trend.relatedCount !== undefined && (
          <span className="muted">+{trend.relatedCount} related</span>
        )}
        <Link
          href={`/trend/${trend.slug}`}
          aria-label={`Read trend: ${trend.title}`}
        >
          Read Trend <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
