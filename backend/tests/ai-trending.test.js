import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {MongoMemoryReplSet} from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import env from "../src/config/env.js";
import Admin from "../src/models/Admin.js";
import TrendingSnapshot from "../src/models/TrendingSnapshot.js";
import RequestQuota from "../src/models/RequestQuota.js";
import AuditLog from "../src/models/AuditLog.js";
import Article from "../src/models/Article.js";
import {parseGenerated} from "../src/services/ai/ai.service.js";
import {normalizeTrend,sameTopic,rankTrends} from "../src/services/trending/trendRanking.service.js";
import {refreshTrends,trendDate,queryDate} from "../src/services/trending/trending.service.js";
import {blankArticle,toPayload,fromArticle} from "../../admin/src/lib/article-form.mjs";
import {mergeAiDraft} from "../../admin/src/lib/ai-draft.mjs";
import jwt from "jsonwebtoken";
import AuthSession from "../src/models/AuthSession.js";
import {setTimeout as delay} from "node:timers/promises";
let db,adminToken,editorToken,authorToken;
const auth=(r,t=adminToken)=>r.set("Authorization","Bearer "+t);
const draft=()=>({title:"A supplied headline",slug:"a-supplied-headline",excerpt:"A draft awaiting verification.",summary:"Verify the announcement.",content:"<p>The supplied headline requires verification before publication.</p>",articleType:"news",articleSection:"Technology",trendingTopic:"",seo:{searchIntent:"news",searchIntentDescription:"Understand the supplied headline",primaryKeyword:"headline",relatedKeywords:[],relatedTopics:[],metaTitle:"A supplied headline",metaDescription:"A draft awaiting independent confirmation."},faq:[],internalLinks:[],externalLinks:[],suggestedTags:["Technology"],editorialNotes:"Verify source documents before publishing."});
before(async()=>{
  env.gemini={apiKey:"test-secret-key-not-real",model:"test-model"};env.cronSecret="test-cron-secret";
  db=await MongoMemoryReplSet.create({instanceOpts:[{launchTimeout:60000}],replSet:{count:1},binary:{version:"7.0.14"}});
  env.mongoUri=db.getUri();
  await mongoose.connect(env.mongoUri);
  await Promise.all([TrendingSnapshot.init(),RequestQuota.init(),Article.init()]);
  const tokens=[];
  for(const role of ["superadmin","editor","author"]){const email=`${role}@ai-test.test`;await Admin.create({name:role,email,password:"Test-password-123",role});const r=await request(app).post("/api/auth/login").send({email,password:"Test-password-123"});assert.equal(r.status,200);tokens.push(r.body.data.accessToken);}
  [adminToken,editorToken,authorToken]=tokens;
});
after(async()=>{await mongoose.disconnect();await db?.stop();});
function mockResponse(body,options){const old=JSON.parse(body);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:old.choices[0].message.content}]},finishReason:"STOP"}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:20}}),{...options,headers:{"Content-Type":"application/json"}});}

test("CORS allows configured origins and denies other origins",async()=>{
 const result=await request(app).options('/api/admin/ai/generate-article').set('Origin',env.corsOrigins[0]).set('Access-Control-Request-Method','POST');
 assert.equal(result.status,204);assert.equal(result.headers['access-control-allow-origin'],env.corsOrigins[0]);assert.equal(result.headers['access-control-allow-credentials'],'true');
 assert.equal((await request(app).options('/api/admin/ai/generate-article').set('Origin','https://untrusted.test').set('Access-Control-Request-Method','POST')).status,403);
});

test("invalid JSON never echoes credential-bearing input",async()=>{
 const response=await auth(request(app).post('/api/admin/ai/generate-article')).set('Content-Type','application/json').send('{"apiKey":"private-value",BROKEN}');
 assert.equal(response.status,400);assert.equal(response.body.message,'Invalid JSON request body');assert.ok(!JSON.stringify(response.body).includes('private-value'));
});

