"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import Icon from "./icons";
export default function SiteHeader({categories=[]}) {
 const pathname=usePathname();
 const [panel,setPanel]=useState(null),[date,setDate]=useState("India edition"),[dark,setDark]=useState(false);
 const searchRef=useRef(null),menuRef=useRef(null),triggerRef=useRef(null);
 useEffect(()=>{
  const update=()=>setDate(new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date())+" IST");
  update();const timer=setInterval(update,60000);return ()=>clearInterval(timer);
 },[]);
 useEffect(()=>{
  if(panel==="search")searchRef.current?.focus();
  if(panel==="menu")menuRef.current?.focus();
  const escape=e=>{if(e.key==="Escape"){setPanel(null);triggerRef.current?.focus();}};
  document.addEventListener("keydown",escape);return ()=>document.removeEventListener("keydown",escape);
 },[panel]);
 const toggle=(name,event)=>{triggerRef.current=event.currentTarget;setPanel(panel===name?null:name);};
 const nav=[{href:"/",name:"Home"},{href:"/latest",name:"Latest News"},...categories.map(c=>({href:`/categories/${c.slug}`,name:c.name})),{href:"/categories",name:"All Categories"}];
 return <>
  <div className="utility-bar"><div className="site-container"><span>{date}</span><div><span>News that keeps you ahead.</span><button onClick={()=>{setDark(!dark);document.documentElement.dataset.theme=dark?"light":"dark";}} aria-label={dark?"Switch to light theme":"Switch to dark theme"} aria-pressed={dark}><Icon name="sun" size={15}/></button><Link href="/about">About us</Link></div></div></div>
  <header className="site-header">
   <div className="site-container masthead">
    <button className="mobile-nav-button icon-button" onClick={e=>toggle("menu",e)} aria-expanded={panel==="menu"} aria-controls="mobile-menu" aria-label="Open menu"><Icon name={panel==="menu"?"close":"menu"}/></button>
    <Link href="/" className="site-brand" aria-label="TrendsDuniya home"><span>Trends<span>Duniya</span><small>YOUR WORLD. YOUR NEWS.</small></span></Link>
    <form action="/search" className="header-search"><Icon name="search" size={19}/><input name="q" aria-label="Search news" placeholder="Search news, topics, or keywords..." maxLength={200} required/><button aria-label="Submit search" type="submit"><Icon name="arrow" size={18}/></button></form>
    <div className="header-actions"><button className="mobile-search-button icon-button" aria-label="Open search" aria-expanded={panel==="search"} aria-controls="mobile-search" onClick={e=>toggle("search",e)}><Icon name="search"/></button><Link className="icon-button news-alert" href="/latest" aria-label="Latest news updates"><Icon name="bell"/><span/></Link><Link className="header-saved" href="/saved"><Icon name="bookmark" size={18}/> Saved stories</Link></div>
   </div>
   {panel==="search"&&<form id="mobile-search" action="/search" className="site-container mobile-search"><input ref={searchRef} name="q" aria-label="Search news" placeholder="Search news, topics, or keywords..." maxLength={200} required/><button className="public-btn dark" type="submit">Search</button></form>}
   <div className="nav-border"><nav className="site-container main-nav" aria-label="Main navigation">{nav.map(n=><Link key={n.href} href={n.href} onClick={()=>setPanel(null)} aria-current={pathname===n.href?"page":undefined} className={pathname===n.href?"active":""}>{n.name}</Link>)}</nav></div>
   {panel==="menu"&&<nav id="mobile-menu" className="mobile-menu site-container" aria-label="Mobile menu">{[...nav,{href:"/trending",name:"Trending"},{href:"/saved",name:"Saved stories"},{href:"/about",name:"About TrendsDuniya"}].map((n,i)=><Link ref={i===0?menuRef:undefined} key={n.href} href={n.href} onClick={()=>setPanel(null)}>{n.name}<Icon name="chevron" size={16}/></Link>)}</nav>}
  </header>
  <nav className="mobile-bottom-nav" aria-label="Mobile shortcuts">{[{href:"/",name:"Home",icon:"home"},{href:"/categories",name:"Categories",icon:"grid"},{href:"/trending",name:"Trending",icon:"trend"},{href:"/saved",name:"Saved",icon:"bookmark"}].map(n=><Link key={n.href} href={n.href} onClick={()=>setPanel(null)} aria-current={pathname===n.href?"page":undefined} className={pathname===n.href?"active":""}><Icon name={n.icon}/><span>{n.name}</span></Link>)}<button onClick={e=>{toggle("menu",e);window.scrollTo({top:0,behavior:"instant"});}} aria-label="Open menu" aria-expanded={panel==="menu"}><Icon name="menu"/><span>Menu</span></button></nav>
 </>;
}
