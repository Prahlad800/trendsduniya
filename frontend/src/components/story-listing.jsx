import Link from "next/link";
import ArticleCard from "./article-card";
import EmptyState from "./empty-state";
import {getPublic} from "../lib/api";
export default async function StoryListing({endpoint,title,eyebrow="A WORLD OF PERSPECTIVES",description,searchParams={},basePath="/latest",sortLabel="Latest first"}){
 const page=Math.max(1,Math.min(10000,Number(searchParams.page)||1));
 const params=new URLSearchParams({page:String(page),limit:"12",...(searchParams.q?{q:String(searchParams.q).slice(0,200)}:{})});
 let result,error;try{result=await getPublic(endpoint+(endpoint.includes("?")?"&":"?")+params);}catch(e){error=e;}
 const href=p=>basePath+"?"+new URLSearchParams({page:String(p),...(searchParams.q?{q:searchParams.q}:{})});
 return <main className="site-container listing-page"><div className="listing-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{basePath==="/search"&&<form action="/search" className="large-search"><input name="q" aria-label="Search stories" defaultValue={searchParams.q||""} placeholder="Search stories, ideas, and perspectives…" maxLength={200} required/><button className="public-btn dark">Search stories</button></form>}{error?<EmptyState error title="We’ll be right back." />:result?.data?.length?<><div className="listing-meta"><span>{result.pagination?.total||result.data.length} stories to explore</span><span>{sortLabel}</span></div>{basePath.startsWith("/categories/")&&page===1&&<div className="category-lead"><ArticleCard article={result.data[0]} featured/></div>}<div className="stories-grid">{(basePath.startsWith("/categories/")&&page===1?result.data.slice(1):result.data).map(a=><ArticleCard key={a.id||a._id} article={a}/>)}</div><nav className="public-pagination" aria-label="Article pagination">{page>1?<Link className="public-btn" href={href(page-1)}>← Previous</Link>:<span/>}<span>Page {page} of {Math.max(1,result.pagination?.totalPages||1)}</span>{result.pagination?.hasNextPage?<Link className="public-btn" href={href(page+1)}>Next →</Link>:<span/>}</nav></>:<EmptyState title={searchParams.q?"No stories found.":"No news available right now."} description={searchParams.q?"Try a different keyword or explore our latest stories.":undefined}/>}</main>;
}

