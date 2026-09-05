import Link from "next/link";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div>
            <Link className="brand" href="/">
              Trends<span className="text-indigo-700">Duniya</span>
            </Link>
            <p>Discover what the world is searching and talking about.</p>
          </div>
          <nav aria-label="Footer navigation">
            {[
              ["Home", "/"],
              ["Google Trends", "/google-trends"],
              ["X Trends", "/x-trends"],
              ["About", "/about"],
              ["Contact", "/contact"],
              ["Privacy Policy", "/privacy-policy"],
              ["Terms", "/terms"],
            ].map(([name, url]) => (
              <Link href={url} key={url}>
                {name}
              </Link>
            ))}
          </nav>
        </div>
        <p className="disclaimer">
          Trend data shown on TrendsDuniya is provided for informational
          purposes and may change over time. TrendsDuniya is not affiliated with
          Google or X.
        </p>
      </div>
    </footer>
  );
}
