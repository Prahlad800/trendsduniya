import ListingPage from "@/components/ListingPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "What\u2019s Trending on X",
  "Explore conversation topics from the owner-supplied X snapshot. Categories and regions are shown where supplied; no post counts are inferred.",
  "/x-trends",
);
export default function Page() {
  return (
    <ListingPage
      title={"What\u2019s Trending on X"}
      description={
        "Explore conversation topics from the owner-supplied X snapshot. Categories and regions are shown where supplied; no post counts are inferred."
      }
      source="x"
    />
  );
}
