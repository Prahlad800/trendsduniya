import Link from "next/link";
import {getPublic} from "../../lib/api";
import EmptyState from "../../components/empty-state";
export const metadata={title:"Our contributors"};
export default async function Authors(){
 let items,error;try{items=(await getPublic("/authors")).data;}catch(e){error=e;}
 return <main className="site-container listing-page"><div className="listing-heading"><p className="eyebrow">THE PEOPLE BEHIND THE PERSPECTIVES</p><h1>Meet our contributors.</h1><p>Distinct voices. A shared curiosity about the world.</p></div>{error?<EmptyState error description={error.message}/>:items?.length?<div className="directory-grid">{items.map(a=><Link className="directory-card author-card" href={`/authors/${a.slug}`} key={a._id}><span className="author-initials">{a.name.slice(0,2).toUpperCase()}</span><h2>{a.name}</h2><small>{a.designation}</small><p>{a.bio||"Contributor at TrendsDuniya."}</p><span>Read their stories →</span></Link>)}</div>:<EmptyState title="Meet the voices soon." description="Author profiles will appear as our editorial team joins the publication."/>}</main>;
}

