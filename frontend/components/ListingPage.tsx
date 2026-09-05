import TrendExplorer from "./TrendExplorer";
import Breadcrumbs from "./Breadcrumbs";
import { getTrends, latestUpdate } from "@/lib/trends";
import { formatDate } from "@/lib/utils";
import type { Category, TrendSource } from "@/data/trends";
export default function ListingPage({
  title,
  description,
  source,
  category,
  query = "",
}: {
  title: string;
  description: string;
  source?: TrendSource;
  category?: Category;
  query?: string;
}) {
  return (
    <div className="page-space">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          {
            label:
              category ??
              (source === "google"
                ? "Google Trends"
                : source === "x"
                  ? "X Trends"
                  : "All Trends"),
          },
        ]}
      />
      <div className="page-intro">
        <p className="eyebrow">EXPLORE THE SNAPSHOT</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <p className="fine-print">
          Latest editorial update: {formatDate(latestUpdate())} · Owner-supplied
          examples, manually maintained. Source capture time was not supplied.
        </p>
      </div>
      <TrendExplorer
        key={query}
        trends={getTrends({ source, category })}
        initialQuery={query}
        fixedSource={source}
        fixedCategory={category}
      />
    </div>
  );
}
