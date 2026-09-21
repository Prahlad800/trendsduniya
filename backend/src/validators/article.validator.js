import { z } from "zod";
import env from "../config/env.js";
const text=(max=1000)=>z.string().trim().max(max);
const id=z.string().regex(/^[a-f0-9]{24}$/i,"Invalid selection ID");
const url=z.string().max(2048).refine(v=>{try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}},"Enter an HTTP(S) URL");
const optionalUrl=z.union([url,z.literal("")]).optional();
const image=z.object({url,publicId:z.string().regex(/^trendsduniya\/articles\/[\w-]+$/),width:z.number().optional(),height:z.number().optional(),bytes:z.number().optional(),format:text(20).optional(),alt:text(500).optional(),caption:text(2000).optional()}).strict();
const internal=z.string().refine(v=>{try{return !/[\\\s]/.test(v)&&new URL(v,env.siteUrl).origin===new URL(env.siteUrl).origin;}catch{return false;}},"Use a link on your website");
const link={title:text(300).optional(),anchorText:text(300).optional()};
const keywords=z.array(text(150).min(1)).max(50).transform(v=>[...new Map(v.map(s=>[s.toLowerCase(),s])).values()]);
export const articleInput=z.object({
 title:text(300).min(1),slug:text(180).regex(/^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u).optional(),excerpt:text(2000).optional(),content:z.string().max(500000).optional(),summary:text(5000).optional(),
 category:id.nullable().optional(),subCategory:id.nullable().optional(),author:id.nullable().optional(),tags:z.array(id).max(50).optional(),relatedArticles:z.array(id).max(30).optional(),
 articleType:z.enum(["article","news","opinion","analysis","guide","tutorial","review","interview","press_release"]).optional(),language:z.enum(["en-IN","hi-IN","en","hi"]).optional(),articleSection:text(200).optional(),trendingTopic:text(200).optional(),
 status:z.enum(["draft","published","scheduled","archived"]).optional(),visibility:z.enum(["public","private"]).optional(),scheduledAt:z.string().datetime({offset:true}).nullable().optional(),
 media:z.object({featuredImage:image.nullable().optional(),images:z.array(image).max(30).optional()}).strict().optional(),
 seo:z.object({searchIntent:z.enum(["informational","navigational","commercial","transactional","news"]).optional(),searchIntentDescription:text(2000).optional(),primaryKeyword:text(200).optional(),relatedKeywords:keywords.optional(),relatedTopics:keywords.optional(),metaTitle:text(300).optional(),metaDescription:text().optional(),canonicalUrl:optionalUrl,
 robots:z.object({index:z.boolean().optional(),follow:z.boolean().optional(),maxSnippet:z.number().int().min(-1).optional(),maxImagePreview:z.enum(["none","standard","large"]).optional(),maxVideoPreview:z.number().int().min(-1).optional()}).strict().optional(),
}).strict().optional(),
 faq:z.array(z.object({question:text(1000).min(1),answer:text(5000).min(1)}).strict()).max(30).optional(),
 source:z.object({name:text(300).optional(),url:optionalUrl,type:z.enum(["","original","agency","official","publication","government","research","other"]).optional(),publishedAt:z.string().datetime({offset:true}).optional(),attributionText:text(3000).optional()}).strict().optional(),
 originalData:z.object({hasOriginalReporting:z.boolean().optional(),hasOriginalAnalysis:z.boolean().optional(),hasOriginalResearch:z.boolean().optional(),hasOriginalImages:z.boolean().optional(),notes:text(5000).optional()}).strict().optional(),
 internalLinks:z.array(z.object({...link,url:internal}).strict()).max(100).optional(),externalLinks:z.array(z.object({...link,url,rel:z.enum(["nofollow","sponsored","ugc","noopener noreferrer",""]).optional()}).strict()).max(100).optional(),
 changeReason:text(1000).optional(),
}).strict();
export const articleValidator=(req,res,next)=>{
 try{req.body=(req.method==="POST"?articleInput:articleInput.partial()).parse(req.body);next();}catch(e){e.statusCode=422;e.message="Please check the article fields";e.errors=e.issues;next(e);}
};

