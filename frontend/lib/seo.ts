import type { Metadata } from "next";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://trendsduniya.com"
).replace(/\/$/, "");
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "TrendsDuniya",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