test("database failures during authentication return 503 rather than expiring the session",async(t)=>{
 t.mock.method(AuthSession,'findOne',()=>{throw Object.assign(new Error('private connection detail'),{name:'MongoNetworkError'});});
 const response=await auth(request(app).get('/api/auth/me'));assert.equal(response.status,503);assert.equal(response.body.errorCode,'DATABASE_ERROR');assert.ok(!JSON.stringify(response.body).includes('private connection detail'));
});
test("JSON contract removes unsafe HTML, disallows media, and rejects invented links",()=>{
  const data=draft();data.content+='<script>alert(1)</script><img src="https://invented.test/image"><a href="https://invented.test">Link</a>';
  data.externalLinks=[{title:"Invented",anchorText:"Invented",url:"https://invented.test"},{title:"Supplied",anchorText:"Supplied",url:"https://supplied.test/"}];
  const parsed=parseGenerated('```json\n'+JSON.stringify(data)+'\n```',{internal:[],external:[{url:"https://supplied.test/"}]});assert.ok(!parsed.content.includes("<script"));assert.ok(!parsed.content.includes("<img"));assert.ok(!parsed.content.includes("href"));assert.equal(parsed.externalLinks.length,1);
  assert.throws(()=>parseGenerated(JSON.stringify({...data,category:"unsafe"}),{internal:[],external:[]}));assert.throws(()=>parseGenerated("bad",{internal:[],external:[]}));
});
test("generation repairs malformed JSON once and auto-save payload is a title-only compatible draft",async(t)=>{
  let calls=0;t.mock.method(globalThis,"fetch",async()=>mockResponse(JSON.stringify({choices:[{message:{content:++calls===1?"bad JSON":JSON.stringify(draft())}}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}}),{status:200}));
  const r=await auth(request(app).post("/api/admin/ai/generate-article"),editorToken).send({title:"A supplied headline",language:"hi-IN"});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(calls,2);assert.equal(r.body.data.article.category,undefined);
  const form=blankArticle();form.title="A supplied headline";form.language="hi-IN";
  const merged=mergeAiDraft(form,r.body.data.article);
  const saved=await auth(request(app).post("/api/admin/articles"),editorToken).send({...toPayload(merged),status:"draft",scheduledAt:null});assert.equal(saved.status,201,JSON.stringify(saved.body));assert.equal(saved.body.data.status,"draft");assert.equal(saved.body.data.language,"hi-IN");assert.equal(saved.body.data.category,null);
  assert.equal((await request(app).get("/api/articles/"+saved.body.data.slug)).status,404);
});
test("manual text, category, images and SEO controls survive AI merge and reload",()=>{
  const form=blankArticle();Object.assign(form,{title:"Manual title",content:"<p>Manual reporting</p>",category:"123",subCategory:"456",trendingTopic:"Manual trend"});form.seo.canonicalUrl="https://example.test/canonical";form.media={featuredImage:{url:"https://example.test/image",alt:"Manual alt"},images:[{url:"https://example.test/gallery"}]};
  const merged=mergeAiDraft(form,draft());assert.deepEqual(merged.media,form.media);assert.equal(merged.category,"123");assert.equal(merged.subCategory,"456");assert.equal(merged.content,form.content);assert.equal(merged.title,form.title);assert.equal(merged.seo.canonicalUrl,form.seo.canonicalUrl);assert.equal(fromArticle(merged).trendingTopic,"Manual trend");
});
test("per-admin quota is shared and enforced",async()=>{
  const admin=await Admin.findOne({role:"editor"});
  await RequestQuota.updateOne({_id:`ai-generation:${admin.id}:${Math.floor(Date.now()/600000)}`},{$set:{count:env.aiGenerationLimit,expiresAt:new Date(Date.now()+1200000)}},{upsert:true});
  const result=await auth(request(app).post("/api/admin/ai/generate-article"),editorToken).send({title:"A story"});assert.equal(result.status,429);assert.ok(result.headers["retry-after"]);
});
test("trend normalization merges clear variants but not different numbered events",()=>{
  assert.equal(normalizeTrend(" Apple  iPhone 18! "),"apple iphone 18");assert.ok(sameTopic("iPhone 18","Apple iPhone 18 launch"));assert.ok(!sameTopic("iPhone 18","iPhone 17"));assert.ok(!sameTopic("India tax policy","India cricket match"));
  const now=new Date(),items=[{title:"iPhone 18",provider:"a",url:"https://a.test",position:1,publishedAt:now},{title:"Apple iPhone 18",provider:"b",url:"https://b.test",position:2,publishedAt:now}];assert.equal(rankTrends(items).length,1);assert.equal(rankTrends(items)[0].sources.length,2);
  assert.throws(()=>queryDate({date:"2026-02-30"}));assert.throws(()=>queryDate({country:"ZZ"}));
});
test("daily snapshots are idempotent, preserve history, tolerate source failures and protect cron",async(t)=>{
  t.mock.method(globalThis,"fetch",async()=>mockResponse(JSON.stringify({choices:[{message:{content:JSON.stringify({topics:Array.from({length:20},(_,candidateId)=>({candidateId,category:"Technology",trend_score:100-candidateId,why_trending:"Present in current source coverage",search_keywords:["technology"],article_angle:"Explain the reported development",language_priority:"Hindi"}))})}}]}),{status:200}));
  const providers=[{name:"good",fetch:async()=>Array.from({length:25},(_,i)=>({title:`India technology policy ${i}`,provider:"good",url:`https://source.test/${i}`,position:i+1,publishedAt:new Date()}))},{name:"bad",fetch:async()=>{throw new Error("Unavailable");}}];
  const first=await refreshTrends("IN",{providers});const again=await refreshTrends("IN",{providers});assert.equal(String(first._id),String(again._id));assert.equal(await TrendingSnapshot.countDocuments({date:trendDate("IN"),country:"IN"}),1);assert.equal(first.sourceHealth[1].status,"unavailable");
  await TrendingSnapshot.create({date:"2020-01-01",country:"IN",topics:[]});
  const cron=await request(app).get("/api/internal/jobs/trending").set("Authorization","Bearer "+env.cronSecret);assert.equal(cron.status,200);
  await TrendingSnapshot.updateOne({_id:first._id},{$set:{lastAttemptAt:new Date(0)}});
  await assert.rejects(refreshTrends("IN",{force:true,providers:[providers[1]]}),/All trend sources/);
  const retained=await TrendingSnapshot.findById(first._id);assert.equal(retained.topics.length,20);assert.equal(await TrendingSnapshot.countDocuments({date:"2020-01-01"}),1);
  const list=await auth(request(app).get("/api/admin/trending"));assert.equal(list.status,200);assert.equal(list.body.data.lockToken,undefined);
  const detail=await auth(request(app).get("/api/admin/trending/"+retained.topics[0]._id));assert.equal(detail.status,200);
  assert.equal((await auth(request(app).get("/api/admin/trending?date=invalid"))).status,422);
});

