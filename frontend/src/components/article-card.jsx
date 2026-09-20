import Link from "next/link";
import Image from "next/image";
import Icon from "./icons";
import {articleImage,formatDate} from "../lib/api";
export default function ArticleCard({article,featured=false,index}){
 const img=articleImage(article);
 return <article className={`story-card ${featured?"featured-story":""}`}><Link href={`/article/${article.slug}`} className="story-image" tabIndex={-1} aria-hidden="true">{img?.url?<Image src={img.url} alt={img.alt||""} fill sizes={featured?"(max-width: 760px) 100vw, 65vw":"(max-width: 760px) 100vw, 33vw"} className="cover-image" priority={featured}/>:<div className="image-fallback"><Icon name="news" size={42}/><span>TRENDSDUNIYA</span></div>}{featured&&<span className="editors-pick">THE LATEST PERSPECTIVE</span>}</Link><div className="story-copy"><div className="story-kicker">{article.category&&<Link href={`/categories/${article.category.slug}`}>{article.category.name}</Link>}<span>{formatDate(article.publishedAt)}</span></div><h2><Link href={`/article/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><div className="story-byline"><span>{article.author?.name||""}</span><span><Icon name="clock" size={12}/>{article.readingTime||1} min read</span></div>{featured&&<Link className="read-story" href={`/article/${article.slug}`}>Read the full story <Icon name="arrow" size={16}/></Link>}</div>{index!==undefined&&<span className="story-number">{String(index+1).padStart(2,"0")}</span>}</article>;
}

