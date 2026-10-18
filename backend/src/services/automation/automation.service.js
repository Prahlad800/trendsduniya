import {randomUUID,createHash} from "node:crypto";
import {AutomationSettings,AutomationTask} from "../../models/Automation.js";
import Article from "../../models/Article.js";
import Admin from "../../models/Admin.js";
import {saveArticle,canPublish} from "../article.service.js";
import {uploadImage} from "../cloudinary.service.js";
import {trendProviders} from "../trending/providers/index.js";
import {rankTrends,sameTopic,normalizeTrend} from "../trending/trendRanking.service.js";
import {generateText,generateImage} from "./providers.js";
import {dayInZone,slotDate,fingerprint,assertReady} from "./policy.js";
import {AppError} from "../../utils/apiResponse.js";
export async function getSettings(){return AutomationSettings.findOneAndUpdate({_id:"main"},{$setOnInsert:{_id:"main"}},{upsert:true,returnDocument:"after",setDefaultsOnInsert:true});}
export function record(task,event,message=""){task.history.push({at:new Date(),event,message});task.history=task.history.slice(-100);}
export async function withWorkerLock(fn){
 await getSettings();const token=randomUUID();
 const settings=await AutomationSettings.findOneAndUpdate({_id:"main",$or:[{leaseUntil:{$lt:new Date()}},{leaseUntil:null}]},{$set:{leaseUntil:new Date(Date.now()+300000),leaseToken:token,lastTickAt:new Date()}},{returnDocument:"after"});
 if(!settings)throw new AppError("Automation worker is busy; retry shortly",409);
 try{return await fn(settings);}finally{await AutomationSettings.updateOne({_id:"main",leaseToken:token},{$set:{leaseUntil:new Date(0)}});}
}
export async function research(settings,owner){
 const day=dayInZone(new Date(),settings.timezone);
 const count=await AutomationTask.countDocuments({day,state:{$ne:"rejected"}});
 if(count>=5)return {created:0,message:"Five topics already selected. Reject a topic before replacing it."};
 const results=await Promise.allSettled(settings.countries.flatMap(country=>trendProviders.filter(p=>settings.sources.includes(p.name)).map(p=>p.fetch(country))));
 const items=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
 if(!items.length)throw new AppError("No current RSS evidence available; no topics were invented",503);
 const candidates=rankTrends(items,new Date(),100);
 const recent=await Article.find({createdAt:{$gte:new Date(Date.now()-7*86400000)}}).select("title").lean();
 const previous=await AutomationTask.find({createdAt:{$gte:new Date(Date.now()-7*86400000)}}).select("title scheduledAt").lean();
 let created=0;
 for(const candidate of candidates){
  if(created+count>=5)break;
  if([...recent,...previous].some(a=>sameTopic(a.title,candidate.title)))continue;
  const sources=candidate.sources.map(s=>{const item=items.find(i=>i.url===s.url);return {...s,publishedAt:item?.publishedAt,evidence:item?.evidence||""};});
  const slot=settings.slots.map(t=>slotDate(day,t,settings.timezone)).find(d=>!previous.some(p=>+p.scheduledAt===+d));
  const task=await AutomationTask.create({day,key:createHash("sha256").update(`${day}:${normalizeTrend(candidate.title)}`).digest("hex"),title:candidate.title,score:candidate.score,region:settings.countries.join(", "),reason:"Editorial score based on RSS recency, source diversity and feed position; not a measured worldwide rank.",sources,scheduledAt:slot,owner,language:settings.language,imageCount:settings.imageCount,words:settings.words,tone:settings.tone,history:[{at:new Date(),event:"researched"}]});
  previous.push(task);created++;
 }
 settings.researchDay=day;settings.lastResearchError="";await settings.save();
 return {created,failedFeeds:results.filter(r=>r.status==="rejected").length};
}
export async function requestFor(task){const admin=await Admin.findById(task.owner);if(!admin?.isActive||!canPublish(admin))throw new AppError("An active editor must own this task",403);return {admin,ip:"automation",get:()=>"AI News Automation"};}
async function step(task,settings){
 const req=await requestFor(task);
 if(task.state==="queued"){
  if(task.verification!=="verified")throw new AppError("Topic needs verified evidence",422);
  const result=await generateText(task,settings);task.draft=result.draft;task.usage=result.usage;task.providerModel=result.model;
  // Model self-assessment alone is not sufficient to clear sensitive news.
  task.sensitive=true;task.state="generating_images";record(task,"text_generated");await task.save();return;
 }
 if(task.state==="generating_images"){
  const index=task.images.findIndex(image=>!image?.url);
  const next=index>=0?index:task.images.length;
  if(next<task.imageCount){
   const prompt=task.draft.images[next];const buffer=await generateImage(prompt.prompt,settings);
   let stored;try{stored=await uploadImage(buffer,{public_id:`automation-${task.id}-${next}`,overwrite:true,transformation:[{width:1600,height:900,crop:"fill",quality:"auto",fetch_format:"webp"}]});}catch{const error=new AppError("Image storage failed; check Cloudinary configuration",502);error.retryable=true;throw error;}
   task.images[next]={...stored,alt:prompt.alt,caption:`AI-generated illustration. ${prompt.caption}`};task.markModified("images");record(task,"image_saved",`Image ${next+1}`);await task.save();return;
  }
  let article=await Article.findById(task.articleId);
  if(!article||task.replaceDraft){
   const d=task.draft;
   article=await saveArticle(req,article?.id||null,{status:"draft",title:d.title,excerpt:d.excerpt,summary:d.summary,content:d.content,language:task.language,category:task.categoryId?String(task.categoryId):undefined,seo:d.seo,faq:d.faq,media:{featuredImage:task.images[0],images:task.images.slice(1)},source:{name:task.sources[0].provider||"Editorial sources",url:task.sources[0].url,type:"publication",publishedAt:task.sources[0].publishedAt.toISOString()},externalLinks:task.sources.map(s=>({title:s.title,url:s.url,rel:"noopener noreferrer"}))},"AUTOMATION_CREATE",{id:task.articleId,task:task._id});
  }else if(task.replaceImages){
   article=await saveArticle(req,article.id,{status:"draft",media:{featuredImage:task.images[0],images:task.images.slice(1)}},"AUTOMATION_IMAGES");
  }
  task.replaceDraft=false;task.replaceImages=false;task.article=article._id;task.state="ready_for_review";record(task,"draft_saved");await task.save();return;
 }
 if(task.state==="scheduled"){
  if(task.scheduledAt>new Date())return;
  const current=await getSettings();if(!current.enabled)return;
  if(current.lastPublishedAt&&Date.now()-current.lastPublishedAt<30*60000)return;
  const article=await Article.findById(task.article);
  if(article?.status==="published"){task.state="published";task.publishedAt=article.publishedAt;await task.save();return;}
  assertReady(task,article,current);
  await saveArticle(req,article.id,{status:"published"},"AUTOMATION_PUBLISH");
  task.state="published";task.publishedAt=new Date();record(task,"published");await task.save();
 }
}
export async function tickAutomation(){
 try{return await withWorkerLock(async settings=>{
  if(!settings.enabled)return {paused:true};
  const day=dayInZone(new Date(),settings.timezone);
  if(settings.researchDay!==day&&settings.owner){try{await research(settings,settings.owner);}catch{settings.lastResearchError="RSS research failed; retry from Trending Topics.";settings.researchDay=day;await settings.save();}}
  const states=settings.lastPublishedAt&&Date.now()-settings.lastPublishedAt<30*60000?["queued","generating_images"]:["queued","generating_images","scheduled"];
  const task=await AutomationTask.findOne({state:{$in:states},$and:[{$or:[{nextAttemptAt:null},{nextAttemptAt:{$lte:new Date()}}]},{$or:[{state:{$ne:"scheduled"}},{scheduledAt:{$lte:new Date()}}]}]}).sort({scheduledAt:1,createdAt:1});
  if(!task)return {idle:true};
  try{await step(task,settings);task.attempts=0;task.error="";task.nextAttemptAt=null;await task.save();}
  catch(error){task.attempts++;task.error=error instanceof AppError?error.message:"Automation operation failed. Check database/storage health.";record(task,"failed",task.error);
   if(error.retryable&&task.attempts<=settings.retryLimit){task.nextAttemptAt=new Date(Date.now()+Math.max(error.retryAfter||0,30000*2**(task.attempts-1)));}
   else{task.resumeState=task.state;task.state="failed";}
   await task.save();
  }
  return {task:task.id,state:task.state};
 });}catch(error){if(error.statusCode===409)return {busy:true};throw error;}
}
export async function approveTask(task,admin){
 const article=await Article.findById(task.article);if(!article)throw new AppError("Generate and save the article first",422);
 task.approvedHash=fingerprint(article);task.approvedBy=admin._id;
 assertReady(task,article,await getSettings());record(task,"approved");await task.save();return task;
}
