import Link from "next/link";
import Icon from "../../../components/icons";
export default function ArticleNotFound(){return <main className="site-container article-not-found"><span className="empty-symbol"><Icon name="news" size={32}/></span><p className="eyebrow">404 · STORY UNAVAILABLE</p><h1>Article Not Found</h1><p>The article you’re looking for may have been removed or is no longer available.</p><Link href="/" className="public-btn dark">Back to Home <Icon name="arrow" size={16}/></Link></main>;}
