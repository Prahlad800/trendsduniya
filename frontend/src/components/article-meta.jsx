import Link from "next/link";
import Icon from "./icons";
import NewsImage from "./news-image";
import {formatDate} from "../lib/api";
import {articleReadingTime} from "../lib/article";
export default function ArticleMeta({article}) {
 const author=article.author;
 const views=typeof article.views==="number"&&Number.isFinite(article.views)?article.views:null;
 return <div className="article-info">
  {author?.name&&<div className="article-author">{author.avatar?<span className="author-avatar"><NewsImage src={author.avatar} alt={author.name} sizes="44px"/></span>:<span className="author-initials small" aria-hidden="true">{author.name.split(/\s+/).slice(0,2).map(p=>p[0]).join("")}</span>}<div>{author.slug?<Link href={`/authors/${author.slug}`}>{author.name}</Link>:<strong>{author.name}</strong>}{author.designation&&<small>{author.designation}</small>}</div></div>}
  <div className="article-dates">{article.publishedAt&&<span><Icon name="clock" size={15}/><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></span>}<span><Icon name="book" size={15}/>{articleReadingTime(article)} min read</span>{views!==null&&<span><Icon name="eye" size={15}/>{new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(views)} views</span>}</div>
  {article.updatedAt&&article.updatedAt!==article.publishedAt&&<p className="article-updated">Updated: <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time></p>}
 </div>;
}
