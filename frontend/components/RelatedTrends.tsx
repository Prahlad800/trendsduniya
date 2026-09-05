import type { Trend } from "@/data/trends";
import { getRelatedTrends } from "@/lib/trends";
import TrendList from "./TrendList";
export default function RelatedTrends({ trend }: { trend: Trend }) {
  return (
    <section className="section">
      <h2>Related Trends</h2>
      <TrendList trends={getRelatedTrends(trend)} />
    </section>
  );
}
