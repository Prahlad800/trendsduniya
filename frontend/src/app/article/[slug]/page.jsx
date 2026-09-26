import Link from "next/link";
import {notFound,permanentRedirect} from "next/navigation";
import {getArticle,getPublic,articleImage,SITE_URL} from "../../../lib/api";
import {articleSummary,uniqueStories} from "../../../lib/article";
import NewsImage from "../../../components/news-image";
import ArticleCard from "../../../components/article-card";
import ArticleMeta from "../../../components/article-meta";
import ArticleContent from "../../../components/article-content";
import ArticleSidebar from "../../../components/article-sidebar";
import ShareButtons from "../../../components/share-buttons";
import RetryButton from "../../../components/retry-button";
import {ArticleActions,ViewTracker} from "../../../components/article-actions";
import {SectionHeading} from "../../../components/news-sections";
import Icon from "../../../components/icons";

export async function generateMetadata({params}) {
 let article;
 try {article=await getArticle((await params).slug);}catch{return {title:"Article unavailable",robots:{index:false,follow:false}};}
 if(!article)return {title:"Article Not Found",robots:{index:false,follow:false}};
 const seo=article.seo||{},image=articleImage(article),robots=seo.robots||{};
 const title=seo.metaTitle||article.title,description=seo.metaDescription||articleSummary(article);
 const canonical=seo.canonicalUrl||`${SITE_URL}/article/${encodeURIComponent(article.slug)}`;
 const images=image?.url?[{url:image.url,alt:image.alt||article.title}]:[];
 return {
  title:{absolute:title},description,alternates:{canonical},
  robots:{index:robots.index!==false,follow:robots.follow!==false,googleBot:{"max-snippet":robots.maxSnippet??-1,"max-image-preview":robots.maxImagePreview||"large","max-video-preview":robots.maxVideoPreview??-1}},
  openGraph:{type:"article",title,description,url:canonical,siteName:"TrendsDuniya",publishedTime:article.publishedAt,modifiedTime:article.updatedAt,authors:article.author?.name?[article.author.name]:undefined,images},
  twitter:{card:"summary_large_image",title,description,images}
 };
}
const json=value=>JSON.stringify(value).replace(/</g,"\\u003c");
const fulfilled=result=>result.status==="fulfilled"?result.value.data||[]:[];

export default async function ArticlePage({params}) {
 const {slug}=await params;
 let article;
 try {article=await getArticle(slug);}catch{return <main className="site-container article-not-found"><p className="eyebrow">PLEASE TRY AGAIN</p><h1>Unable to load this article right now.</h1><p>Please try again in a moment.</p><RetryButton/></main>;}
 if(!article)notFound();
 if(article.slug!==slug)permanentRedirect("/article/"+encodeURIComponent(article.slug));
 const image=articleImage(article),summary=articleSummary(article);
 const canonical=article.seo?.canonicalUrl||`${SITE_URL}/article/${encodeURIComponent(article.slug)}`;
 const categoryPath=article.category?.slug?"/articles/category/"+encodeURIComponent(article.category.slug)+"?limit=12":"/articles?limit=12";
 const [relatedResult,trendingResult,categoryResult]=await Promise.allSettled([
  getPublic("/articles/"+encodeURIComponent(article.slug)+"/related"),
  getPublic("/articles?sort=-analytics.views&limit=6"),
  getPublic(categoryPath)
 ]);
 const categoryStories=uniqueStories(fulfilled(categoryResult),slug);
 const related=uniqueStories(fulfilled(relatedResult),slug);
 const relatedStories=(related.length?related:categoryStories).slice(0,6);
 const trending=uniqueStories(fulfilled(trendingResult),slug).slice(0,5);
 const more=categoryStories.filter(a=>!relatedStories.some(r=>r.slug===a.slug)).slice(0,3);
 const articleSchema={
  "@context":"https://schema.org","@type":article.articleType==="news"?"NewsArticle":"Article",
  headline:article.title,description:summary,image:image?.url,datePublished:article.publishedAt,dateModified:article.updatedAt||article.publishedAt,inLanguage:article.language,mainEntityOfPage:canonical,
  author:article.author?.name?{"@type":"Person",name:article.author.name,...(article.author.slug?{url:`${SITE_URL}/authors/${article.author.slug}`}:{})}:undefined,
  publisher:{"@type":"Organization",name:"TrendsDuniya",url:SITE_URL,logo:{"@type":"ImageObject",url:SITE_URL+"/icon.svg"}}
 };
 const crumbItems=[{name:"Home",url:"/"},...(article.category?.slug?[{name:article.category.name,url:"/categories/"+article.category.slug}]:[]),{name:article.title,url:"/article/"+article.slug}];
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:crumbItems.map((item,index)=>({"@type":"ListItem",position:index+1,name:item.name,item:new URL(item.url,SITE_URL).href}))};
 return <main className="site-container article-detail">
  <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><Icon name="chevron" size={12}/>{article.category?.slug&&<><Link href={`/categories/${article.category.slug}`}>{article.category.name}</Link><Icon name="chevron" size={12}/></>}<span aria-current="page">{article.title}</span></nav>
  <div className={`article-shell ${relatedStories.length||trending.length?"":"without-sidebar"}`}>
   <div className="article-main-column">
    <article lang={article.language||undefined}>
     <header className="article-detail-header">
      {article.category?.slug&&<Link className="article-category" href={`/categories/${article.category.slug}`}>{article.category.name}</Link>}
      <h1>{article.title}</h1>
      {summary&&<p className="article-summary">{summary}</p>}
      <div className="article-detail-meta"><ArticleMeta article={article}/><ArticleActions article={{slug:article.slug,title:article.title,excerpt:summary,category:article.category}}/></div>
      <ShareButtons title={article.title} url={canonical}/>
     </header>
     <figure className="article-detail-hero"><div><NewsImage src={image?.url} alt={image?.alt||article.title} priority sizes="(max-width: 1000px) 100vw, 900px"/></div>{image?.caption&&<figcaption>{image.caption}</figcaption>}</figure>
     <ArticleContent article={article}/>
    </article>
    {relatedStories.length>0&&<section className="article-related-bottom"><SectionHeading title="Related News"/><div className="article-related-grid">{relatedStories.map(a=><ArticleCard key={a.slug} article={a}/>)}</div></section>}
   </div>
   <ArticleSidebar related={relatedStories} trending={trending}/>
  </div>
  {article.category?.name&&more.length>0&&<section className="article-more-category"><SectionHeading title={`More from ${article.category.name}`} href={`/categories/${article.category.slug}`}/><div className="article-more-grid">{more.map(a=><ArticleCard key={a.slug} article={a}/>)}</div></section>}
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json(articleSchema)}}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json(breadcrumb)}}/>
  <ViewTracker id={article.id||article._id}/>
 </main>;
}
