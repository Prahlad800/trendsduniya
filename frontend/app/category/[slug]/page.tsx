import { notFound } from "next/navigation";
import { categories } from "@/data/trends";
import ListingPage from "@/components/ListingPage";
import { pageMetadata } from "@/lib/seo";
import { getTrends } from "@/lib/trends";
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.toLowerCase() }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.toLowerCase() === slug);
  if (!category) notFound();
  return {
    ...pageMetadata(
      `${category} Trends`,
      `Explore ${category.toLowerCase()} topics from manually collected Google and X snapshots.`,
      `/category/${slug}`,
    ),
    robots: { index: getTrends({ category }).length > 0, follow: true },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.toLowerCase() === slug);
  if (!category) notFound();
  return (
    <ListingPage
      title={`${category} Trends`}
      description={`Discover ${category.toLowerCase()} topics and explore the context behind the supplied snapshot.`}
      category={category}
    />
  );
}
