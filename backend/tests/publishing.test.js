import {test} from "node:test";
import assert from "node:assert/strict";
import Article from "../src/models/Article.js";
import Category from "../src/models/Category.js";
import Author from "../src/models/Author.js";
import {validateArticle} from "../src/services/article.service.js";
import {articleInput} from "../src/validators/article.validator.js";
import {blankArticle,toPayload} from "../../admin/src/lib/article-form.mjs";

test("publish and schedule with optional author and source fields",async t=>{
 t.mock.method(Category,"exists",()=>({session:async()=>true}));
 t.mock.method(Author,"exists",()=>({session:async()=>true}));
 t.mock.method(Article,"exists",()=>({session:async()=>false}));
 for(const status of ["published","scheduled"]){
  for(const source of [undefined,{type:"",name:"",url:"",attributionText:""},{type:"publication"},{url:"https://example.com"}]){
   const article=new Article({title:"Story",slug:"story",content:"<p>Article content.</p>",excerpt:"Summary",category:"507f1f77bcf86cd799439011",status,scheduledAt:new Date(Date.now()+60000),source,media:{featuredImage:{url:"https://res.cloudinary.com/demo/image/upload/sample.jpg",publicId:"trendsduniya/articles/example",alt:"Example"}},seo:{metaTitle:"Story",metaDescription:"Summary"}});
   await validateArticle(article);
   await article.validate();
  }
 }
});

test("optional inputs round trip and supplied invalid URLs are rejected",()=>{
 const form=blankArticle();form.title="Story";
 form.internalLinks=[{title:"",url:"",anchorText:""}];
 const payload=toPayload(form);
 assert.equal(articleInput.parse(payload).author,null);
 assert.deepEqual(payload.internalLinks,[]);
 assert.equal(payload.source.type,"");
 form.source.name="Named source";
 assert.equal(articleInput.parse(toPayload(form)).source.name,"Named source");
 form.source.url="javascript:alert(1)";
 assert.throws(()=>articleInput.parse(toPayload(form)));
});
