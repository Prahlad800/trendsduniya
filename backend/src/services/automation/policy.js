import {createHash} from "node:crypto";
import {AppError} from "../../utils/apiResponse.js";
export const dayInZone=(date=new Date(),timezone="Asia/Kolkata")=>new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export function slotDate(day,time,timezone){
 const target=new Date(`${day}T${time}:00Z`);let value=+target;
 for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value));const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));const actual=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);value+=+target-actual;}
 return new Date(value);
}
export function fingerprint(article){const a=article.toObject?article.toObject():article;return createHash("sha256").update(JSON.stringify([a.title,a.content,a.excerpt,a.summary,a.language,String(a.category||""),a.seo?.metaTitle,a.seo?.metaDescription,a.media,a.externalLinks,a.faq])).digest("hex");}
export function assertReady(task,article,settings){
 if(!task||task.verification!=="verified"||task.state==="rejected")throw new AppError("Verify this topic's supporting evidence before publishing",422);
 const images=[article.media?.featuredImage,...(article.media?.images||[])].filter(i=>i?.url);
 if(images.length<task.imageCount||new Set(images.map(i=>i.publicId)).size<task.imageCount||images.some(i=>!i.alt))throw new AppError("Complete all distinct article images and alt text before publishing",422);
 if(!task.sources?.length||task.sources.some(s=>!s.evidence||!s.publishedAt))throw new AppError("Source evidence and timestamps are required",422);
 if((settings.humanReview||task.sensitive)&&task.approvedHash!==fingerprint(article))throw new AppError("Approve the current article version in AI News Automation",422);
}
