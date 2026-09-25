import { z } from "zod";
import Article from "../../models/Article.js";
import Category from "../../models/Category.js";
import Tag from "../../models/Tag.js";
import TrendingSnapshot from "../../models/TrendingSnapshot.js";
import env from "../../config/env.js";
import { AppError } from "../../utils/apiResponse.js";
import { cleanGeneratedHtml, plainText } from "../../utils/sanitize.js";
import { generationInput, generatedArticle, parseInput } from "../../validators/ai.validator.js";
import { generateText, requireGemini, geminiStatus } from "../gemini.service.js";
import { parseJsonObject } from "./json.js";

import { editorialPrompt } from "./prompt.js";
export { editorialPrompt } from "./prompt.js";

export function parseGenerated(raw, context) {
  const result=generatedArticle.parse(parseJsonObject(raw));
  if(!/<(?:p|h2|h3|ul|ol|table)\b/i.test(result.content))throw new Error("Article content must be HTML");
  result.content=cleanGeneratedHtml(result.content);
  if(!plainText(result.content)) throw new Error("Empty content");
  result.internalLinks=(result.internalLinks||[]).filter(l=>context.internal.some(a=>a.url===l.url));
  result.externalLinks=(result.externalLinks||[]).filter(l=>context.external.some(a=>a.url===l.url));
  const body=plainText(result.content).replace(/\s+/g," ").toLowerCase();
  result.faq=(result.faq||[]).filter(f=>body.includes(f.question.toLowerCase())&&body.includes(f.answer.toLowerCase()));
  return result;
}
export async function generateArticle(input) {
  const data=parseInput(generationInput,input);
  requireGemini();
  const config=geminiStatus();
  const relevant=await Article.find({status:"published",visibility:"public",deletedAt:null,$text:{$search:data.title}}).select("title slug").limit(10).lean();
  const internal=relevant.map(a=>({title:a.title,url:`/article/${a.slug}`}));
  const external=data.sourceUrl?[{url:data.sourceUrl}]:[];
  if(data.trendId){
    const snapshot=await TrendingSnapshot.findOne({"topics._id":data.trendId}).lean();
    const topic=snapshot?.topics.find(t=>String(t._id)===data.trendId);
    if(topic) external.push(...topic.sources.map(s=>({title:s.title,url:s.url})));
  }
  const [categories,tags]=await Promise.all([Category.find({isActive:true,parent:null}).select("name").limit(100).lean(),Tag.find({isActive:true}).select("name").limit(200).lean()]);
  const context={...data,internal,external:external.slice(0,12),availableSections:categories.map(c=>c.name),availableTags:tags.map(t=>t.name)};
  const schema=z.toJSONSchema(generatedArticle,{io:"input"}), system=editorialPrompt+"\nJSON schema:\n"+JSON.stringify(schema);
  const started=Date.now(), signal=AbortSignal.timeout(env.aiTimeoutMs);
  let response=await generateText({system,input:JSON.stringify(context),json:true,signal}), article;
  try{article=parseGenerated(response.text,context);}catch{
    response=await generateText({system,input:JSON.stringify({...context,repairInstruction:"Previous output failed validation. Return a complete valid JSON object using the schema; do not add extra fields."}),json:true,signal});
    try{article=parseGenerated(response.text,context);}catch{throw Object.assign(new AppError("AI returned an invalid article. Your existing content has not been changed.",502),{errorCode:"INVALID_RESPONSE",provider:config.provider,model:config.model});}
  }
  const normalize=value=>value.normalize("NFKC").trim().toLowerCase();
  article.suggestedCategory=categories.find(c=>normalize(c.name)===normalize(article.articleSection))?._id?.toString()||null;
  article.suggestedTagIds=tags.filter(t=>article.suggestedTags.some(name=>normalize(name)===normalize(t.name))).map(t=>String(t._id));
  return {article,provider:config.provider,model:config.model,durationMs:Date.now()-started,usage:response.usage};
}
