import Link from "next/link";
import ArticleCard from "./article-card";
import NewsImage from "./news-image";
import {SectionHeading} from "./news-sections";
import {articleImage,formatDate} from "../lib/api";
export default function ArticleSidebar({related=[],trending=[]}) {
 if(!related.length&&!trending.length)return null;
 return <aside className="article-news-sidebar" aria-label="More news">
  {related.length>0&&<section className="sidebar-related"><SectionHeading title="Related News"/><div className="sidebar-cards">{related.slice(0,3).map(a=><ArticleCard key={a.slug} article={a} compact/>)}</div></section>}
  {trending.length>0&&<section className="sidebar-trending"><SectionHeading title="Trending News" href="/trending"/><p className="sidebar-note">Most read on TrendsDuniya</p>{trending.slice(0,5).map((a,i)=><Link key={a.slug} className="sidebar-trend" href={`/article/${a.slug}`}><span className="trend-rank">{String(i+1).padStart(2,"0")}</span><span className="trend-thumbnail"><NewsImage src={articleImage(a)?.url} alt={articleImage(a)?.alt||a.title} sizes="72px"/></span><div><h3>{a.title}</h3><time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time></div></Link>)}</section>}
 </aside>;
}
