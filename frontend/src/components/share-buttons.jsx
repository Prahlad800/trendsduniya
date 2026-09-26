"use client";
import {useState} from "react";
import Icon from "./icons";
export default function ShareButtons({title,url}) {
 const [message,setMessage]=useState("");
 const destinations=[
  {name:"Facebook",icon:"facebook",url:u=>"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(u)},
  {name:"X",icon:"x",url:u=>"https://twitter.com/intent/tweet?url="+encodeURIComponent(u)+"&text="+encodeURIComponent(title)},
  {name:"WhatsApp",icon:"whatsapp",url:u=>"https://api.whatsapp.com/send?text="+encodeURIComponent(title+" "+u)},
  {name:"LinkedIn",icon:"linkedin",url:u=>"https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(u)}
 ];
 const copy=async()=>{try{await navigator.clipboard.writeText(window.location.href);setMessage("Link copied!");}catch{setMessage("Unable to copy. Please copy the article address from your browser.");}};
 return <div className="social-share"><span className="share-label">Share this story</span><div className="social-share-buttons">{destinations.map(d=><a key={d.name} href={d.url(url)} onClick={e=>{e.currentTarget.href=d.url(window.location.href);}} target="_blank" rel="noopener noreferrer" aria-label={"Share on "+d.name} title={"Share on "+d.name}><Icon name={d.icon} size={18}/></a>)}<button type="button" onClick={copy} aria-label="Copy article link" title="Copy article link"><Icon name="copy" size={18}/></button></div>{message&&<p role="status">{message}</p>}</div>;
}
