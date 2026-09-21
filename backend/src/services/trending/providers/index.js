import { XMLParser } from "fast-xml-parser";
import { plainText } from "../../../utils/sanitize.js";
const parser=new XMLParser({ignoreAttributes:true,processEntities:false});
export const countries={IN:{label:"India",locale:"en-IN",zone:"Asia/Kolkata",bbc:"world/asia/india"},US:{label:"USA",locale:"en-US",zone:"America/New_York",bbc:"world/us_and_canada"},GB:{label:"UK",locale:"en-GB",zone:"Europe/London",bbc:"uk"}};
export function safeSourceUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
async function rss(url,provider){
  const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{"User-Agent":"TrendsDuniya/1.0 (editorial RSS reader)",Accept:"application/rss+xml, application/xml, text/xml"},redirect:"error"});
  if(!response.ok)throw new Error("Feed unavailable");
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000)throw new Error("Feed too large");chunks.push(Buffer.from(value));}}finally{await reader.cancel();}
  const xml=Buffer.concat(chunks).toString("utf8");
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error("Unsupported feed");
  const items=parser.parse(xml)?.rss?.channel?.item;
  return (Array.isArray(items)?items:items?[items]:[]).slice(0,70).flatMap((item,index)=>{
    const title=plainText(String(item.title||"")).slice(0,300),url=safeSourceUrl(item.link);
    if(!title||!url)return [];
    const published=new Date(item.pubDate);
    if(!Number.isFinite(+published)||Date.now()-published>3*86400000||published>Date.now()+3600000)return [];
    return [{title:provider==="googleNews"?title.replace(/ - [^-]+$/,""):title,url,provider,position:index+1,publishedAt:published,signal:provider==="googleTrends"?Math.log10(1+Number(String(item["ht:approx_traffic"]||"0").replace(/[^\d]/g,""))):0}];
  });
}
export const trendProviders=[
  {name:"googleTrends",fetch:country=>rss(`https://trends.google.com/trending/rss?geo=${country}`,"googleTrends")},
  {name:"googleNews",fetch:country=>rss(`https://news.google.com/rss?hl=${countries[country].locale}&gl=${country}&ceid=${country}:en`,"googleNews")},
  {name:"bbcNews",fetch:country=>rss(`https://feeds.bbci.co.uk/news/${countries[country].bbc}/rss.xml`,"bbcNews")},
];
