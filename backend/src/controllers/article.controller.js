import mongoose from "mongoose";
import Article from "../models/Article.js";
import ArticleRevision from "../models/ArticleRevision.js";
import ArticleRedirect from "../models/ArticleRedirect.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Author from "../models/Author.js";
import { AppError,success } from "../utils/apiResponse.js";
import {getPagination,pagination} from "../utils/pagination.js";
import {seoResponse} from "../services/seo.service.js";
import {saveArticle,findOwned} from "../services/article.service.js";
import {deleteImage} from "../services/cloudinary.service.js";
import {audit} from "../services/audit.service.js";
import {cleanHtml} from "../utils/sanitize.js";
const populate=q=>q.populate("author","name slug bio avatar designation").populate("category","name slug").populate("subCategory","name slug").populate("tags","name slug").populate({path:"relatedArticles",match:{status:"published",visibility:"public",deletedAt:null},select:"title slug excerpt media publishedAt"});
const publicFilter={status:"published",visibility:"public",deletedAt:null};
export async function buildFilter(query,isAdmin=false,admin,taxonomy){
 const filter=isAdmin?{}:{...publicFilter};
 if(isAdmin&&query.status){if(!["draft","published","scheduled","archived","deleted"].includes(query.status))throw new AppError("Invalid status",422);filter.status=query.status;}
 if(isAdmin&&admin.role==="author")filter.createdBy=admin.id;
 for(const [key,Model] of [["category",Category],["author",Author],["tag",Tag]]){
  if(query[key]){
   if(typeof query[key]!=="string")throw new AppError("Invalid filter",422);
   const value=mongoose.isValidObjectId(query[key])?query[key]:(await Model.findOne({slug:query[key]}).select("_id"))?._id;
   filter[key==="tag"?"tags":key]=value||new mongoose.Types.ObjectId();
  }
 }
 if(taxonomy)filter[taxonomy.field]=taxonomy.id;
 const search=query.search||query.q;
 if(search){if(typeof search!=="string"||search.length>200)throw new AppError("Search must be under 200 characters",422);filter.$text={$search:search};}
 return filter;
}
async function list(req,res,isAdmin=false){
 const {page,limit,skip}=getPagination(req.query);
 const filter=await buildFilter(req.query,isAdmin,req.admin,req.taxonomy);
 const sort=req.query.sort||(isAdmin?"-createdAt":"-publishedAt");
 if(!/^-?(createdAt|updatedAt|publishedAt|title|analytics.views)$/.test(sort))throw new AppError("Invalid sort",422);
 const [items,total]=await Promise.all([populate(Article.find(filter).sort(sort).skip(skip).limit(limit)).lean(),Article.countDocuments(filter)]);
 success(res,isAdmin?items:items.map(seoResponse),"Articles loaded",200,pagination(page,limit,total));
}
export const listArticles=(req,res)=>list(req,res);
export const search=listArticles;
export const adminArticles=(req,res)=>list(req,res,true);
export const getPublicArticle=async(req,res)=>{
 const article=await populate(Article.findOne({...publicFilter,slug:req.params.slug})).lean();
 if(!article){
  const redirect=await ArticleRedirect.findOne({oldSlug:req.params.slug});
  if(redirect&&await Article.exists({_id:redirect.article,...publicFilter}))return res.redirect(301,`/api/articles/${encodeURIComponent(redirect.newSlug)}`);
  throw new AppError("Article not found",404);
 }
 success(res,seoResponse(article));
};
export const getArticlesByTaxonomy=(field,Model)=>async(req,res)=>{
 const entity=await Model.findOne({slug:req.params.slug,isActive:true}).select("_id");
 if(!entity)throw new AppError("Resource not found",404);
 req.taxonomy={field:field==="tag"?"tags":field,id:entity._id};return list(req,res);
};
export const getRelatedArticles=async(req,res)=>{
 const article=await Article.findOne({slug:req.params.slug,...publicFilter});
 if(!article)throw new AppError("Article not found",404);
 const related=await populate(Article.find({...publicFilter,_id:{$ne:article.id},$or:[{_id:{$in:article.relatedArticles}},{category:article.category},{tags:{$in:article.tags}}]}).sort("-publishedAt").limit(6)).lean();
 success(res,related.map(seoResponse));
};
export const getAdminArticle=async(req,res)=>{await findOwned(req.params.id,req.admin);const article=await populate(Article.findById(req.params.id)).lean();article.content=cleanHtml(article.content||"");success(res,article);};
export const createArticle=async(req,res)=>success(res,await saveArticle(req,null,req.body),"Article created",201);
export const updateArticle=async(req,res)=>success(res,await saveArticle(req,req.params.id,req.body),"Article saved");
export const publishArticle=async(req,res)=>success(res,await saveArticle(req,req.params.id,{status:"published"},"PUBLISH"),"Article published");
export const changeStatus=(status,action)=>async(req,res)=>success(res,await saveArticle(req,req.params.id,{status},action),action==="ARCHIVE"?"Article archived":"Article moved to draft");
export const softDelete=async(req,res)=>success(res,await saveArticle(req,req.params.id,{},"DELETE"),"Article moved to trash");
export const restore=async(req,res)=>{
 const article=await findOwned(req.params.id,req.admin);
 if(article.status!=="deleted")throw new AppError("Only deleted articles can be restored",409);
 success(res,await saveArticle(req,req.params.id,{status:"draft"},"RESTORE"),"Article restored as draft");
};
export const permanentDelete=async(req,res)=>{
 if(req.body?.confirmation!=="PERMANENTLY DELETE")throw new AppError('Type PERMANENTLY DELETE to confirm',422);
 const article=await findOwned(req.params.id,req.admin);
 if(article.status!=="deleted")throw new AppError("Move the article to trash first",409);
 const ids=[article.media?.featuredImage?.publicId,...article.media.images.map(i=>i.publicId)].filter(Boolean);
 for(const publicId of new Set(ids)){
  const shared=await Article.exists({_id:{$ne:article._id},$or:[{"media.featuredImage.publicId":publicId},{"media.images.publicId":publicId}]});
  if(!shared&&!await Author.exists({avatarPublicId:publicId}))await deleteImage(publicId);
 }
 await mongoose.connection.transaction(async session=>{
  await ArticleRevision.deleteMany({article:article.id},{session});
  await ArticleRedirect.deleteMany({article:article.id},{session});
  await Article.deleteOne({_id:article.id,status:"deleted"},{session});
 });
 await audit(req,"PERMANENT_DELETE",article);
 success(res,null,"Article permanently deleted");
};
export const duplicate=async(req,res)=>{
 const source=(await findOwned(req.params.id,req.admin)).toObject();
 const keys=["title","excerpt","content","summary","articleType","language","category","subCategory","author","tags","media","seo","faq","source","originalData","internalLinks","externalLinks","relatedArticles","visibility"];
 const data=JSON.parse(JSON.stringify(Object.fromEntries(keys.filter(k=>source[k]!==undefined).map(k=>[k,source[k]]))));
 const stripIds=v=>{if(Array.isArray(v))return v.map(stripIds);if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).filter(([k])=>k!=="_id").map(([k,val])=>[k,stripIds(val)]));return v;};
 const input=stripIds(data);input.title+=" Copy";input.status="draft";input.seo.canonicalUrl="";input.seo.robots.index=false;
 success(res,await saveArticle(req,null,input),"Draft copy created",201);
};
export const revisions=async(req,res)=>{await findOwned(req.params.id,req.admin);success(res,await ArticleRevision.find({article:req.params.id}).select("-snapshot").sort("-version").limit(100));};
export const getRevision=async(req,res)=>{
 await findOwned(req.params.id,req.admin);const rev=await ArticleRevision.findOne({_id:req.params.revisionId,article:req.params.id});if(!rev)throw new AppError("Revision not found",404);success(res,rev);
};
export const restoreRevision=async(req,res)=>{
 await findOwned(req.params.id,req.admin);const revision=await ArticleRevision.findOne({_id:req.params.revisionId,article:req.params.id});if(!revision)throw new AppError("Revision not found",404);
 const a=revision.snapshot;
 success(res,await saveArticle(req,req.params.id,{title:a.title,content:a.content,excerpt:a.excerpt,summary:a.summary,seo:a.seo,status:"draft",changeReason:`Restored revision ${revision.version}`},"RESTORE_REVISION"),"Revision restored as draft");
};
export const view=async(req,res)=>{
 const article=await Article.findOneAndUpdate({_id:req.params.id,...publicFilter},{$inc:{"analytics.views":1}},{new:true}).select("analytics");
 if(!article)throw new AppError("Article not found",404);success(res,null,"View recorded");
};
