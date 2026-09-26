import Link from "next/link";
import Icon from "./icons";
import RetryButton from "./retry-button";
export default function EmptyState({title,description,error=false}) {
 return <div className={`public-empty ${error?"error-state":""}`} role="status"><span className="empty-symbol"><Icon name="news" size={32}/></span><p className="eyebrow">{error?"PLEASE TRY AGAIN":"FROM THE NEWSROOM"}</p><h2>{error?"Unable to load news right now.":title||"No news available right now."}</h2><p>{error?"Please try again in a moment.":description||"New stories will appear here as our editors publish them."}</p>{error?<RetryButton/>:<Link href="/latest" className="public-btn">Explore latest news <Icon name="arrow" size={16}/></Link>}</div>;
}
