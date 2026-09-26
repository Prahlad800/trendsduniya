import Link from "next/link";
import {getPublic,SITE_URL} from "../lib/api";
import ArticleCard from "../components/article-card";
import HeroCarousel from "../components/hero-carousel";
import EmptyState from "../components/empty-state";
import Icon from "../components/icons";
import {SectionHeading,TrendingBar,RankedNews} from "../components/news-sections";
export const dynamic="force-dynamic";
export const metadata={alternates:{canonical:SITE_URL}};
export default async function Home() {
 const [newsResult,categoryResult,popularResult]=await Promise.allSettled([getPublic("/articles?limit=24"),getPublic("/categories"),getPublic("/articles?sort=-analytics.views&limit=5")]);
 const articles=newsResult.status==="fulfilled"?newsResult.value.data||[]:[];
 const categories=categoryResult.status==="fulfilled"?categoryResult.value.data||[]:[];
 const popular=popularResult.status==="fulfilled"?popularResult.value.data||[]:[];
 const groups=categories.map(c=>({category:c,articles:articles.filter(a=>a.category?.slug===c.slug)})).filter(g=>g.articles.length>=3).slice(0,3);
 return <main>
  <TrendingBar articles={articles}/>
  <div className="site-container news-home">
   <div className="edition-heading"><h1>Your daily dose of <span>what matters.</span></h1><span className="edition-live"><i/> Fresh from the newsroom</span></div>
   {articles.length?<section className="hero-grid" aria-label="Top stories"><HeroCarousel>{articles.slice(0,3).map((a,i)=><ArticleCard key={a.id} article={a} featured priority={i===0}/>)}</HeroCarousel>{articles.length>1&&<div className="featured-side">{articles.slice(1,4).map(a=><ArticleCard key={a.id} article={a} compact/>)}</div>}</section>:<EmptyState error={newsResult.status==="rejected"}/>}
   {articles.length>4&&<section className="news-section"><SectionHeading title="Latest News" href="/latest" label="All latest news"/><div className="stories-grid">{articles.slice(4,12).map(a=><ArticleCard key={a.id} article={a}/>)}</div></section>}
   {categories.length>0&&<section className="news-section category-section"><SectionHeading title="Explore Categories" href="/categories"/><div className="topic-strip">{categories.slice(0,8).map((c,i)=><Link key={c.slug} href={`/categories/${c.slug}`} className="topic-tile"><span className="topic-icon"><Icon name={["globe","news","trend","grid"][i%4]} size={21}/></span><strong>{c.name}</strong><Icon name="chevron" size={15}/></Link>)}</div></section>}
   {(groups.length>0||popular.length>0)&&<div className={`news-columns ${groups.length?"":"only-ranked"}`}><div>{groups.map(g=><section key={g.category.slug} className="news-section"><SectionHeading title={g.category.name} href={`/categories/${g.category.slug}`}/><div className="category-stories">{g.articles.slice(0,3).map(a=><ArticleCard key={a.id} article={a}/>)}</div></section>)}</div><RankedNews articles={popular}/></div>}
   <section className="reading-banner"><span className="reading-banner-icon"><Icon name="bookmark" size={28}/></span><div><p className="eyebrow">YOUR NEWS, AT YOUR PACE</p><h2>A good story is worth saving.</h2><p>Keep your favourite reads together. Pick up where you left off.</p></div><Link href="/saved" className="public-btn dark">My saved stories <Icon name="arrow" size={16}/></Link></section>
  </div>
 </main>;
}
