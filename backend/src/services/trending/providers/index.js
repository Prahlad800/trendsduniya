import { XMLParser } from "fast-xml-parser";
import { plainText } from "../../../utils/sanitize.js";
const parser=new XMLParser({ignoreAttributes:true,processEntities:false});
export const countries={IN:{label:"India",locale:"en-IN",zone:"Asia/Kolkata",bbc:"world/asia/india"},US:{label:"USA",locale:"en-US",zone:"America/New_York",bbc:"world/us_and_canada"},GB:{label:"UK",locale:"en-GB",zone:"Europe/London",bbc:"uk"}};
Object.assign(countries,{
 WORLD:{label:"Worldwide",locale:"en-IN",zone:"Asia/Kolkata"},
 AU:{label:"Australia",locale:"en-AU",zone:"Australia/Sydney",bbc:"world/australia"},
 BR:{label:"Brazil",locale:"pt-BR",edition:"pt-419",zone:"America/Sao_Paulo",bbc:"world/latin_america"},
 DE:{label:"Germany",locale:"de",edition:"de",zone:"Europe/Berlin",bbc:"world/europe"},
 JP:{label:"Japan",locale:"ja",edition:"ja",zone:"Asia/Tokyo",bbc:"world/asia"},
 ZA:{label:"South Africa",locale:"en-ZA",zone:"Africa/Johannesburg",bbc:"world/africa"},
});
export const worldRegions=["IN","US","GB","AU","BR","DE","JP","ZA"];
export function providerRequests(country,providers){
 const regions=country==="WORLD"?worldRegions:[country];
 // Search queries are not news events. Global selection needs reporting
 // context rather than bare Google Trends terms or team-name searches.
 const news=providers.filter(p=>!p.worldOnly&&(country!=="WORLD"||p.name!=="googleTrends"));
 const global=country==="WORLD"?providers.filter(p=>p.worldOnly).map(p=>({name:`WORLD:${p.name}`,region:"WORLD",fetch:async()=>(await p.fetch()).map(item=>({...item,region:"WORLD"}))})):[];
 return [...global,...regions.flatMap(region=>news.map(p=>({name:country==="WORLD"?`${region}:${p.name}`:p.name,region,fetch:async()=>{
  const items=await p.fetch(region);return items.map(item=>({...item,region}));
 }})))];
}
export function safeSourceUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
async function rss(url,provider){
  const origin=new URL(url).origin,signal=AbortSignal.timeout(12000);
  let response;
  for(let redirects=0;redirects<3;redirects++){
    response=await fetch(url,{signal,headers:{"User-Agent":"TrendsDuniya/1.0 (editorial RSS reader)",Accept:"application/rss+xml, application/xml, text/xml"},redirect:"manual"});
    if(![301,302,307,308].includes(response.status))break;
    const location=response.headers.get("location");await response.body?.cancel();
    if(!location)throw new Error("Feed redirect missing location");
    const target=new URL(location,url);
    if(target.origin!==origin||target.username||target.password||!target.pathname.startsWith("/rss/"))throw new Error("Unsafe feed redirect");
    url=target.href;
  }
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
    return [{title:provider.startsWith("googleNews")?title.replace(/ - [^-]+$/,""):title,url,provider,evidence:plainText(String(item.description||"")).slice(0,3000),position:index+1,publishedAt:published,signal:provider==="googleTrends"?Math.log10(1+Number(String(item["ht:approx_traffic"]||"0").replace(/[^\d]/g,""))):0}];
  });
}
export const trendProviders=[
  {name:"googleTrends",fetch:country=>rss(`https://trends.google.com/trending/rss?geo=${country}`,"googleTrends")},
  {name:"googleNews",fetch:country=>rss(`https://news.google.com/rss?hl=${countries[country].locale}&gl=${country}&ceid=${country}:${countries[country].edition||"en"}`,"googleNews")},
  {name:"bbcNews",fetch:country=>rss(`https://feeds.bbci.co.uk/news/${countries[country].bbc}/rss.xml`,"bbcNews")},
  ...["TECHNOLOGY","BUSINESS","SCIENCE","SPORTS","ENTERTAINMENT","WORLD"].map(topic=>({name:`googleNews${topic}`,fetch:country=>rss(`https://news.google.com/rss/headlines/section/topic/${topic}?hl=${countries[country].locale}&gl=${country}&ceid=${country}:${countries[country].edition||"en"}`,`googleNews${topic}`)})),
  {name:"bbcWorld",worldOnly:true,fetch:()=>rss("https://feeds.bbci.co.uk/news/world/rss.xml","bbcWorld")},
];
