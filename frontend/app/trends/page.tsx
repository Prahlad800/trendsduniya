import ListingPage from "@/components/ListingPage";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return {
    ...pageMetadata(
      "Latest Trending Topics",
      "Browse manually collected Google and X topics. Search by keyword, source or category.",
      "/trends",
    ),
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return (
    <ListingPage
      title="Latest Trending Topics"
      description="A little less scrolling. A little more understanding. Search topics and explore the context behind them."
      query={typeof q === "string" ? q.slice(0, 150) : ""}
    />
  );
}
