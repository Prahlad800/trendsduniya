import {testGroq,groqStatus} from "../services/groq.service.js";
import {Router} from "express";
import {z} from "zod";
import {randomUUID} from "node:crypto";
import {authenticate} from "../middleware/auth.middleware.js";
import {allowRoles} from "../middleware/admin.middleware.js";
import {durableLimit} from "../middleware/aiRateLimit.middleware.js";
import {cronAuth} from "./trending.routes.js";
import {AutomationTask,AutomationSettings} from "../models/Automation.js";
import Article from "../models/Article.js";
import {success,AppError} from "../utils/apiResponse.js";
import {getSettings,withWorkerLock,research,tickAutomation,record,approveTask,requestFor} from "../services/automation/automation.service.js";
import {readiness,generateImage} from "../services/automation/providers.js";
import {dayInZone,assertReady} from "../services/automation/policy.js";
import {saveArticle} from "../services/article.service.js";
import {sameTopic} from "../services/trending/trendRanking.service.js";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const time=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const settingsInput=z.object({enabled:z.boolean(),humanReview:z.boolean(),imageModel:z.literal("@cf/black-forest-labs/flux-1-schnell"),language:z.enum(["en-IN","hi-IN"]),imageCount:z.number().int().min(4).max(5),timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat("en",{timeZone:v});return true;}catch{return false;}}),slots:z.array(time).length(5).refine(v=>new Set(v).size===5).transform(v=>v.sort()),retryLimit:z.number().int().min(0).max(6),dailyLimit:z.number().int().min(1).max(10),countries:z.array(z.enum(["IN","US","GB"])).min(1).max(3),sources:z.array(z.enum(["googleTrends","googleNews","bbcNews","googleNewsWORLD","googleNewsTECHNOLOGY","googleNewsBUSINESS","googleNewsSCIENCE","googleNewsSPORTS","googleNewsENTERTAINMENT"])).min(1).max(9),words:z.number().int().min(300).max(2000),tone:z.string().min(1).max(200)}).strict();
const source=z.object({title:z.string().min(1).max(300),url:z.string().url().max(2048).refine(v=>{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password;}),publishedAt:z.string().datetime({offset:true}).refine(v=>Date.parse(v)<=Date.now()+3600000),provider:z.string().max(100).optional(),evidence:z.string().min(40).max(10000)}).strict();
const router=Router();router.use(authenticate,allowRoles("superadmin","admin","editor"));router.use((req,res,next)=>{res.set("Cache-Control","no-store");next();});
router.get("/",async(req,res)=>{
 const settings=await getSettings();const safe=settings.toObject();safe.textModel=groqStatus().model;delete safe.leaseToken;delete safe.leaseUntil;
 const day=req.query.day?z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.day):dayInZone(new Date(),settings.timezone);
 const tasks=await AutomationTask.find({day}).sort({scheduledAt:1}).lean();
 const pending=await AutomationTask.find({day:{$ne:day},state:{$nin:["published","rejected"]}}).sort({createdAt:-1}).limit(50).lean();
 return success(res,{settings:safe,tasks,pending,day,providers:readiness(),cost:null});
});
router.put("/settings",allowRoles("superadmin","admin"),async(req,res)=>{const input=settingsInput.partial().parse(req.body);if(input.enabled&&Object.values(readiness()).some(v=>!v))throw new AppError("Configure Groq, Cloudflare and Cloudinary server environment first",422);await getSettings();const s=await AutomationSettings.findByIdAndUpdate("main",{$set:{...input,owner:req.admin._id}},{returnDocument:"after"});return success(res,{enabled:s.enabled});});
router.post("/research",durableLimit("automation-research",5),async(req,res)=>success(res,await withWorkerLock(s=>research(s,req.admin._id))));
router.post("/test/:provider",durableLimit("automation-test",10),async(req,res)=>{
 const settings=await getSettings();
 if(req.params.provider==="groq")await testGroq();
 else if(req.params.provider==="cloudflare")await generateImage("A simple blue circle on a white background",settings);
 else throw new AppError("Unknown provider",404);
 return success(res,{connected:true,message:"Live API request succeeded. Provider usage may be billed."});
});
router.post("/topics",async(req,res)=>success(res,await withWorkerLock(async s=>{
 const input=z.object({title:z.string().min(5).max(300),sources:z.array(source).min(1).max(10),categoryId:id.optional()}).strict().parse(req.body);
 const day=dayInZone(new Date(),s.timezone);if(await AutomationTask.countDocuments({day,state:{$ne:"rejected"}})>=5)throw new AppError("Reject a topic before adding a replacement to today's five",409);
 const recent=await AutomationTask.find({createdAt:{$gte:new Date(Date.now()-7*86400000)}}).select("title");const articles=await Article.find({createdAt:{$gte:new Date(Date.now()-7*86400000)}}).select("title");if([...recent,...articles].some(t=>sameTopic(t.title,input.title)))throw new AppError("A similar topic already exists",409);
 return AutomationTask.create({...input,day,key:randomUUID(),owner:req.admin._id,language:s.language,imageCount:s.imageCount,words:s.words,tone:s.tone,region:"Manually selected",reason:"Editor supplied topic"});
})));
router.post("/tasks/:id/:action",async(req,res)=>success(res,await withWorkerLock(async settings=>{
 const task=await AutomationTask.findById(id.parse(req.params.id));if(!task)throw new AppError("Task not found",404);
 if(task.article&&await Article.exists({_id:task.article,status:"published"}))throw new AppError("Published articles must be edited through the article editor",409);
 const action=req.params.action;
 if(task.state==="published")throw new AppError("Published task is immutable. Use the article editor.",409);
 if(["queued","generating_images"].includes(task.state)&&!["reject"].includes(action))throw new AppError("Pause or finish the queued work before changing this task",409);
 if(action==="verify"){
  const input=z.object({sources:z.array(source).min(1).max(10),categoryId:id,language:z.enum(["hi-IN","en-IN"]).optional(),words:z.number().int().min(300).max(2000).optional(),tone:z.string().min(1).max(200).optional()}).strict().parse(req.body);
  Object.assign(task,input,{verification:"verified",verifiedBy:req.admin._id,approvedHash:""});
 }else if(action==="generate"||action==="regenerate"){
  if(task.verification!=="verified")throw new AppError("Verify source evidence first",422);
  if(action==="generate"&&(task.article||task.draft))throw new AppError("Use regenerate to replace an existing draft",409);
  const day=dayInZone(new Date(),settings.timezone);
  const used=settings.generationDay===day?settings.generationCount:0;
  if(used>=settings.dailyLimit)throw new AppError("Daily generation limit reached",429);
  settings.generationDay=day;settings.generationCount=used+1;await settings.save();
  if(action==="regenerate"){task.replaceDraft=true;task.images=[];task.draft=null;task.approvedHash="";}
  task.state="queued";task.owner=req.admin._id;task.imageCount=settings.imageCount;
 }else if(action==="approve"){return approveTask(task,req.admin);}
 else if(action==="schedule"){
  const {scheduledAt}=z.object({scheduledAt:z.string().datetime({offset:true})}).strict().parse(req.body);
  const article=await Article.findById(task.article);if(!article)throw new AppError("Generate the draft first",422);assertReady(task,article,settings);
  if(Date.parse(scheduledAt)<=Date.now())throw new AppError("Choose a future publication time",422);
  task.state="scheduled";task.scheduledAt=new Date(scheduledAt);
 }else if(action==="publish"){
  if(!task.article)throw new AppError("Generate a draft first",422);
  const reqFor=await requestFor(task);const article=await saveArticle(reqFor,task.article,{status:"published"},"AUTOMATION_MANUAL_PUBLISH");task.state="published";task.publishedAt=article.publishedAt;
 }else if(action==="retry"){
  if(task.state!=="failed")throw new AppError("Only failed jobs can be retried",409);
  task.state=task.resumeState||"queued";task.attempts=0;task.error="";task.nextAttemptAt=null;
 }else if(action==="reject"){task.state="rejected";task.approvedHash="";}
 else if(action==="draft"){task.state="ready_for_review";task.approvedHash="";}
 else if(action==="regenerate-image"){
  const {index}=z.object({index:z.number().int().min(0).max(4)}).strict().parse(req.body);
  if(index>=task.imageCount||!task.draft)throw new AppError("Image does not exist",422);
  if(task.article)task.replaceImages=true;
  task.images[index]=null;task.markModified("images");task.state="generating_images";task.approvedHash="";
 }else throw new AppError("Unknown action",404);
 record(task,action);await task.save();return task;
})));
export const automationJobs=Router();automationJobs.post("/automation",cronAuth,async(req,res)=>success(res,await tickAutomation()));
export default router;
