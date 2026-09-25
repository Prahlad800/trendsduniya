import { z } from "zod";
import { AppError } from "../../utils/apiResponse.js";
import { generateText, requireGemini, geminiStatus } from "../gemini.service.js";
import { parseJsonObject } from "../ai/json.js";
import { sameTopic } from "./trendRanking.service.js";
import { trendingPrompt } from "./prompt.js";
import env from "../../config/env.js";

const resultSchema=z.object({topics:z.array(z.object({
  candidateId:z.number().int().min(0),category:z.string().trim().min(1).max(100),
  trend_score:z.number().min(0).max(100),why_trending:z.string().trim().min(1).max(1000),
  search_keywords:z.array(z.string().trim().min(1).max(150)).min(1).max(12),
  article_angle:z.string().trim().min(1).max(500),language_priority:z.enum(["Hindi","English"]),
}).strict()).min(20).max(30)}).strict();

export function parseTrendSelection(raw,candidates) {
  const result=resultSchema.parse(parseJsonObject(raw)),selected=[];
  for(const item of result.topics) {
    const candidate=candidates[item.candidateId];
    if(!candidate?.sources?.length||selected.some(t=>sameTopic(t.title,candidate.title)))continue;
    selected.push({...candidate,categoryGuess:item.category,score:item.trend_score,whyTrending:item.why_trending,
      keywords:[...new Set(item.search_keywords)],articleAngle:item.article_angle,languagePriority:item.language_priority,sourceCount:candidate.sources.length});
  }
  if(selected.length<20)throw new Error("Twenty distinct sourced topics are required");
  return selected.sort((a,b)=>b.score-a.score).slice(0,20).map((topic,i)=>({...topic,rank:i+1}));
}

export async function selectTrendingTopics(candidates,{country,date,now}) {
  requireGemini();
  const config=geminiStatus();
  if(candidates.length<20)throw new AppError("Fewer than 20 distinct current stories are available from news sources. Existing trends are preserved; try again later.",503);
  const schema=z.toJSONSchema(resultSchema,{io:"input"});
  const system=trendingPrompt+`\nJSON schema:\n${JSON.stringify(schema)}`;
  const context={country,date,currentTime:now.toISOString(),candidates:candidates.map((t,candidateId)=>({candidateId,title:t.title,score:t.score,sources:t.sources}))};
  const signal=AbortSignal.timeout(env.aiTimeoutMs);
  for(let attempt=0;attempt<2;attempt++) {
    const response=await generateText({system,input:JSON.stringify({...context,...(attempt?{repairInstruction:"Return exactly 20 unique valid candidate IDs with every required field. Previous output failed validation."}:{})}),json:true,signal});
    try{return {topics:parseTrendSelection(response.text,candidates),provider:config.provider,model:config.model};}catch{
      if(attempt)throw Object.assign(new AppError("AI response did not contain 20 distinct sourced topics. Existing history is preserved.",502),{errorCode:"INVALID_RESPONSE",provider:config.provider,model:config.model});
    }
  }
}
