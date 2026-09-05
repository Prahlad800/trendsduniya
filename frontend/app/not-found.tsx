import Link from "next/link";
export default function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">404 · OFF THE RADAR</p>
      <h1>Trend Not Found</h1>
      <p>
        This topic is not in our collection. There’s more to discover in the
        latest snapshot.
      </p>
      <Link className="button primary" href="/trends">
        Explore Latest Trends →
      </Link>
    </section>
  );
}
