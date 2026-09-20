import Article from "../models/Article.js";
import { generateCanonical } from "./seo.service.js";
import { xmlEscape } from "../utils/sanitize.js";
export const generateArticleSitemap=async()=>{
  const articles=await Article.find({status:"published",visibility:"public",deletedAt:null,"seo.robots.index":{$ne:false}}).select("slug updatedAt seo.canonicalUrl").limit(50000).lean();
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${articles.map(a=>`<url><loc>${xmlEscape(generateCanonical(a))}</loc><lastmod>${a.updatedAt.toISOString()}</lastmod></url>`).join("")}</urlset>`;
};

