"use client";
import Image from "next/image";
import {useState} from "react";
import Icon from "./icons";
export default function NewsImage({src,alt,priority=false,sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"}) {
 const [failed,setFailed]=useState(null);
 if(!src||failed===src)return <div className="image-fallback" role="img" aria-label={alt||"TrendsDuniya news image unavailable"}><Icon name="globe" size={48}/><span>Trends<strong>Duniya</strong></span><small>NEWS. PERSPECTIVES. POSSIBILITIES.</small></div>;
 return <Image src={src} alt={alt||"News photograph"} fill sizes={sizes} className="cover-image" preload={priority} onError={()=>setFailed(src)}/>;
}
