import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {MongoMemoryReplSet} from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import env from "../src/config/env.js";
import Admin from "../src/models/Admin.js";
import AiConfig from "../src/models/AiConfig.js";
import TrendingSnapshot from "../src/models/TrendingSnapshot.js";
import RequestQuota from "../src/models/RequestQuota.js";
import AuditLog from "../src/models/AuditLog.js";
import Article from "../src/models/Article.js";
import {encryptSecret,decryptSecret} from "../src/utils/encryption.js";
import {parseGenerated,publicConfig} from "../src/services/ai/ai.service.js";
import {adapters} from "../src/services/ai/providers/index.js";
import {callProvider} from "../src/services/ai/transport.js";
import {normalizeTrend,sameTopic,rankTrends} from "../src/services/trending/trendRanking.service.js";
import {refreshTrends,trendDate,queryDate} from "../src/services/trending/trending.service.js";
import {blankArticle,toPayload,fromArticle} from "../../admin/src/lib/article-form.mjs";
import {mergeAiDraft} from "../../admin/src/lib/ai-draft.mjs";
let db,adminToken,editorToken,authorToken;
const auth=(r,t=adminToken)=>r.set("Authorization","Bearer "+t);
const config={provider:"openrouter",model:"openai/gpt-5-mini",apiKey:"test-secret-key-not-real",temperature:0.4,maxTokens:5000,outputMode:"json",enabled:true};
const draft=()=>({title:"A supplied headline",slug:"a-supplied-headline",excerpt:"A draft awaiting verification.",summary:"Verify the announcement.",content:"<p>The supplied headline requires verification before publication.</p>",articleType:"news",articleSection:"Technology",trendingTopic:"",seo:{searchIntent:"news",searchIntentDescription:"Understand the supplied headline",primaryKeyword:"headline",relatedKeywords:[],relatedTopics:[],metaTitle:"A supplied headline",metaDescription:"A draft awaiting independent confirmation."},faq:[],internalLinks:[],externalLinks:[],suggestedTags:["Technology"],editorialNotes:"Verify source documents before publishing."});
before(async()=>{
  env.aiEncryptionKey="ab".repeat(32);env.cronSecret="test-cron-secret";
  db=await MongoMemoryReplSet.create({instanceOpts:[{launchTimeout:60000}],replSet:{count:1},binary:{version:"7.0.14"}});
  env.mongoUri=db.getUri();
  await mongoose.connect(env.mongoUri);
  await Promise.all([AiConfig.init(),TrendingSnapshot.init(),RequestQuota.init(),Article.init()]);
  const tokens=[];
  for(const role of ["superadmin","editor","author"]){const email=`${role}@ai-test.test`;await Admin.create({name:role,email,password:"Test-password-123",role});const r=await request(app).post("/api/auth/login").send({email,password:"Test-password-123"});assert.equal(r.status,200);tokens.push(r.body.data.accessToken);}
  [adminToken,editorToken,authorToken]=tokens;
});
after(async()=>{await mongoose.disconnect();await db?.stop();});
test("authenticated encryption rejects tampering and uses random IVs",()=>{
  const value=encryptSecret("secret");assert.equal(decryptSecret(value),"secret");assert.notEqual(value,encryptSecret("secret"));
  const parts=value.split(":");parts[2]="00".repeat(16);assert.throws(()=>decryptSecret(parts.join(":")));
  assert.equal(JSON.stringify(publicConfig({encryptedApiKey:value,apiKeyConfigured:true})).includes(value),false);
});
test("AI and trending endpoints authenticate and config changes require admin",async()=>{
  for(const path of ["/api/admin/ai/config","/api/admin/ai/status","/api/admin/trending","/api/admin/trending/history"])assert.equal((await request(app).get(path)).status,401);
  assert.equal((await auth(request(app).put("/api/admin/ai/config"),editorToken).send(config)).status,403);
  assert.equal((await auth(request(app).get("/api/admin/ai/config"),editorToken)).status,403);
  assert.equal((await auth(request(app).post("/api/admin/ai/generate-article"),authorToken).send({title:"A story"})).status,403);
  assert.equal((await request(app).post("/api/internal/jobs/trending")).status,401);
  assert.equal((await auth(request(app).post("/api/admin/ai/generate-article"),editorToken).send({title:"A story"})).status,409);
});
test("AI config validates, encrypts and never returns credentials",async()=>{
  assert.equal((await auth(request(app).put("/api/admin/ai/config")).send({...config,maxTokens:-1})).status,422);
  const rejected=await auth(request(app).put("/api/admin/ai/config")).send({...config,apiKey:123});assert.equal(rejected.status,422);assert.ok(!JSON.stringify(rejected.body).includes('"input"'));
  assert.equal((await auth(request(app).put("/api/admin/ai/config")).send({...config,provider:"custom",baseUrl:"http://127.0.0.1"})).status,422);
  const r=await auth(request(app).put("/api/admin/ai/config")).send(config);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.apiKeyConfigured,true);
  assert.ok(!JSON.stringify(r.body).includes(config.apiKey));
  const saved=await AiConfig.findOne().select("+encryptedApiKey");assert.notEqual(saved.encryptedApiKey,config.apiKey);assert.equal(decryptSecret(saved.encryptedApiKey),config.apiKey);
  assert.equal((await AiConfig.findOne()).encryptedApiKey,undefined);
  assert.ok(!JSON.stringify(saved).includes(saved.encryptedApiKey));
  const fetched=await auth(request(app).get("/api/admin/ai/config"));assert.ok(!JSON.stringify(fetched.body).includes("encryptedApiKey"));
  const logs=await AuditLog.find({action:"AI_CONFIG_UPDATED"}).lean();assert.ok(!JSON.stringify(logs).includes(config.apiKey));
});
test("test endpoint sends a tiny request, stores status, and redacts upstream errors",async(t)=>{
  t.mock.method(globalThis,"fetch",async()=>new Response(JSON.stringify({choices:[{message:{content:"OK"}}]}),{status:200}));
  const {apiKey,...withoutKey}=config;
  const r=await auth(request(app).post("/api/admin/ai/test")).send(withoutKey);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.success,true);
  assert.equal((await AiConfig.findOne()).lastTestStatus,"connected");
  globalThis.fetch.mock.restore();t.mock.method(globalThis,"fetch",async()=>new Response(apiKey,{status:401}));
  const failed=await auth(request(app).post("/api/admin/ai/test")).send(withoutKey);assert.equal(failed.status,502);assert.ok(!JSON.stringify(failed.body).includes(apiKey));
});
test("adapters use provider-specific request contracts",()=>{
  for(const provider of ["openai","openrouter","groq","custom"]){const r=adapters[provider].build({...config,provider,baseUrl:"https://example.test/v1"},"key","system","user",{});assert.ok(r.url.endsWith("/chat/completions"));assert.equal(r.body.temperature,undefined);assert.equal(r.headers.Authorization,"Bearer key");}
  const gemini=adapters.gemini.build({...config,baseUrl:"https://example.test",model:"gemini-model"},"key","system","user",{});assert.equal(gemini.headers["x-goog-api-key"],"key");assert.equal(gemini.body.generationConfig.responseMimeType,"application/json");
  const anthropic=adapters.anthropic.build({...config,baseUrl:"https://example.test"},"key","system","user");assert.equal(anthropic.body.system,"system");assert.equal(anthropic.headers["anthropic-version"],"2023-06-01");
});
test("JSON contract removes unsafe HTML, disallows media, and rejects invented links",()=>{
  const data=draft();data.content+='<script>alert(1)</script><img src="https://invented.test/image"><a href="https://invented.test">Link</a>';
  data.externalLinks=[{title:"Invented",anchorText:"Invented",url:"https://invented.test"},{title:"Supplied",anchorText:"Supplied",url:"https://supplied.test/"}];
  const parsed=parseGenerated('```json\n'+JSON.stringify(data)+'\n```',{internal:[],external:[{url:"https://supplied.test/"}]});assert.ok(!parsed.content.includes("<script"));assert.ok(!parsed.content.includes("<img"));assert.ok(!parsed.content.includes("href"));assert.equal(parsed.externalLinks.length,1);
  assert.throws(()=>parseGenerated(JSON.stringify({...data,category:"unsafe"}),{internal:[],external:[]}));assert.throws(()=>parseGenerated("bad",{internal:[],external:[]}));
});
test("generation repairs malformed JSON once and auto-save payload is a title-only compatible draft",async(t)=>{
  let calls=0;t.mock.method(globalThis,"fetch",async()=>new Response(JSON.stringify({choices:[{message:{content:++calls===1?"bad JSON":JSON.stringify(draft())}}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}}),{status:200}));
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
test("timeout protection and invalid credentials do not retry",async(t)=>{
  let count=0;t.mock.method(globalThis,"fetch",async()=>{count++;return new Response("sensitive",{status:401});});
  await assert.rejects(callProvider({...config,baseUrl:"https://example.test"},"key","s","u"),/credentials/);assert.equal(count,1);
  globalThis.fetch.mock.restore();t.mock.method(globalThis,"fetch",async()=>{throw new Error("sensitive key");});
  await assert.rejects(callProvider({...config,baseUrl:"https://example.test"},"key","s","u",undefined,AbortSignal.abort()),/timed out/);
});
test("retryable upstream failures use bounded retries",async(t)=>{
  let count=0;t.mock.method(globalThis,"fetch",async()=>++count<3?new Response("unavailable",{status:503}):new Response(JSON.stringify({choices:[{message:{content:"OK"}}]}),{status:200}));
  const result=await callProvider({...config,baseUrl:"https://example.test"},"key","s","u");assert.equal(result.text,"OK");assert.equal(count,3);
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
test("daily snapshots are idempotent, preserve history, tolerate source failures and protect cron",async()=>{
  const providers=[{name:"good",fetch:async()=>[{title:"India technology policy",provider:"good",url:"https://source.test/",position:1,publishedAt:new Date()}]},{name:"bad",fetch:async()=>{throw new Error("Unavailable");}}];
  const first=await refreshTrends("IN",{providers});const again=await refreshTrends("IN",{providers});assert.equal(String(first._id),String(again._id));assert.equal(await TrendingSnapshot.countDocuments({date:trendDate("IN"),country:"IN"}),1);assert.equal(first.sourceHealth[1].status,"unavailable");
  await TrendingSnapshot.create({date:"2020-01-01",country:"IN",topics:[]});
  const cron=await request(app).get("/api/internal/jobs/trending").set("Authorization","Bearer "+env.cronSecret);assert.equal(cron.status,200);
  await TrendingSnapshot.updateOne({_id:first._id},{$set:{lastAttemptAt:new Date(0)}});
  await assert.rejects(refreshTrends("IN",{force:true,providers:[providers[1]]}),/All trend sources/);
  const retained=await TrendingSnapshot.findById(first._id);assert.equal(retained.topics.length,1);assert.equal(await TrendingSnapshot.countDocuments({date:"2020-01-01"}),1);
  const list=await auth(request(app).get("/api/admin/trending"));assert.equal(list.status,200);assert.equal(list.body.data.lockToken,undefined);
  const detail=await auth(request(app).get("/api/admin/trending/"+retained.topics[0]._id));assert.equal(detail.status,200);
  assert.equal((await auth(request(app).get("/api/admin/trending?date=invalid"))).status,422);
});
