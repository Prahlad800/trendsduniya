export const normalizeTrend=value=>value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu," ").trim().replace(/\s+/g," ");
const stopWords=new Set(["the","a","an","in","on","for","of","and","to","launch","launches"]);
const tokens=value=>new Set(normalizeTrend(value).split(" ").filter(v=>!stopWords.has(v)));
function signature(value){const normalized=normalizeTrend(value),words=tokens(normalized);return {normalized,words,numbers:[...words].filter(t=>/\d/.test(t)).sort().join(" ")};}
function matching(a,b){
 if(a.normalized===b.normalized)return true;
 if(a.numbers!==b.numbers)return false;
 const [small,large]=a.words.size<=b.words.size?[a.words,b.words]:[b.words,a.words];
 return small.size>=2&&small.size/large.size>=0.65&&[...small].every(word=>large.has(word));
}
export function sameTopic(a,b){
  return matching(signature(a),signature(b));
}
export function rankTrends(items,now=new Date(),limit=20){
  const groups=[],exact=new Map(),buckets=new Map();
  for(const item of items){
    const key=signature(item.title);
    let group=exact.get(key.normalized)||(buckets.get(key.numbers)||[]).find(g=>matching(g.signature,key));
    if(!group){group={title:item.title,signature:key,items:[]};groups.push(group);if(!buckets.has(key.numbers))buckets.set(key.numbers,[]);buckets.get(key.numbers).push(group);}
    exact.set(key.normalized,group);
    if(!group.items.some(i=>i.url===item.url))group.items.push(item);
  }
  return groups.map(g=>{
    const providers=[...new Set(g.items.map(i=>i.provider))];
    const position=providers.reduce((sum,p)=>sum+20/Math.sqrt(Math.min(...g.items.filter(i=>i.provider===p).map(i=>i.position))),0);
    const freshness=Math.max(...g.items.map(i=>Math.max(0,10-(now-new Date(i.publishedAt))/3600000/6)));
    const signal=Math.max(...g.items.map(i=>i.signal||0))*3;
    const score=Math.round(Math.min(100,position+freshness+signal+(providers.length-1)*12+Math.min(10,g.items.length*2)));
    return {title:g.title,normalizedTitle:g.signature.normalized,slug:g.signature.normalized.replaceAll(" ","-"),score,categoryGuess:"",keywords:[...g.signature.words].slice(0,12),relatedQueries:[],firstSeenAt:now,lastSeenAt:now,sources:g.items.map(i=>({provider:i.provider,title:i.title,url:i.url,position:i.position,fetchedAt:now,publishedAt:i.publishedAt,region:i.region}))};
  }).sort((a,b)=>b.score-a.score||a.normalizedTitle.localeCompare(b.normalizedTitle)).slice(0,limit).map((t,i)=>({...t,rank:i+1}));
}
