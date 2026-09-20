import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {MongoMemoryReplSet} from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import Article from "../src/models/Article.js";
import * as models from "../src/models/index.js";
import AuthSession from "../src/models/AuthSession.js";
import {blankArticle,fromArticle,toPayload,unicodeSlug} from "../../admin/src/lib/article-form.mjs";
import {cleanHtml} from "../src/utils/sanitize.js";
import env from "../src/config/env.js";
import {randomUUID} from "node:crypto";
import dns from "node:dns";
import { mongoConnectionOptions } from "../src/config/dns.js";
import {publishDueArticles} from "../src/services/scheduler.service.js";
let db,token,authorToken,editorToken,category,author,tag,articleId,slug;
const auth=(req,t=token)=>req.set("Authorization","Bearer "+t);
before(async()=>{
 try {
 if(process.env.CMS_TEST_USE_CONFIGURED_MONGODB==="1"){
  if(env.mongoDnsServers.length)dns.setServers(env.mongoDnsServers);
  await mongoose.connect(env.mongoUri,{...mongoConnectionOptions(),dbName:"td_test_"+randomUUID().replaceAll("-","").slice(0,24)});
 }else{
  db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:"7.0.14"}});
  await mongoose.connect(db.getUri());
 }
 for(const Model of [...Object.values(models),AuthSession])await Model.init();
 for(const [role,email]of [["superadmin","cms-admin@example.test"],["author","cms-author@example.test"],["editor","cms-editor@example.test"]])await Admin.create({name:"Integration "+role,email,password:"Integration-password-123",role});
 const login=async email=>(await request(app).post("/api/auth/login").send({email,password:"Integration-password-123"})).body.data.accessToken;
 token=await login("cms-admin@example.test");authorToken=await login("cms-author@example.test");editorToken=await login("cms-editor@example.test");
 } catch (error) { console.error("Integration setup failed:",error.name,error.message); throw error; }
}, {timeout:180000});
after(async()=>{if(mongoose.connection.readyState===1&&/^td_test_[a-f0-9]{24}$/.test(mongoose.connection.name))await mongoose.connection.dropDatabase();await mongoose.disconnect();await db?.stop();});
test("login, unauthorized access, refresh rotation and logout",async()=>{
 assert.equal((await request(app).get("/api/admin/articles")).status,401);
 assert.equal((await request(app).post("/api/auth/login").send({email:"cms-admin@example.test",password:"bad"})).status,401);
 const login=await request(app).post("/api/auth/login").send({email:"cms-admin@example.test",password:"Integration-password-123"});
 assert.equal(login.status,200);assert.equal(login.body.data.admin.password,undefined);
 const refresh=await request(app).post("/api/auth/refresh").send({refreshToken:login.body.data.refreshToken});
 assert.equal(refresh.status,200);
 assert.equal((await request(app).post("/api/auth/refresh").send({refreshToken:login.body.data.refreshToken})).status,401);
 assert.equal((await auth(request(app).post("/api/auth/logout"),refresh.body.data.accessToken)).status,200);
 assert.equal((await auth(request(app).get("/api/auth/me"),refresh.body.data.accessToken)).status,401);
});
test("create taxonomy and enforce role permissions",async()=>{
 const cat=await auth(request(app).post("/api/admin/categories")).send({name:"Technology",description:"Technology reporting"});
 assert.equal(cat.status,201,JSON.stringify(cat.body));category=cat.body.data._id;
 const a=await auth(request(app).post("/api/admin/authors")).send({name:"Test Reporter",bio:"Integration test author"});assert.equal(a.status,201);author=a.body.data._id;
 const t=await auth(request(app).post("/api/admin/tags")).send({name:"Science"});assert.equal(t.status,201);tag=t.body.data._id;
 assert.equal((await auth(request(app).post("/api/admin/categories"),editorToken).send({name:"Forbidden"})).status,403);
 assert.equal((await auth(request(app).put("/api/admin/categories/"+category)).send({parent:category})).status,422);
});
test("title-only draft works and unknown management fields are rejected",async()=>{
 const form=blankArticle();form.title="भारत में नई तकनीक";form.category=category;form.author=author;
 const r=await auth(request(app).post("/api/admin/articles")).send({...toPayload(form),status:"draft"});
 assert.equal(r.status,201,JSON.stringify(r.body));articleId=r.body.data._id;slug=r.body.data.slug;
 assert.ok(slug.includes("भारत"));assert.equal((await request(app).get("/api/articles/"+encodeURIComponent(slug))).status,404);
 assert.equal((await auth(request(app).patch("/api/admin/articles/"+articleId)).send({analytics:{views:9000}})).status,422);
 assert.equal((await auth(request(app).post("/api/admin/articles/"+articleId+"/publish"))).status,422);
});
test("public filters never leak drafts and author cannot access another writer",async()=>{
 const publicList=await request(app).get("/api/articles?status=draft");assert.equal(publicList.status,200);assert.equal(publicList.body.data.length,0);
 assert.equal((await auth(request(app).get("/api/admin/articles/"+articleId),authorToken)).status,403);
 assert.equal((await auth(request(app).patch("/api/admin/articles/"+articleId),authorToken).send({title:"Changed"})).status,403);
 assert.equal((await auth(request(app).delete("/api/admin/articles/"+articleId),editorToken)).status,403);
});
test("save complete article, sanitization, publish and public SEO contract",async()=>{
 const form=blankArticle();Object.assign(form,{title:"भारत में नई तकनीक",slug,category,author,tags:[tag],content:'<p>Verified reporting about technology and science.</p><img src=x onerror=alert(1)><script>alert(1)</script>',excerpt:"A concise report on technology.",media:{featuredImage:{url:"https://res.cloudinary.com/demo/image/upload/sample.jpg",publicId:"trendsduniya/articles/integration-image",alt:"Technology illustration"},images:[]}});
 form.seo.metaTitle="Technology report";form.seo.metaDescription="An integration test of publishing.";form.seo.relatedKeywords=["Science","science"];
 const update=await auth(request(app).patch("/api/admin/articles/"+articleId)).send(toPayload(form));
 assert.equal(update.status,200,JSON.stringify(update.body));assert.ok(!update.body.data.content.includes("onerror"));assert.ok(!update.body.data.content.includes("<script"));
 assert.equal(update.body.data.seo.relatedKeywords.length,1);
 const publish=await auth(request(app).post("/api/admin/articles/"+articleId+"/publish"));
 assert.equal(publish.status,200,JSON.stringify(publish.body));
 const pub=await request(app).get("/api/articles/"+encodeURIComponent(slug));
 assert.equal(pub.status,200);assert.equal(pub.body.data.id,articleId);assert.ok(pub.body.data.seo.canonicalUrl.includes("/article/"));assert.equal(pub.body.data.createdBy,undefined);assert.equal(pub.body.data.analytics,undefined);assert.equal(pub.body.data.author.name,"Test Reporter");assert.equal(pub.body.data.schema.article.type,"Article");
});
test("search, taxonomy filter, malformed IDs, private protection",async()=>{
 const search=await request(app).get("/api/articles/search?q=technology");assert.equal(search.status,200);assert.equal(search.body.data.length,1);
 const filtered=await request(app).get("/api/articles/category/technology");assert.equal(filtered.status,200);assert.equal(filtered.body.data.length,1);
 assert.equal((await auth(request(app).get("/api/admin/articles/invalid"))).status,422);
 await auth(request(app).patch("/api/admin/articles/"+articleId)).send({visibility:"private"});
 assert.equal((await request(app).get("/api/articles/"+encodeURIComponent(slug))).status,404);
 assert.equal((await request(app).get("/api/articles?status=published")).body.data.length,0);
 await auth(request(app).patch("/api/admin/articles/"+articleId)).send({visibility:"public"});
});
test("stable slug on title edit, slug redirect and revisions",async()=>{
 const edit=await auth(request(app).patch("/api/admin/articles/"+articleId)).send({title:"A different title"});
 assert.equal(edit.status,200,JSON.stringify(edit.body));assert.equal(edit.body.data.slug,slug);
 const changed=await auth(request(app).patch("/api/admin/articles/"+articleId)).send({slug:"updated-technology"});
 assert.equal(changed.status,200,JSON.stringify(changed.body));
 const redirect=await request(app).get("/api/articles/"+encodeURIComponent(slug));assert.equal(redirect.status,301);
 slug="updated-technology";
 const revisions=await auth(request(app).get("/api/admin/articles/"+articleId+"/revisions"));assert.ok(revisions.body.data.length>0);
 const revision=revisions.body.data[0];const restore=await auth(request(app).post("/api/admin/articles/"+articleId+"/revisions/"+revision._id+"/restore"));
 assert.equal(restore.status,200,JSON.stringify(restore.body));assert.equal(restore.body.data.status,"draft");
});
test("duplicate clears publishing metadata and canonical and has unique slug",async()=>{
 const dup=await auth(request(app).post("/api/admin/articles/"+articleId+"/duplicate"));
 assert.equal(dup.status,201,JSON.stringify(dup.body));assert.equal(dup.body.data.status,"draft");assert.equal(dup.body.data.publishedAt,undefined);assert.notEqual(dup.body.data.slug,slug);
 const again=await auth(request(app).post("/api/admin/articles/"+articleId+"/duplicate"));assert.equal(again.status,201);assert.notEqual(again.body.data.slug,dup.body.data.slug);
});
test("schedule validation, unpublish, archive, soft delete and restore",async()=>{
 assert.equal((await auth(request(app).patch("/api/admin/articles/"+articleId)).send({status:"scheduled",scheduledAt:"2020-01-01T00:00:00.000Z"})).status,422);
 const scheduled=await auth(request(app).patch("/api/admin/articles/"+articleId)).send({status:"scheduled",scheduledAt:new Date(Date.now()+86400000).toISOString()});
 assert.equal(scheduled.status,200,JSON.stringify(scheduled.body));
 assert.equal((await auth(request(app).post("/api/admin/articles/"+articleId+"/publish"))).status,200);
 assert.equal((await auth(request(app).post("/api/admin/articles/"+articleId+"/unpublish"))).body.data.status,"draft");
 assert.equal((await auth(request(app).post("/api/admin/articles/"+articleId+"/archive"))).body.data.status,"archived");
 assert.equal((await auth(request(app).delete("/api/admin/articles/"+articleId))).body.data.status,"deleted");
 assert.equal((await auth(request(app).post("/api/admin/articles/"+articleId+"/restore"),editorToken)).status,403);
 const restored=await auth(request(app).post("/api/admin/articles/"+articleId+"/restore"));assert.equal(restored.status,200);assert.equal(restored.body.data.status,"draft");assert.equal(restored.body.data.deletedAt,undefined);
});
test("permanent delete requires separate explicit confirmation and trash status",async()=>{
 assert.equal((await auth(request(app).delete("/api/admin/articles/"+articleId+"/permanent"))).status,422);
 assert.equal((await auth(request(app).delete("/api/admin/articles/"+articleId+"/permanent")).send({confirmation:"PERMANENTLY DELETE"})).status,409);
 const draft=await auth(request(app).post("/api/admin/articles")).send({title:"Disposable integration draft"});
 assert.equal(draft.status,201,JSON.stringify(draft.body));const id=draft.body.data._id;
 await auth(request(app).delete("/api/admin/articles/"+id));
 assert.equal((await auth(request(app).delete("/api/admin/articles/"+id+"/permanent")).send({confirmation:"PERMANENTLY DELETE"})).status,200);
 assert.equal(await Article.findById(id),null);
});
test("upload rejects non-images and dashboard provides actual aggregates",async()=>{
 const upload=await auth(request(app).post("/api/admin/upload/image")).attach("image",Buffer.from("not an image"),{filename:"unsafe.txt",contentType:"text/plain"});
 assert.ok([400,422].includes(upload.status),JSON.stringify(upload.body));
 const disguised=await auth(request(app).post("/api/admin/upload/image")).attach("image",Buffer.from('<script>bad</script>'),{filename:"fake.png",contentType:"image/png"});
 assert.equal(disguised.status,422);
 const imagePath='/api/admin/upload/image/'+encodeURIComponent('trendsduniya/articles/integration-image');
 assert.equal((await auth(request(app).delete(imagePath),authorToken)).status,403);
 assert.equal((await auth(request(app).delete(imagePath))).status,409);
 const dash=await auth(request(app).get("/api/admin/dashboard"));assert.equal(dash.status,200);assert.ok(dash.body.data.totalArticles>=1);assert.ok(Array.isArray(dash.body.data.recentArticles));
});
test("scheduler publishes due eligible articles once and leaves future schedules alone",async()=>{
 const future=new Date(Date.now()+86400000).toISOString();
 const scheduled=await auth(request(app).patch('/api/admin/articles/'+articleId)).send({status:'scheduled',scheduledAt:future});
 assert.equal(scheduled.status,200);
 await publishDueArticles();assert.equal((await Article.findById(articleId)).status,'scheduled');
 await Article.updateOne({_id:articleId},{$set:{scheduledAt:new Date(Date.now()-1000)}});
 await Promise.all([publishDueArticles(),publishDueArticles()]);
 const published=await Article.findById(articleId);assert.equal(published.status,'published');
 const version=published.__v;await publishDueArticles();assert.equal((await Article.findById(articleId)).__v,version);
});
test("editor serialization preserves data and excludes database subdocument IDs",()=>{
 const a={...blankArticle(),_id:"abc",category:{_id:category},author:{_id:author},tags:[{_id:tag}],media:{featuredImage:{url:"https://example.test/image.jpg",publicId:"asset",alt:"Alt",_id:"nested"},images:[]}};
 const payload=toPayload(fromArticle(a));assert.equal(payload.category,category);assert.deepEqual(payload.tags,[tag]);assert.equal(payload.media.featuredImage._id,undefined);assert.ok(unicodeSlug("भारत की खबर").includes("भारत"));
 assert.ok(!cleanHtml('<iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">link</a>').includes("javascript:"));
});

