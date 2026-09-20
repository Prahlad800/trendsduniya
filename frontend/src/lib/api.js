import {cache} from "react";
export const API_URL=(process.env.API_URL||process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api").replace(/\/$/,"");
export const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
export class ApiError extends Error{constructor(message,status){super(message);this.status=status;}}
export async function getPublic(path){
 let response;
 try{response=await fetch(API_URL+path,{cache:"no-store",signal:AbortSignal.timeout(10000)});}catch{throw new ApiError("We’re having trouble reaching the newsroom. Please try again shortly.",503);}
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new ApiError(payload.message||"Unable to load this page",response.status);
 return payload;
}
export const getArticle=cache(async slug=>{
 try{return (await getPublic("/articles/"+encodeURIComponent(slug))).data;}catch(error){if(error.status===404)return null;throw error;}
});
export const articleImage=a=>a.featuredImage||a.media?.featuredImage;
export const articleId=a=>a.id||a._id;
export const formatDate=value=>value?new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value)):"";

