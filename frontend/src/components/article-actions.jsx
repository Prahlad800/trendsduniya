"use client";
import {useEffect,useState} from "react";
import Icon from "./icons";
const storageKey="trendsduniya.reading-list";
export function readSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||"[]").filter(a=>typeof a.slug==="string"&&typeof a.title==="string");}catch{return [];}}
export function ArticleActions({article}){
 const [saved,setSaved]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{Promise.resolve().then(()=>setSaved(readSaved().some(a=>a.slug===article.slug)));},[article.slug]);
 const toggle=()=>{try{const list=readSaved();const next=saved?list.filter(a=>a.slug!==article.slug):[{slug:article.slug,title:article.title,excerpt:article.excerpt,category:article.category?.name,savedAt:new Date().toISOString()},...list].slice(0,100);localStorage.setItem(storageKey,JSON.stringify(next));setSaved(!saved);setMessage(saved?"Removed from your reading list.":"Saved to your reading list.");}catch{setMessage("Your browser could not save this story.");}};
 const share=async()=>{try{if(navigator.share)await navigator.share({title:article.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setMessage("Link copied. Share a little perspective.");}}catch(e){if(e.name!=="AbortError")setMessage("Unable to copy the link. You can copy the address from your browser.");}};
 return <div className="article-actions"><button onClick={toggle} aria-pressed={saved} className={saved?"saved":""}><Icon name={saved?"check":"bookmark"} size={16}/>{saved?"Saved":"Save story"}</button><button onClick={share}><Icon name="share" size={16}/>Share</button>{message&&<span role="status">{message}</span>}</div>;
}
export function ViewTracker({id}){
 useEffect(()=>{
  const key="td.view."+id;const timer=setTimeout(()=>{
   try{if(document.visibilityState!=="visible"||sessionStorage.getItem(key))return;fetch("/api/articles/"+id+"/view",{method:"POST",keepalive:true}).then(r=>{if(r.ok)sessionStorage.setItem(key,"1");}).catch(()=>{});}catch{}
  },8000);return()=>clearTimeout(timer);
 },[id]);return null;
}

