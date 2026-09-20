import Article from "../models/Article.js";
import Admin from "../models/Admin.js";
import {saveArticle,canPublish} from "./article.service.js";
export async function publishDueArticles(){
 const due=await Article.find({status:"scheduled",scheduledAt:{$lte:new Date()}}).select("_id updatedBy");
 for(const a of due){try{const admin=await Admin.findById(a.updatedBy);if(!admin?.isActive||!canPublish(admin))continue;await saveArticle({admin,ip:"scheduler",get:()=>"scheduler"},a.id,{status:"published"},"SCHEDULE_PUBLISH");}catch{console.error(JSON.stringify({event:"schedule.failed",article:a.id}));}}
}
export function startScheduler(){
 let running=false;
 const tick=async()=>{if(running)return;running=true;
  try{
   await publishDueArticles();
  }finally{running=false;}
 };
 const timer=setInterval(()=>tick().catch(()=>console.error('Scheduler database unavailable')),30000);timer.unref();return ()=>clearInterval(timer);
}
