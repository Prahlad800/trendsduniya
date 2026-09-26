import sanitizeHtml from "sanitize-html";
import {parseDocument,DomUtils} from "htmlparser2";

// Insert gallery photos only between complete content blocks. Existing inline
// images and the hero remain in their editorial positions and are not repeated.
export function articleImageSections(article) {
 const html=safeArticleHtml(article.content);
 const nodes=parseDocument(html).children;
 const inlineImages=DomUtils.findAll(node=>node.name==="img",nodes);
 const used=new Set(inlineImages.map(node=>node.attribs.src));
 used.add(article.featuredImage?.url||article.media?.featuredImage?.url);
 const images=(article.media?.images||[]).filter(image=>{
  if(!image.url||used.has(image.url))return false;
  used.add(image.url);return true;
 });
 const readingBlock=node=>["p","ul","ol","blockquote","table","pre"].includes(node.name)&&DomUtils.textContent(node).trim().length>0;
 const candidates=nodes.flatMap((node,index)=>
  node.name==="p"&&DomUtils.textContent(node).trim().length>=40&&
  nodes.slice(0,index).some(readingBlock)&&nodes.slice(index+1).some(readingBlock)?[index]:[]
 );
 const count=Math.min(images.length,candidates.length);
 const placements=new Map(Array.from({length:count},(_,i)=>[
  candidates[Math.floor((i+1)*candidates.length/(count+1))],images[i]
 ]));
 const sections=[];let content="";
 nodes.forEach((node,index)=>{
  content+=DomUtils.getOuterHTML(node);
  if(placements.has(index)){sections.push({html:content,image:placements.get(index)});content="";}
 });
 if(content)sections.push({html:content});
 return {sections,remainingImages:images.slice(count)};
}

// Defense in depth: the API also sanitizes stored HTML. Keep semantic editorial
// formatting, but never allow scripts, frames, event handlers or layout overlays.
export function safeArticleHtml(value="") {
 return sanitizeHtml(typeof value==="string"?value:"",{
  allowedTags:["p","br","h2","h3","h4","strong","em","b","i","u","blockquote","ul","ol","li","a","img","figure","figcaption","pre","code","table","thead","tbody","tfoot","tr","th","td","hr","sup","sub"],
  allowedAttributes:{a:["href","title","rel","target"],img:["src","alt","width","height","loading","decoding"],th:["colspan","rowspan","scope"],td:["colspan","rowspan"]},
  allowedSchemes:["https","http","mailto"],allowedSchemesByTag:{img:["https"]},allowProtocolRelative:false,
  transformTags:{
   a:(tag,attrs)=>({tagName:"a",attribs:{...attrs,rel:"noopener noreferrer"}}),
   img:(tag,attrs)=>({tagName:"img",attribs:{...attrs,alt:attrs.alt||"Article illustration",loading:"lazy",decoding:"async"}})
  }
 });
}
export function articleSummary(article) {
 const candidate=article.summary||article.excerpt;
 if(typeof candidate==="string"&&candidate.trim())return sanitizeHtml(candidate,{allowedTags:[],allowedAttributes:{}}).trim();
 return sanitizeHtml(typeof article.content==="string"?article.content:"",{allowedTags:[],allowedAttributes:{}}).replace(/\s+/g," ").trim().slice(0,230);
}
export function articleReadingTime(article) {
 const minutes=Number(article.readingTime);
 if(Number.isFinite(minutes)&&minutes>0)return Math.ceil(minutes);
 const text=sanitizeHtml(article.content||"",{allowedTags:[],allowedAttributes:{}});
 return Math.max(1,Math.ceil(text.trim().split(/\s+/).length/220));
}
export const uniqueStories=(stories,currentSlug)=>[...new Map((stories||[]).filter(a=>a?.slug&&a.slug!==currentSlug).map(a=>[a.slug,a])).values()];
export function safeLink(value,internal=false) {
 if(typeof value!=="string")return null;
 if(value.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\"))return value;
 if(internal)return null;
 try {const url=new URL(value);return ["https:","http:"].includes(url.protocol)?url.href:null;}catch{return null;}
}
