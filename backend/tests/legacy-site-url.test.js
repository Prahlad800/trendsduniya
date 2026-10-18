import {test} from "node:test";
import assert from "node:assert/strict";
import env from "../src/config/env.js";
import {articleInput} from "../src/validators/article.validator.js";
test("repairs known malformed site URLs while preserving link restrictions",()=>{
 const originalSite=env.siteUrl,originalCors=env.corsOrigins;
 try{
  env.siteUrl="http://localhost:3000";env.corsOrigins=["https://trendsduniya.vercel.app"];
  const broken="http://localhost:3000,https://trendsduniya.vercel.app/article/story";
  const result=articleInput.parse({title:"Story",seo:{canonicalUrl:broken},internalLinks:[{url:broken}]});
  assert.equal(result.seo.canonicalUrl,"http://localhost:3000/article/story");
  assert.equal(result.internalLinks[0].url,"http://localhost:3000/article/story");
  for(const url of ["https://external.test/story","http://localhost:3000,https://external.test/story"])
   assert.equal(articleInput.safeParse({title:"Story",internalLinks:[{url}]}).success,false);
  assert.equal(articleInput.safeParse({title:"Story",seo:{canonicalUrl:"https://external.test/a,b"}}).success,true);
 }finally{env.siteUrl=originalSite;env.corsOrigins=originalCors;}
});
