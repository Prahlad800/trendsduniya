"use client";
import {Children,useState} from "react";
import Icon from "./icons";
export default function HeroCarousel({children}) {
 const slides=Children.toArray(children),[active,setActive]=useState(0);
 return <div className="hero-carousel" role="region" aria-roledescription="carousel" aria-label="Featured news">
  {slides.map((slide,i)=><div className="hero-slide" key={i} hidden={i!==active} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${slides.length}`}>{slide}</div>)}
  {slides.length>1&&<div className="hero-controls"><div className="hero-dots">{slides.map((_,i)=><button key={i} aria-label={`Show featured story ${i+1}`} aria-pressed={active===i} onClick={()=>setActive(i)}><span/></button>)}</div><span className="hero-count" aria-live="polite">{active+1} / {slides.length}</span><button aria-label="Previous featured story" onClick={()=>setActive((active+slides.length-1)%slides.length)}><Icon name="chevron" className="previous-arrow" size={17}/></button><button aria-label="Next featured story" onClick={()=>setActive((active+1)%slides.length)}><Icon name="chevron" size={17}/></button></div>}
 </div>;
}
