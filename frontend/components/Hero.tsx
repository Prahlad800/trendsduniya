import Link from "next/link";
import { latestUpdate } from "@/lib/trends";
import { formatDate } from "@/lib/utils";
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow hero-label">
          <span aria-hidden="true">●</span> THE CONVERSATION STARTS HERE
        </p>
        <h1>
          Discover What’s
          <br />
          Trending <span>Right Now</span>
          <span className="hero-arrow" aria-hidden="true">
            ↗
          </span>
        </h1>
        <p className="hero-description">
          Track the latest topics people are searching and talking about across
          Google Trends, X and the web.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/trends">
            Explore Trends <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" href="#top-trends">
            Latest Top Trends <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <p className="snapshot-note">
          Manually curated · Latest editorial update{" "}
          <time dateTime={latestUpdate()}>{formatDate(latestUpdate())}</time>
        </p>
      </div>
      <aside className="hero-panel" aria-label="Snapshot information">
        <span className="eyebrow">A WORLD OF CURIOSITY</span>
        <div className="orbit-art" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <span className="orbit-label label-google">Google searches ↗</span>
          <span className="orbit-center">↗</span>
          <span className="orbit-label label-x">Conversations on X</span>
        </div>
        <strong>Big topics. A little more context.</strong>
        <p>
          Explore the searches, understand the topic,
          <br />
          and find your next rabbit hole.
        </p>
      </aside>
    </section>
  );
}
