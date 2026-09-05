import type { TrendSource } from "@/data/trends";
export default function TrendSourceBadge({ source }: { source: TrendSource }) {
  return (
    <span className={`badge source-${source}`}>
      {source === "google" ? "Google" : "X"}
    </span>
  );
}
