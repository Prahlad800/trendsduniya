import Link from "next/link";
import Icon from "./icons";
export default function EmptyState({title="The next chapter is on its way.",description="Fresh perspectives will appear here when our editors publish them.",error=false}){
 return <div className={`public-empty ${error?"error-state":""}`}><span className="empty-symbol"><Icon name={error?"globe":"news"} size={32}/></span><p className="eyebrow">{error?"A BRIEF INTERRUPTION":"STAY CURIOUS"}</p><h2>{title}</h2><p>{description}</p><Link href={error?"/latest":"/categories"} className="public-btn">{error?"Try again":"Explore topics"}<Icon name="arrow" size={16}/></Link></div>;
}

