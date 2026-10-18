import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {MongoMemoryReplSet} from "mongodb-memory-server";
import request from "supertest";
import env from "../src/config/env.js";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import Article from "../src/models/Article.js";
import Category from "../src/models/Category.js";
import cloudinary from "../src/config/cloudinary.js";
import {AutomationTask,AutomationSettings} from "../src/models/Automation.js";
import {getSettings,tickAutomation,approveTask,withWorkerLock,research} from "../src/services/automation/automation.service.js";
import {trendProviders} from "../src/services/trending/providers/index.js";
import {slotDate,dayInZone,fingerprint,assertReady} from "../src/services/automation/policy.js";
import {providerJson,generateImage} from "../src/services/automation/providers.js";
import {saveArticle} from "../src/services/article.service.js";
let db,admin,category,token;
before(async()=>{
 db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:"7.0.14"}});await mongoose.connect(db.getUri());
 await Promise.all([Article.init(),AutomationTask.init(),AutomationSettings.init()]);
 admin=await Admin.create({name:"Automation Editor",email:"automation@example.test",password:"Strong-password-123",role:"superadmin"});
 category=await Category.create({name:"Science",slug:"science"});
 const login=await request(app).post("/api/auth/login").send({email:admin.email,password:"Strong-password-123"});token=login.body.data.accessToken;
}, {timeout:180000});
after(async()=>{await mongoose.disconnect();await db?.stop();});
test("Kolkata's five slots and UTC rollover are exact",()=>{
 const expected=["00:30","06:30","13:30","15:30","17:30"];
 ["06:00","12:00","19:00","21:00","23:00"].forEach((t,i)=>assert.equal(slotDate("2026-10-16",t,"Asia/Kolkata").toISOString(),`2026-10-16T${expected[i]}:00.000Z`));
 assert.equal(dayInZone(new Date("2026-10-15T20:00:00Z")),"2026-10-16");
});
test("automation auth, secret rejection and configuration validation",async()=>{
 assert.equal((await request(app).get("/api/admin/automation")).status,401);
 const auth=r=>r.set("Authorization",`Bearer ${token}`);
 assert.equal((await auth(request(app).put("/api/admin/automation/settings")).send({GROQ_API_KEY:"never-store-me"})).status,422);
 assert.equal((await auth(request(app).put("/api/admin/automation/settings")).send({textModel:"database-override"})).status,422);
 assert.equal((await auth(request(app).put("/api/admin/automation/settings")).send({slots:["06:00","06:00","19:00","21:00","23:00"]})).status,422);
 const response=await auth(request(app).get("/api/admin/automation"));assert.equal(response.status,200);assert.equal(response.body.data.settings.leaseToken,undefined);assert.equal(response.body.data.settings.textModel,env.groq.model);
 assert.equal((await request(app).post("/api/internal/jobs/automation")).status,401);
});
test("provider failures redact credentials, classify quotas and validate image bytes",async t=>{
 t.mock.method(globalThis,"fetch",async()=>new Response('{"secret":"do-not-expose"}',{status:429,headers:{"retry-after":"45"}}));
 await assert.rejects(providerJson("Groq","https://example.test",{},"private-key"),e=>e.retryable&&e.retryAfter===45000&&!e.message.includes("private-key")&&!e.message.includes("do-not-expose"));
 process.env.CLOUDFLARE_ACCOUNT_ID="a".repeat(32);process.env.CLOUDFLARE_API_TOKEN="test";
 t.mock.method(globalThis,"fetch",async()=>Response.json({result:{image:Buffer.from("not an image").toString("base64")}}));
 await assert.rejects(generateImage("test",{imageModel:"@cf/black-forest-labs/flux-1-schnell"}),/format/);
});
test("durable generation checkpoints, review, pause and exactly-once publish",async t=>{
 env.groq={apiKey:"test",model:"test-model"};
 const settings=await getSettings();settings.enabled=true;settings.researchDay=dayInZone();await settings.save();
 await AutomationSettings.collection.updateOne({_id:"main"},{$set:{textModel:"obsolete-persisted-model"}});
 let images=0;
 const draft={title:"Verified science update",excerpt:"A verified update",summary:"A carefully verified science update.",content:"<h2>Introduction</h2><p>A research team published the findings described in the supplied evidence.</p>",seo:{metaTitle:"Science update",metaDescription:"The latest verified research update",primaryKeyword:"science",relatedKeywords:["research"]},faq:[],category:"Science",sensitive:false,reviewReasons:[],socialDescription:"New research update",images:Array.from({length:4},(_,i)=>({prompt:`Distinct illustration composition ${i}`,alt:`Illustration ${i}`,caption:`Science context ${i}`}))};
 t.mock.method(globalThis,"fetch",async(url,options)=>{
  if(String(url).includes("groq.com")){assert.equal(JSON.parse(options.body).model,env.groq.model);return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(draft)}}],usage:{total_tokens:100}});}
  images++;return Response.json({success:true,result:{image:Buffer.from([255,216,255,224,0,1]).toString("base64")}});
 });
 t.mock.method(cloudinary.uploader,"upload_stream",(opts,callback)=>({end:()=>callback(null,{secure_url:`https://res.cloudinary.com/test/image/upload/${opts.public_id}.webp`,public_id:`trendsduniya/articles/${opts.public_id}`,width:1600,height:900,format:"webp",bytes:500})}));
 const task=await AutomationTask.create({day:dayInZone(),key:"test-topic",title:draft.title,owner:admin._id,categoryId:category._id,verification:"verified",state:"queued",language:"en-IN",imageCount:4,sources:[{title:"Official research",url:"https://example.org/research",publishedAt:new Date(),evidence:"Researchers published a new science report, according to their official statement."}]});
 await tickAutomation();assert.equal((await AutomationTask.findById(task.id)).state,"generating_images");
 await tickAutomation();assert.equal((await AutomationTask.findById(task.id)).images.length,1);
 // Simulate a worker killed after a checkpoint: expire its durable lease.
 await AutomationSettings.updateOne({_id:"main"},{$set:{leaseUntil:new Date(0),leaseToken:"old-worker"}});
 for(let i=0;i<4;i++)await tickAutomation();
 let ready=await AutomationTask.findById(task.id);assert.equal(ready.state,"ready_for_review");assert.equal(images,4);assert.ok(ready.article);assert.equal(ready.providerModel,"test-model");
 let article=await Article.findById(ready.article);assert.equal(article.status,"draft");assert.equal(article.media.images.length,3);
 assert.throws(()=>assertReady(ready,article,settings),/Approve/);
 await approveTask(ready,admin);ready=await AutomationTask.findById(task.id);assert.equal(ready.approvedHash,fingerprint(article));
 article.title="Changed title";assert.throws(()=>assertReady(ready,article,settings),/Approve/);
 ready.state="scheduled";ready.scheduledAt=new Date(Date.now()-60000);await ready.save();
 await AutomationSettings.updateOne({_id:"main"},{$set:{enabled:false}});await tickAutomation();assert.equal((await Article.findById(ready.article)).status,"draft");
 await AutomationSettings.updateOne({_id:"main"},{$set:{enabled:true}});
 await Promise.all([tickAutomation(),tickAutomation()]);
 article=await Article.findById(ready.article);assert.equal(article.status,"published");assert.equal((await AutomationTask.findById(task.id)).state,"published");
 assert.equal(await Article.countDocuments({automationTask:task.id}),1);
 const first=article.publishedAt;await tickAutomation();assert.equal(+(await Article.findById(article.id)).publishedAt,+first);
});
test("worker lock excludes concurrent mutations and expired leases recover",async()=>{
 await withWorkerLock(async()=>{await assert.rejects(withWorkerLock(async()=>{}),/busy/);});
 await AutomationSettings.updateOne({_id:"main"},{$set:{leaseUntil:new Date(Date.now()-1)}});assert.equal(await withWorkerLock(async()=>42),42);
});
test("regular article endpoint cannot bypass automation review",async()=>{
 const task=await AutomationTask.create({key:"review-guard",title:"Unverified",verification:"unverified",imageCount:4});
 const article=await Article.create({title:"Guard",slug:"guard",automationTask:task.id,createdBy:admin.id});
 await assert.rejects(saveArticle({admin,ip:"test",get:()=>"test"},article.id,{status:"published"}),/Verify/);
});
test("rate limits persist retry deadlines and exhausted retries require review",async t=>{
 const settings=await getSettings();settings.enabled=true;settings.retryLimit=1;settings.researchDay=dayInZone();await settings.save();
 const task=await AutomationTask.create({key:"quota-topic",day:dayInZone(),title:"Quota test",state:"queued",owner:admin.id,verification:"verified",imageCount:4,sources:[{title:"Source",url:"https://example.org",publishedAt:new Date(),evidence:"A verified factual source for the retry integration test."}]});
 let calls=0;t.mock.method(globalThis,"fetch",async()=>{calls++;return new Response("private provider body",{status:429,headers:{"retry-after":"60"}});});
 await tickAutomation();let failed=await AutomationTask.findById(task.id);assert.equal(failed.state,"queued");assert.ok(failed.nextAttemptAt>Date.now()+50000);assert.equal(failed.attempts,1);
 await tickAutomation();assert.equal(calls,1);
 await AutomationTask.updateOne({_id:task.id},{$set:{nextAttemptAt:new Date(0)}});await tickAutomation();failed=await AutomationTask.findById(task.id);assert.equal(failed.state,"failed");assert.equal(failed.resumeState,"queued");assert.doesNotMatch(failed.error,/private provider body/);
});
test("research preserves evidence, deduplicates and does not invent missing candidates",async t=>{
 const settings=await getSettings();settings.countries=["US"];settings.sources=["bbcNews"];
 const feed=trendProviders.find(p=>p.name==="bbcNews");
 t.mock.method(feed,"fetch",async()=>Array.from({length:8},(_,i)=>({title:`Distinct research topic ${i}`,url:`https://example.org/topic-${i}`,provider:"bbcNews",position:i+1,publishedAt:new Date(),evidence:`Official evidence summary for independent topic number ${i}.`})));
 const result=await withWorkerLock(()=>research(settings,admin._id));assert.ok(result.created>0);assert.ok(await AutomationTask.countDocuments({day:dayInZone(),state:{$ne:"rejected"}})<=5);
 const again=await withWorkerLock(()=>research(settings,admin._id));assert.equal(again.created,0);
 const generated=await AutomationTask.findOne({title:/Distinct research topic/});assert.ok(generated.sources[0].publishedAt);assert.ok(generated.sources[0].evidence);assert.equal(generated.verification,"unverified");
});
