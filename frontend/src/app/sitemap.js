import {getPublic,SITE_URL} from "../lib/api";
export const dynamic="force-dynamic";
export default async function sitemap(){
 const pages=[{url:SITE_URL,changeFrequency:"daily",priority:1},{url:SITE_URL+"/latest",changeFrequency:"daily",priority:.9},{url:SITE_URL+"/categories",changeFrequency:"weekly",priority:.7},{url:SITE_URL+"/about",changeFrequency:"monthly",priority:.4}];
 let page=1,more=true;
 while(more){
  const result=await getPublic(`/articles?limit=100&page=${page}`);
  pages.push(...result.data.filter(a=>a.seo?.robots?.index!==false&&new URL(a.seo?.canonicalUrl||SITE_URL).origin===new URL(SITE_URL).origin).map(a=>({url:a.seo?.canonicalUrl||SITE_URL+"/article/"+encodeURIComponent(a.slug),lastModified:a.updatedAt||a.publishedAt,changeFrequency:"weekly",priority:.8})));
  more=result.pagination?.hasNextPage&&pages.length<49900;page++;
 }
 return pages;
}

