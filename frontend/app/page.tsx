import Link from "next/link";
import Hero from "@/components/Hero";
import TrendingStats from "@/components/TrendingStats";
import TrendList from "@/components/TrendList";
import CategoryFilter from "@/components/CategoryFilter";
import StructuredData from "@/components/StructuredData";
import { SITE_URL } from "@/lib/seo";
import { getTrends, latestUpdate } from "@/lib/trends";
import { formatDate } from "@/lib/utils";
export default function Home() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "TrendsDuniya",
              url: SITE_URL,
            },
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "TrendsDuniya",
              url: SITE_URL,
            },
          ],
        }}
      />
      <Hero />
      <TrendingStats />
      <div className="snapshot-banner">
        <span className="badge source-google">EDITOR’S NOTE</span>
        <p>
          Latest manually updated trend snapshot · {formatDate(latestUpdate())}.
          Initial topics and metrics are owner-supplied examples; source capture
          time was not provided. Status reflects the snapshot.
        </p>
      </div>
      <section className="section" id="top-trends">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ON THE RADAR</p>
            <h2>
              Top trends in this snapshot <span aria-hidden="true">↗</span>
            </h2>
            <p>A starting point for what’s catching attention.</p>
          </div>
          <Link className="text-link" href="/trends">
            Explore All Trends →
          </Link>
        </div>
        <TrendList trends={getTrends().slice(0, 6)} />
        <p className="fine-print">
          Order follows editorial selection, not a verified cross-platform
          popularity ranking. Search figures are supplied values; their
          measurement window is unknown.
        </p>
      </section>
      <section className="section" id="categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FOLLOW YOUR CURIOSITY</p>
            <h2>A topic for every interest</h2>
          </div>
          <span className="muted">Browse by category</span>
        </div>
        <CategoryFilter />
      </section>
      {(
        [
          [
            "google",
            "Trending on Google",
            "Explore search-interest snapshots with useful context.",
            "/google-trends",
            "View All Google Trends",
          ],
          [
            "x",
            "Trending on X",
            "Discover the topics appearing in the supplied conversation snapshot.",
            "/x-trends",
            "View All X Trends",
          ],
        ] as const
      ).map(([source, title, desc, url, cta]) => (
        <section key={source} className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {source === "google" ? "SEARCH SPOTLIGHT" : "THE CONVERSATION"}
              </p>
              <h2>{title}</h2>
              <p>{desc}</p>
            </div>
            <Link href={url} className="text-link">
              {cta} →
            </Link>
          </div>
          <TrendList trends={getTrends({ source }).slice(0, 3)} />
        </section>
      ))}
      <section className="editorial-block section">
        <div>
          <p className="eyebrow">CONTEXT OVER NOISE</p>
          <h2>Find the biggest topics in the latest snapshot</h2>
          <p>
            TrendsDuniya brings search and conversation topics into one place.
            Browse the supplied figures where available, read what is known, and
            use related searches to investigate further. A topic’s presence here
            does not confirm a news event.
          </p>
        </div>
        <div>
          <h2>How TrendsDuniya Works</h2>
          <ol className="steps">
            <li>
              <strong>Discover Trends</strong>
              <p>We collect topics manually from public trend sources.</p>
            </li>
            <li>
              <strong>Understand the Trend</strong>
              <p>
                Read topic-specific context and see what still needs
                verification.
              </p>
            </li>
            <li>
              <strong>Explore More</strong>
              <p>Follow related topics, categories and trend sources.</p>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
