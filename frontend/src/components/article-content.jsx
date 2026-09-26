import Link from "next/link";
import NewsImage from "./news-image";
import Icon from "./icons";
import {articleImageSections,safeLink} from "../lib/article";
import {Fragment} from "react";
function ArticlePhoto({image,title,inline=false}) {
 return <div className={`article-gallery ${inline?"article-inline-gallery":""}`}><figure><div><NewsImage src={image.url} alt={image.alt||title} sizes="(max-width: 1000px) 100vw, 800px"/></div>{image.caption&&<figcaption>{image.caption}</figcaption>}</figure></div>;
}
export default function ArticleContent({article}) {
 const {sections,remainingImages}=articleImageSections(article);
 const sources=(article.externalLinks||[]).filter(l=>safeLink(l.url));
 const internal=(article.internalLinks||[]).filter(l=>safeLink(l.url,true));
 const sourceUrl=safeLink(article.source?.url);
 return <div className="article-body">
  {sections.map((section,i)=><Fragment key={i}><div className="prose" dangerouslySetInnerHTML={{__html:section.html}}/>{section.image&&<ArticlePhoto image={section.image} title={article.title} inline/>}</Fragment>)}
  {remainingImages.map((image,i)=><ArticlePhoto key={image.publicId||i} image={image} title={article.title}/>)}
  {article.tags?.length>0&&<div className="article-tag-list" aria-label="Article topics"><Icon name="tag" size={17}/>{article.tags.filter(t=>t.slug).map(t=><Link key={t.slug} href={`/tags/${t.slug}`}>{t.name}</Link>)}</div>}
  {article.faq?.length>0&&<section className="article-faq"><h2>Frequently asked questions</h2>{article.faq.map((f,i)=><details key={i}><summary>{f.question}<span>+</span></summary><p>{f.answer}</p></details>)}</section>}
  {(article.source?.attributionText||article.source?.name||sourceUrl||sources.length>0)&&<section className="article-sources"><h2>Sources &amp; further reading</h2>{(article.source?.attributionText||article.source?.name||sourceUrl)&&<p>{article.source?.attributionText} {sourceUrl?<a href={sourceUrl} target="_blank" rel="noopener noreferrer">{article.source?.name||"View source"} ↗</a>:article.source?.name}</p>}{sources.map((l,i)=><a key={i} href={safeLink(l.url)} target="_blank" rel="noopener noreferrer">{l.title||l.anchorText||l.url} ↗</a>)}</section>}
  {internal.length>0&&<section className="article-sources"><h2>Keep exploring</h2>{internal.map((l,i)=><Link href={l.url} key={i}>{l.anchorText||l.title} →</Link>)}</section>}
  {article.author?.name&&<section className="author-bio"><span className="author-initials">{article.author.name.slice(0,2).toUpperCase()}</span><div><p className="eyebrow">ABOUT THE AUTHOR</p><h2>{article.author.slug?<Link href={`/authors/${article.author.slug}`}>{article.author.name}</Link>:article.author.name}</h2>{article.author.bio&&<p>{article.author.bio}</p>}{article.author.slug&&<Link href={`/authors/${article.author.slug}`} className="text-link">More from this author <Icon name="arrow" size={14}/></Link>}</div></section>}
 </div>;
}
