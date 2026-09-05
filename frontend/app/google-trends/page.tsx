import ListingPage from "@/components/ListingPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Latest Google Trends & Trending Searches",
  "Explore manually collected Google trend snapshots, supplied search-interest figures and topic-specific context.",
  "/google-trends",
);
export default function Page() {
  return (
    <ListingPage
      title={"Latest Google Trends & Trending Searches"}
      description={
        "Explore manually collected Google trend snapshots, supplied search-interest figures and topic-specific context."
      }
      source="google"
    />
  );
}
