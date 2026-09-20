import Link from "next/link";
import {getPublic} from "../../lib/api";
import EmptyState from "../../components/empty-state";
import Icon from "../../components/icons";
export const metadata={title:"Explore topics"};
export default async function Categories(){
 let items,error;try{items=(await getPublic("/categories")).data;}catch(e){error=e;}
 return <main className="site-container listing-page"><div className="listing-heading"><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>Every topic.<br/><em>A new perspective.</em></h1><p>Find the ideas that matter to you.</p></div>{error?<EmptyState error description={error.message}/>:items?.length?<div className="directory-grid">{items.map(c=><Link className="directory-card" href={`/categories/${c.slug}`} key={c._id}><Icon name="globe" size={29}/><h2>{c.name}</h2><p>{c.description||"Explore the latest stories and ideas in "+c.name+"."}</p><span>Explore stories <Icon name="arrow" size={15}/></span></Link>)}</div>:<EmptyState title="New topics are taking shape." description="Our editors are organizing the first stories. Check back soon."/>}</main>;
}

