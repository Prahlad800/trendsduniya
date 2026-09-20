"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {readSaved} from "../../components/article-actions";
import EmptyState from "../../components/empty-state";
import Icon from "../../components/icons";
export default function Saved(){
 const [items,setItems]=useState(null),[error,setError]=useState("");
 useEffect(()=>{Promise.resolve().then(()=>setItems(readSaved()));},[]);
 const remove=slug=>{try{const next=items.filter(i=>i.slug!==slug);localStorage.setItem("trendsduniya.reading-list",JSON.stringify(next));setItems(next);}catch{setError("Unable to update your saved stories in this browser.");}};
 return <main className="site-container listing-page"><div className="listing-heading"><p className="eyebrow">FOR A QUIETER MOMENT</p><h1>Your reading list.</h1><p>Good stories, kept close. Saved privately in this browser.</p></div>{error&&<p role="alert">{error}</p>}{items===null?<p className="muted">Opening your reading list…</p>:items.length?<div className="saved-list">{items.map(a=><article key={a.slug} className="saved-story"><div><p className="eyebrow">{a.category||"SAVED STORY"}</p><h2><Link href={`/article/${encodeURIComponent(a.slug)}`}>{a.title}</Link></h2><p>{a.excerpt}</p><Link className="text-link" href={`/article/${encodeURIComponent(a.slug)}`}>Continue reading <Icon name="arrow" size={15}/></Link></div><button aria-label={`Remove ${a.title}`} onClick={()=>remove(a.slug)}><Icon name="close" size={18}/></button></article>)}</div>:<EmptyState title="Make room for a good read." description="Tap Save story on an article to keep it here for later."/>}</main>;
}

