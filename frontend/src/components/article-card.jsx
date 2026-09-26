import Link from "next/link";
import Icon from "./icons";
import NewsImage from "./news-image";
import {articleImage,formatDate} from "../lib/api";
export default function ArticleCard({article,featured=false,compact=false,priority=featured}) {
 const img=articleImage(article);
 return <article className={`story-card ${featured?"featured-story":""} ${compact?"compact-story":""}`}>
  <Link href={`/article/${article.slug}`} className="story-image" tabIndex={-1} aria-hidden="true"><NewsImage src={img?.url} alt={img?.alt||article.title} priority={priority} sizes={featured?"(max-width: 800px) 100vw, 65vw":undefined}/></Link>
  <div className="story-copy"><div className="story-kicker">{article.category&&<Link className="category-badge" data-category={article.category.slug} href={`/categories/${article.category.slug}`}>{article.category.name}</Link>}{featured&&<span className="lead-label">TOP STORY</span>}</div><h2><Link href={`/article/${article.slug}`}>{article.title}</Link></h2>{!compact&&<p>{article.excerpt}</p>}<div className="story-byline"><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span><Icon name="clock" size={13}/>{article.readingTime||1} min read</span></div></div>
 </article>;
}
