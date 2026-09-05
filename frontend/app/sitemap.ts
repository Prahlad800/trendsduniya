import type { MetadataRoute } from "next";
import { categories, trends } from "@/data/trends";
import { getTrends, isIndexable } from "@/lib/trends";
import { SITE_URL } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...[
      "/",
      "/trends",
      "/google-trends",
      "/x-trends",
      "/about",
      "/privacy-policy",
      "/terms",
      "/contact",
    ].map((path) => ({ url: `${SITE_URL}${path}` })),
    ...categories
      .filter((category) => getTrends({ category }).length > 0)
      .map((category) => ({
        url: `${SITE_URL}/category/${category.toLowerCase()}`,
      })),
    ...trends
      .filter(isIndexable)
      .map((trend) => ({
        url: `${SITE_URL}/trend/${trend.slug}`,
        lastModified: trend.updatedAt,
      })),
  ];
}
