import type { Trend } from "@/data/trends";
export default function TrendBadge({ status }: { status: Trend["status"] }) {
  return (
    <span className={`badge status-${status}`}>
      <span aria-hidden="true">●</span>{" "}
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