test("invalid, expired and revoked access tokens return 401",async()=>{
 const decoded=jwt.decode(adminToken);
 const expired=jwt.sign({id:decoded.id,sid:decoded.sid},env.accessSecret,{expiresIn:-1,audience:"trendsduniya-admin",issuer:"trendsduniya"});
 for(const value of ["invalid",expired])assert.equal((await auth(request(app).get("/api/auth/me"),value)).status,401);
 const login=await request(app).post("/api/auth/login").send({email:"superadmin@ai-test.test",password:"Test-password-123"});
 const token=login.body.data.accessToken;await AuthSession.updateOne({_id:jwt.decode(token).sid},{$set:{revokedAt:new Date()}});
 assert.equal((await auth(request(app).get("/api/auth/me"),token)).status,401);
 assert.equal((await auth(request(app).get("/api/auth/me"))).status,200);
});

test("MongoDB expires snapshots after 30 days and keeps recent history",async()=>{
 const indexes=await TrendingSnapshot.collection.indexes();assert.ok(indexes.some(i=>i.key.createdAt===1&&i.expireAfterSeconds===30*86400));
 const expired=await TrendingSnapshot.create({date:"2020-02-01",country:"IN",topics:[],createdAt:new Date(Date.now()-31*86400000)});
 const recent=await TrendingSnapshot.create({date:"2020-02-02",country:"IN",topics:[],createdAt:new Date(Date.now()-29*86400000)});
 await mongoose.connection.db.admin().command({setParameter:1,ttlMonitorSleepSecs:1});
 let exists=true;for(let i=0;i<100&&exists;i++){await delay(100);exists=!!await TrendingSnapshot.exists({_id:expired._id});}
 assert.equal(exists,false);assert.ok(await TrendingSnapshot.exists({_id:recent._id}));
});

test("central AI endpoints enforce roles and obsolete configuration routes are gone",async()=>{
 for(const path of ["/api/admin/ai/readiness","/api/admin/ai/status"])assert.equal((await request(app).get(path)).status,401);
 assert.equal((await auth(request(app).get('/api/admin/ai/readiness'),authorToken)).status,403);
 const ready=await auth(request(app).get('/api/admin/ai/readiness'),editorToken);assert.equal(ready.status,200);assert.equal(ready.body.data.configured,true);assert.ok(!JSON.stringify(ready.body).includes(env.gemini.apiKey));
 for(const path of ['/api/admin/ai/config','/api/admin/ai/config/article','/api/admin/ai/config/trending']){
  assert.equal((await auth(request(app).get(path))).status,404);assert.equal((await auth(request(app).put(path)).send({apiKey:'ignored-key'})).status,404);
 }
 assert.equal((await auth(request(app).post('/api/admin/ai/test')).send({})).status,404);
 assert.equal((await auth(request(app).post('/api/admin/ai/generate-article'),authorToken).send({title:'Test'})).status,403);
});
test("status performs a Gemini request and returns safe connection diagnostics",async(t)=>{
 await RequestQuota.deleteMany({});
 t.mock.method(globalThis,'fetch',async()=>mockResponse(JSON.stringify({choices:[{message:{content:'OK'}}]})));
 const result=await auth(request(app).get('/api/admin/ai/status'));assert.equal(result.status,200);assert.equal(result.body.data.connected,true);
 globalThis.fetch.mock.restore();t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error:{message:env.gemini.apiKey}}),{status:401,headers:{'Content-Type':'application/json'}}));
 const failed=await auth(request(app).get('/api/admin/ai/status'));assert.equal(failed.status,502);assert.equal(failed.body.data.connected,false);assert.ok(!JSON.stringify(failed.body).includes(env.gemini.apiKey));
 const saved=env.gemini.apiKey;env.gemini.apiKey='';try{const missing=await auth(request(app).get('/api/admin/ai/status'));assert.equal(missing.status,503);assert.equal(missing.body.data.configured,false);}finally{env.gemini.apiKey=saved;}
 const logs=await AuditLog.find({action:'AI_CONNECTION_TESTED'}).lean();assert.ok(!JSON.stringify(logs).includes(env.gemini.apiKey));
});
