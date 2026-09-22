export const normalizeTrend=value=>value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu," ").trim().replace(/\s+/g," ");
const tokens=value=>new Set(normalizeTrend(value).split(" ").filter(v=>!new Set(["the","a","an","in","on","for","of","and","to","launch","launches"]).has(v)));
export function sameTopic(a,b){
  if(normalizeTrend(a)===normalizeTrend(b))return true;
  const x=tokens(a),y=tokens(b),shared=[...x].filter(t=>y.has(t));
  const nums=s=>[...s].filter(t=>/\d/.test(t)).sort().join(" ");
  if(nums(x)!==nums(y))return false;
  return shared.length>=2&&shared.length===Math.min(x.size,y.size)&&shared.length/Math.max(x.size,y.size)>=0.65;
}
export function rankTrends(items,now=new Date(),limit=20){
  const groups=[];
  for(const item of items){
    let group=groups.find(g=>sameTopic(g.title,item.title));
    if(!group){group={title:item.title,items:[]};groups.push(group);}
    if(!group.items.some(i=>i.url===item.url))group.items.push(item);
  }
  return groups.map(g=>{
    const providers=[...new Set(g.items.map(i=>i.provider))];
    const position=providers.reduce((sum,p)=>sum+20/Math.sqrt(Math.min(...g.items.filter(i=>i.provider===p).map(i=>i.position))),0);
    const freshness=Math.max(...g.items.map(i=>Math.max(0,10-(now-new Date(i.publishedAt))/3600000/6)));
    const signal=Math.max(...g.items.map(i=>i.signal||0))*3;
    const score=Math.round(Math.min(100,position+freshness+signal+(providers.length-1)*12+Math.min(10,g.items.length*2)));
    return {title:g.title,normalizedTitle:normalizeTrend(g.title),slug:normalizeTrend(g.title).replaceAll(" ","-"),score,categoryGuess:"",keywords:[...tokens(g.title)].slice(0,12),relatedQueries:[],firstSeenAt:now,lastSeenAt:now,sources:g.items.map(i=>({provider:i.provider,title:i.title,url:i.url,position:i.position,fetchedAt:now}))};
  }).sort((a,b)=>b.score-a.score||a.normalizedTitle.localeCompare(b.normalizedTitle)).slice(0,limit).map((t,i)=>({...t,rank:i+1}));
}
