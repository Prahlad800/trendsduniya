import { randomUUID } from "node:crypto";
import TrendingSnapshot from "../../models/TrendingSnapshot.js";
import { AppError } from "../../utils/apiResponse.js";
import { countries,trendProviders } from "./providers/index.js";
import { rankTrends } from "./trendRanking.service.js";
import env from "../../config/env.js";
import { selectTrendingTopics } from "./aiRanking.service.js";
export function trendDate(country="IN",now=new Date()){
  if(!countries[country])throw new AppError("Choose a supported country",422);
  return new Intl.DateTimeFormat("en-CA",{timeZone:countries[country].zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
}
export function queryDate(query){
  const country=query.country||"IN",today=trendDate(country),date=query.date||today;
  if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>today)throw new AppError("Choose a valid date no later than today",422);
  return {date,country};
}
export function publicSnapshot(s){if(!s)return null;const data=s.toObject?s.toObject():{...s};delete data.lockUntil;delete data.lockToken;return data;}
export async function refreshTrends(country="IN",{force=false,providers=trendProviders}={}){
  const date=trendDate(country),now=new Date(),key={date,country};
  let snapshot;
  try{snapshot=await TrendingSnapshot.findOneAndUpdate(key,{$setOnInsert:{topics:[],sourceHealth:[]}},{upsert:true,returnDocument:"after"});}
  catch(error){if(error.code!==11000)throw error;snapshot=await TrendingSnapshot.findOne(key);}
  if(!force&&snapshot.provider&&snapshot.topics.length===20&&snapshot.lastRefreshedAt&&now-snapshot.lastRefreshedAt<env.trendRefreshHours*3600000)return publicSnapshot(snapshot);
  if(snapshot.lastAttemptAt&&now-snapshot.lastAttemptAt<60000)throw new AppError("Trends were refreshed recently. Please wait a minute.",429);
  const lockToken=randomUUID();
  const locked=await TrendingSnapshot.findOneAndUpdate({...key,$and:[{$or:[{lockUntil:{$exists:false}},{lockUntil:{$lte:now}}]},{$or:[{lastAttemptAt:{$exists:false}},{lastAttemptAt:{$lte:new Date(+now-60000)}}]}]},{$set:{lockToken,lockUntil:new Date(+now+env.aiTimeoutMs+30000),lastAttemptAt:now}},{returnDocument:"after"});
  if(!locked)throw new AppError("Trend refresh is already running",409);
  try{
    const results=await Promise.allSettled(providers.map(p=>p.fetch(country)));
    const health=results.map((r,i)=>({provider:providers[i].name,status:r.status==="fulfilled"&&r.value.length?"active":"unavailable",count:r.status==="fulfilled"?r.value.length:0,message:r.status==="fulfilled"&&r.value.length?"Feed collected":"Temporarily unavailable"}));
    for(const source of health)if(source.status==="unavailable")console.warn(JSON.stringify({event:"trends.provider.unavailable",provider:source.provider}));
    const items=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
    if(!items.length){await TrendingSnapshot.updateOne({...key,lockToken},{$set:{sourceHealth:health}});throw new AppError("All trend sources are temporarily unavailable. Existing history is preserved.",503);}
    const current=items.filter(i=>Number.isFinite(+new Date(i.publishedAt))&&now-new Date(i.publishedAt)<=48*3600000&&new Date(i.publishedAt)<=new Date(+now+3600000));
    const selection=await selectTrendingTopics(rankTrends(current,now,120),{country,date,now});
    const topics=selection.topics.map(t=>{const previous=snapshot.topics.find(p=>p.normalizedTitle===t.normalizedTitle);return {...t,...(previous?{_id:previous._id,firstSeenAt:previous.firstSeenAt}:{})};});
    const saved=await TrendingSnapshot.findOneAndUpdate({...key,lockToken},{$set:{topics,provider:selection.provider,model:selection.model,generatedAt:new Date(),sourceHealth:health,topicsCollected:current.length,lastRefreshedAt:now,language:countries[country].locale}},{returnDocument:"after"});
    if(!saved)throw new AppError("Trend refresh lease expired. Please retry.",409);
    console.info(JSON.stringify({event:"trends.snapshot.updated",date,country,topics:topics.length}));
    return publicSnapshot(saved);
  }finally{await TrendingSnapshot.updateOne({...key,lockToken},{$unset:{lockUntil:1,lockToken:1}});}
}
