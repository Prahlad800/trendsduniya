import Link from "next/link";
import Icon from "../components/icons";
export default function NotFound(){return <main className="site-container not-found-page"><p className="eyebrow">404 · OFF THE BEATEN PATH</p><h1>This story took<br/><em>a different turn.</em></h1><p>The page may have moved, or the story is no longer published.</p><Link href="/latest" className="public-btn dark">Explore the latest stories <Icon name="arrow" size={16}/></Link></main>;}

