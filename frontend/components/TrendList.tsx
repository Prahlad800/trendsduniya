import type { Trend } from "@/data/trends";
import TrendCard from "./TrendCard";
export default function TrendList({ trends }: { trends: Trend[] }) {
  return trends.length ? (
    <div className="trend-grid">
      {trends.map((trend, i) => (
        <TrendCard key={trend.id} trend={trend} rank={i + 1} />
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <h2>No matching trends</h2>
      <p>Try another keyword or clear a filter to explore more topics.</p>
    </div>
  );
}
