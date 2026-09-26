import Link from "next/link";
import Icon from "./icons";
export function SectionHeading({title,href,label="View all"}) {
 return <div className="section-heading"><h2>{title}</h2>{href&&<Link href={href} className="text-link">{label}<Icon name="arrow" size={16}/></Link>}</div>;
}
export function TrendingBar({articles}) {
 const topics=[...new Map(articles.flatMap(a=>(a.tags||[]).map(t=>[t.slug,t])).filter(([slug])=>slug)).values()].slice(0,10);
 if(!topics.length)return null;
 return <div className="trending-bar"><div className="site-container trending-inner"><Link href="/trending" className="trending-label"><Icon name="trend" size={18}/> Trending</Link><div className="trending-pills">{topics.map(t=><Link key={t.slug} href={`/tags/${t.slug}`}>{t.name}</Link>)}</div></div></div>;
}
export function RankedNews({articles}) {
 if(!articles.length)return null;
 return <aside className="ranked-news"><SectionHeading title="Most read" href="/trending"/><p className="ranked-caption">The stories catching your attention</p>{articles.slice(0,5).map((a,i)=><Link key={a.id||a._id} className="ranked-story" href={`/article/${a.slug}`}><span>{String(i+1).padStart(2,"0")}</span><div><small>{a.category?.name}</small><h3>{a.title}</h3><p>{a.readingTime||1} min read</p></div></Link>)}</aside>;
}
