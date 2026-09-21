import mongoose from "mongoose";
import Article from "../models/Article.js";
import Category from "../models/Category.js";
import Author from "../models/Author.js";
import Tag from "../models/Tag.js";
import ArticleRevision from "../models/ArticleRevision.js";
import ArticleRedirect from "../models/ArticleRedirect.js";
import AuditLog from "../models/AuditLog.js";
import { AppError } from "../utils/apiResponse.js";
import { cleanHtml, plainText } from "../utils/sanitize.js";
import { uniqueSlug } from "./slug.service.js";
import { generateCanonical } from "./seo.service.js";
import { articleInput } from "../validators/article.validator.js";
export const canPublish=admin=>["superadmin","admin","editor"].includes(admin.role);
export function checkOwner(article,admin){if(admin.role==="author"&&String(article.createdBy)!==admin.id)throw new AppError("You can only access your own articles",403);}
export async function findOwned(id,admin,session){
 const article=await Article.findById(id).session(session||null);
 if(!article)throw new AppError("Article not found",404);
 checkOwner(article,admin);return article;
}
export function mergeObject(target,source){
 for(const [key,value] of Object.entries(source)){
  if(value&&typeof value==="object"&&!Array.isArray(value)&&!(value instanceof Date)){target[key]||={};mergeObject(target[key],value);}
  else target[key]=value;
 }return target;
}
export async function validateArticle(article,session){
 for(const [key,Model] of [["category",Category],["subCategory",Category],["author",Author]]){
  if(article[key]&&!await Model.exists({_id:article[key],isActive:true}).session(session||null))throw new AppError(`Choose an active ${key}`,422);
 }
 if(article.subCategory){const sub=await Category.findById(article.subCategory).session(session||null);if(String(sub.parent)!==String(article.category))throw new AppError("Subcategory must belong to the selected category",422);}
 if(article.tags?.length&&(await Tag.countDocuments({_id:{$in:article.tags},isActive:true}).session(session||null))!==new Set(article.tags.map(String)).size)throw new AppError("Choose active tags",422);
 if(article.relatedArticles?.some(id=>String(id)===String(article._id)))throw new AppError("Article cannot relate to itself",422);
 if(article.relatedArticles?.length&&(await Article.countDocuments({_id:{$in:article.relatedArticles},status:{$ne:"deleted"}}).session(session||null))!==new Set(article.relatedArticles.map(String)).size)throw new AppError("Related article not found",422);
 article.content=cleanHtml(article.content||"");
 const body=plainText(article.content).replace(/\s+/g," ").toLowerCase();
 for(const faq of article.faq||[])if(!body.includes(faq.question.toLowerCase())||!body.includes(faq.answer.toLowerCase()))throw new AppError("FAQ questions and answers must appear in article content",422);

 article.seo||={};
 article.seo.canonicalUrl=generateCanonical(article);
 if(await Article.exists({_id:{$ne:article._id},"seo.canonicalUrl":article.seo.canonicalUrl}).session(session||null))throw new AppError("Canonical URL is already used",409);
 for(const image of [article.media?.featuredImage,...(article.media?.images||[])].filter(i=>i?.url)){
  if(!image.publicId||!image.url.startsWith("https://res.cloudinary.com/"))throw new AppError("Use an uploaded Cloudinary image",422);
 }
 article.analytics||={};article.analytics.readingTime=Math.max(1,Math.ceil(body.split(/\s+/).filter(Boolean).length/220));
 if(["published","scheduled"].includes(article.status)){
  const required={title:article.title,content:body,excerpt:article.excerpt,category:article.category,"featured image":article.media?.featuredImage?.url,"image alt text":article.media?.featuredImage?.alt,"SEO title":article.seo?.metaTitle,"meta description":article.seo?.metaDescription};
  const missing=Object.keys(required).filter(key=>!required[key]);
  if(missing.length)throw new AppError(`Before publishing, add: ${missing.join(", ")}`,422);
 }
 if(article.status==="scheduled"&&(!article.scheduledAt||article.scheduledAt<=new Date()))throw new AppError("Schedule must be in the future",422);
 article.seo.robots||={};
 if(article.status!=="published"||article.visibility!=="public")article.seo.robots.index=false;
}
export async function saveArticle(req,id,input,action="UPDATE"){
 const data=articleInput.partial().parse(input);delete data.changeReason;
 return mongoose.connection.transaction(async session=>{
  const article=id?await findOwned(id,req.admin,session):new Article({createdBy:req.admin.id,status:"draft"});
  const previous=id?article.toObject():null;
  if(action==="SCHEDULE_PUBLISH"&&(article.status!=="scheduled"||article.scheduledAt>new Date()))return article;
  if(previous?.status==="deleted"&&action!=="RESTORE")throw new AppError("Restore this article before editing",409);
  if(req.admin.role==="author"&&(previous?.status==="published"||previous?.status==="scheduled"||data.status&&data.status!=="draft"))throw new AppError("Authors can edit their own drafts; publishing needs an editor",403);
  if(data.status==="published"&&!canPublish(req.admin))throw new AppError("Publishing permission required",403);
  const merged=mergeObject(article.toObject(),data);
    delete merged.structuredData;
    delete merged.seo?.openGraph;
    delete merged.seo?.twitter;
  article.set(merged);
  if(!id||data.slug&&data.slug!==previous.slug)article.slug=await uniqueSlug(Article,data.slug||data.title,article.id);
  if(previous&&article.slug!==previous.slug){
   if(await ArticleRedirect.exists({oldSlug:article.slug}).session(session))throw new AppError("This slug is reserved by a redirect",409);
   if(previous.publishedAt){
    await ArticleRedirect.updateMany({article:article.id},{$set:{newSlug:article.slug}},{session});
    await ArticleRedirect.create([{oldSlug:previous.slug,newSlug:article.slug,article:article.id}],{session});
   }
   if(!data.seo?.canonicalUrl&&previous.seo?.canonicalUrl===generateCanonical({...previous,seo:{}}))article.seo.canonicalUrl=generateCanonical({slug:article.slug,seo:{}});
  }
  article.updatedBy=req.admin.id;
  if(action==="RESTORE"){article.deletedAt=undefined;article.deletedBy=undefined;}
  if(action==="DELETE"){article.status="deleted";article.deletedAt=new Date();article.deletedBy=req.admin.id;}
  if(article.status==="published"){article.publishedAt||=new Date();article.publishedBy||=req.admin.id;if(previous?.status!=="published")article.seo.robots.index=true;}
  await validateArticle(article,session);
  if(previous){
   await ArticleRevision.create([{article:article.id,version:(previous.__v||0)+1,snapshot:previous,changedBy:req.admin.id,changeReason:input.changeReason||action}],{session});
   article.increment();
  }
  await article.save({session});
  await AuditLog.create([{action:id?action:"CREATE",entityType:"Article",entityId:article._id,performedBy:req.admin._id,previousData:previous,newData:article.toObject(),ipAddress:req.ip,userAgent:req.get("user-agent")}],{session});
  return article;
 });
}
export const createArticleData=async(data,adminId)=>({...data,slug:await uniqueSlug(Article,data.slug||data.title),createdBy:adminId,updatedBy:adminId});
export const publishedArticleQuery=(filter={})=>Article.find({...filter,status:"published",visibility:"public",deletedAt:null});
