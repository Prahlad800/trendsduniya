import env from "../config/env.js";
import { cleanHtml } from "../utils/sanitize.js";
export const generateCanonical=a=>a.seo?.canonicalUrl||`${env.siteUrl}/article/${encodeURIComponent(a.slug)}`;
export const generateMetaTitle=a=>a.seo?.metaTitle||a.title;
export const generateMetaDescription=a=>a.seo?.metaDescription||a.excerpt;
export const generateOpenGraph=a=>({title:generateMetaTitle(a),description:generateMetaDescription(a),image:a.media?.featuredImage?.url,imageAlt:a.media?.featuredImage?.alt,url:generateCanonical(a),type:"article",siteName:"TrendsDuniya",...a.seo?.openGraph});
export const generateTwitterCard=a=>({card:"summary_large_image",title:generateMetaTitle(a),description:generateMetaDescription(a),image:a.media?.featuredImage?.url,imageAlt:a.media?.featuredImage?.alt,...a.seo?.twitter});
export const generateArticleSchema=a=>({enabled:true,type:a.articleType==="news"?"NewsArticle":"Article",headline:a.title,description:a.excerpt,image:a.media?.featuredImage?.url,author:a.author?{name:a.author.name,url:`${env.siteUrl}/authors/${a.author.slug}`}:undefined,publisher:{name:"TrendsDuniya",url:env.siteUrl},datePublished:a.publishedAt,dateModified:a.updatedAt,mainEntityOfPage:generateCanonical(a)});
export const generateBreadcrumbSchema=a=>({enabled:true,items:[{name:"Home",url:"/"},...(a.category?[{name:a.category.name,url:`/categories/${a.category.slug}`}]:[]),{name:a.title,url:`/article/${a.slug}`}]});
export const seoResponse=article=>{
  const a=typeof article.toObject==="function"?article.toObject():article;
  const fields=["title","slug","excerpt","content","summary","articleType","language","articleSection","media","author","category","subCategory","tags","publishedAt","updatedAt","source","internalLinks","externalLinks","relatedArticles","faq"];
  const result=Object.fromEntries(fields.map(key=>[key,a[key]]));
  result.content=cleanHtml(a.content||"");
  return {...result,id:String(a._id),_id:a._id,featuredImage:a.media?.featuredImage,publicUrl:generateCanonical(a),readingTime:a.analytics?.readingTime||1,seo:{...a.seo,metaTitle:generateMetaTitle(a),metaDescription:generateMetaDescription(a),canonicalUrl:generateCanonical(a),openGraph:generateOpenGraph(a),twitter:generateTwitterCard(a)},schema:{article:generateArticleSchema(a),breadcrumb:generateBreadcrumbSchema(a)}};
};
