import Link from "next/link";
import SearchBox from "./SearchBox";
const links = [
  ["Home", "/"],
  ["Google Trends", "/google-trends"],
  ["X Trends", "/x-trends"],
  ["Categories", "/#categories"],
  ["About", "/about"],
];
export default function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="TrendsDuniya home">
          <span className="brand-icon" aria-hidden="true">
            ↗
          </span>
          <span>
            Trends<span className="text-indigo-700">Duniya</span>
            <small>What’s Trending Right Now</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-search">
          <SearchBox compact />
        </div>
        <Link className="button primary header-cta" href="/trends">
          Explore All Trends <span aria-hidden="true">↗</span>
        </Link>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/trends">Explore All Trends</Link>
            <SearchBox />
          </nav>
        </details>
      </div>
    </header>
  );
}
