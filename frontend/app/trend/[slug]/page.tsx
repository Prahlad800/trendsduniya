import Link from "next/link";
import { notFound } from "next/navigation";
import { trends } from "@/data/trends";
import { getTrend, isIndexable } from "@/lib/trends";
import { formatDate } from "@/lib/utils";
import { SITE_URL, pageMetadata } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrendBadge from "@/components/TrendBadge";
import TrendSourceBadge from "@/components/TrendSourceBadge";
import RelatedTrends from "@/components/RelatedTrends";
import StructuredData from "@/components/StructuredData";
export function generateStaticParams() {
  return trends.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trend = getTrend(slug);
  if (!trend) notFound();
  return {
    ...pageMetadata(
      `${trend.title}: Trend Explained`,
      trend.shortDescription,
      `/trend/${slug}`,
    ),
    keywords: trend.relatedKeywords,
    robots: { index: isIndexable(trend), follow: true },
    openGraph: {
      type: "article" as const,
      title: `${trend.title}: Trend Explained`,
      description: trend.shortDescription,
      url: `${SITE_URL}/trend/${slug}`,
      publishedTime: trend.publishedAt,
      modifiedTime: trend.updatedAt,
      siteName: "TrendsDuniya",
    },
  };
}
export default async function TrendPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trend = getTrend(slug);
  if (!trend) notFound();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    {
      label: trend.category,
      href: `/category/${trend.category.toLowerCase()}`,
    },
    { label: trend.title },
  ];
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.label,
        item: `${SITE_URL}${b.href ?? `/trend/${slug}`}`,
      })),
    },
  ];
  if (isIndexable(trend))
    graph.push({
      "@type": "Article",
      headline: trend.title,
      description: trend.shortDescription,
      datePublished: trend.publishedAt,
      dateModified: trend.updatedAt,
      mainEntityOfPage: `${SITE_URL}/trend/${slug}`,
      publisher: {
        "@type": "Organization",
        name: "TrendsDuniya",
        url: SITE_URL,
      },
    });
  if (isIndexable(trend) && trend.faqs?.length)
    graph.push({
      "@type": "FAQPage",
      mainEntity: trend.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  return (
    <div className="page-space">
      <StructuredData
        data={{ "@context": "https://schema.org", "@graph": graph }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <article className="detail-article">
        <header className="article-header">
          <div className="flex flex-wrap gap-3">
            <TrendSourceBadge source={trend.source} />
            <TrendBadge status={trend.status} />
            <span className="badge">Snapshot status</span>
          </div>
          <h1>{trend.title}: Trend Explained</h1>
          <p className="article-deck">{trend.shortDescription}</p>
          <dl className="article-meta">
            <div>
              <dt>Category</dt>
              <dd>
                <Link href={`/category/${trend.category.toLowerCase()}`}>
                  {trend.category}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{trend.region}</dd>
            </div>
            <div>
              <dt>Published on this site</dt>
              <dd>
                <time dateTime={trend.publishedAt}>
                  {formatDate(trend.publishedAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Editorial update</dt>
              <dd>
                <time dateTime={trend.updatedAt}>
                  {formatDate(trend.updatedAt)}
                </time>
              </dd>
            </div>
            {trend.searchVolume && (
              <div>
                <dt>Supplied search interest</dt>
                <dd>{trend.searchVolume}</dd>
              </div>
            )}
            {trend.growth && (
              <div>
                <dt>Supplied growth</dt>
                <dd className="growth">↑ {trend.growth}</dd>
              </div>
            )}
          </dl>
        </header>
        <aside className="notice">
          Owner-supplied example snapshot. The source capture date and
          measurement window were not provided.{" "}
          {!isIndexable(trend) &&
            "This page is excluded from search indexing pending editorial verification."}
        </aside>
        <div className="article-body">
          <section>
            <h2>Overview</h2>
            <p>{trend.overview}</p>
          </section>
          <section>
            <h2>Why is {trend.title} trending?</h2>
            <p>{trend.whyTrending}</p>
          </section>
          <section>
            <h2>Key things to know</h2>
            <ul>
              {trend.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Related searches to explore</h2>
            <p>
              These are contextual suggestions or supplied related terms, not
              measured search rankings.
            </p>
            <div className="keyword-links">
              {trend.relatedKeywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/trends?q=${encodeURIComponent(keyword)}`}
                >
                  {keyword} ↗
                </Link>
              ))}
            </div>
            {trend.relatedCount !== undefined && (
              <p className="fine-print">
                The supplied snapshot reports {trend.relatedCount} related
                queries; it does not provide their complete list.
              </p>
            )}
          </section>
          {trend.faqs && trend.faqs.length > 0 && (
            <section>
              <h2>Frequently asked questions</h2>
              {trend.faqs.map((f) => (
                <div key={f.question}>
                  <h3>{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </section>
          )}
          {trend.sourceUrl && (
            <section>
              <h2>Source reference</h2>
              <a href={trend.sourceUrl} rel="noopener noreferrer">
                Read the original source reference ↗
              </a>
            </section>
          )}
        </div>
      </article>
      <RelatedTrends trend={trend} />
    </div>
  );
}
