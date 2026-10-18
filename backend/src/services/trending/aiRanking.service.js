import { z } from "zod";
import { AppError } from "../../utils/apiResponse.js";
import { generateText, requireGroq, groqStatus } from "../groq.service.js";
import { parseJsonObject } from "../ai/json.js";
import { sameTopic } from "./trendRanking.service.js";
import { trendingPrompt } from "./prompt.js";
import env from "../../config/env.js";

const resultSchema=z.object({topics:z.array(z.object({
  candidateId:z.number().int().min(0),category:z.string().trim().min(1).max(100),
  title_en:z.string().trim().min(1).max(300),title_hi:z.string().trim().min(1).max(300).regex(/[\u0900-\u097f]/,"Hindi text is required"),
  why_trending_hi:z.string().trim().min(1).max(1000).regex(/[\u0900-\u097f]/),article_angle_hi:z.string().trim().min(1).max(500).regex(/[\u0900-\u097f]/),
  trend_score:z.number().min(0).max(100),why_trending:z.string().trim().min(1).max(1000),
  search_keywords:z.array(z.string().trim().min(1).max(150)).min(1).max(12),
  article_angle:z.string().trim().min(1).max(500),language_priority:z.enum(["Hindi","English"]),
}).strict()).length(5)}).strict();

export function parseTrendSelection(raw,candidates) {
  const result=resultSchema.parse(parseJsonObject(raw)),selected=[];
  for(const item of result.topics) {
    const candidate=candidates[item.candidateId];
    if(!candidate?.sources?.length||selected.some(t=>sameTopic(t.title,candidate.title)))continue;
    selected.push({...candidate,titleEn:item.title_en,titleHi:item.title_hi,whyTrendingHi:item.why_trending_hi,articleAngleHi:item.article_angle_hi,categoryGuess:item.category,score:item.trend_score,whyTrending:item.why_trending,
      keywords:[...new Set(item.search_keywords)],articleAngle:item.article_angle,languagePriority:item.language_priority,sourceCount:candidate.sources.length});
  }
  if(selected.length<5)throw new Error("Five distinct sourced topics are required");
  return selected.sort((a,b)=>b.score-a.score).map((topic,i)=>({...topic,rank:i+1}));
}

export async function selectTrendingTopics(candidates,{country,date,now}) {
  requireGroq();
  const config=groqStatus();
  if(candidates.length<5)throw new AppError("Fewer than five distinct current stories are available from news sources. Existing trends are preserved; try again later.",503);
  const schema=z.toJSONSchema(resultSchema,{io:"input"});
  const system=trendingPrompt+`\nJSON schema:\n${JSON.stringify(schema)}`;
  // Rank before sending: encoded RSS redirect URLs and repeated source titles
  // consume tokens without helping the model select existing candidate IDs.
  // Original headlines and complete source URLs stay in candidates and storage.
  const shortlist=country==="WORLD"?[...new Set([...candidates.slice(0,20),...candidates.filter(t=>t.sources.some(s=>s.provider==="bbcWorld")),...candidates])].slice(0,40):candidates.slice(0,40);
  const context={country,date,currentTime:now.toISOString(),candidates:shortlist.map((t,candidateId)=>({candidateId,title:t.title.slice(0,240),score:t.score,sourceCount:t.sources.length,regions:[...new Set(t.sources.map(s=>s.region).filter(Boolean))],providers:[...new Set(t.sources.map(s=>s.provider))].slice(0,4)}))};
  const signal=AbortSignal.timeout(env.aiTimeoutMs);
  for(let attempt=0;attempt<2;attempt++) {
    const response=await generateText({system,input:JSON.stringify({...context,...(attempt?{repairInstruction:"Return exactly five unique valid candidate IDs with all English and Hindi fields. Previous output failed validation."}:{})}),json:true,signal,maxCompletionTokens:3072,reasoningEffort:"low"});
    try{return {topics:parseTrendSelection(response.text,shortlist),provider:config.provider,model:config.model};}catch{
      if(attempt)throw Object.assign(new AppError("AI response did not contain five distinct bilingual sourced topics. Existing history is preserved.",502),{errorCode:"INVALID_RESPONSE",provider:config.provider,model:config.model});
    }
  }
}
