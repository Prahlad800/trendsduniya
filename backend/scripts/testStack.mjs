// Run after building admin and frontend. Only a temporary MongoDB is used.
import assert from "node:assert/strict";
import {load} from "cheerio";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import app from "../src/app.js";
import env from "../src/config/env.js";
import Admin from "../src/models/Admin.js";
import * as models from "../src/models/index.js";

const originalFetch=globalThis.fetch;
const fixture={title:"Integration test headline",slug:"integration-test-headline",excerpt:"A test draft for end-to-end validation.",summary:"Test fixture only.",content:"<p>This is a test fixture, not a news report.</p>",articleType:"news",articleSection:"Testing",trendingTopic:"",seo:{searchIntent:"news",searchIntentDescription:"Test",primaryKeyword:"test",relatedKeywords:[],relatedTopics:[],metaTitle:"Integration test headline",metaDescription:"A test draft for end-to-end validation."},faq:[],internalLinks:[],externalLinks:[],suggestedTags:["Testing"],editorialNotes:"Test fixture only."};
globalThis.fetch=async(url,options)=>{
  const host=new URL(url).hostname;
  if(host==="generativelanguage.googleapis.com"){
    const body=JSON.parse(options.body),probe=body.contents[0].parts[0].text==="Reply only with OK",trends=!probe&&!!JSON.parse(body.contents[0].parts[0].text).candidates;
    const text=probe?"OK":JSON.stringify(trends?{topics:Array.from({length:20},(_,candidateId)=>({candidateId,category:"Testing",trend_score:100-candidateId,why_trending:"Test source coverage",search_keywords:["test"],article_angle:"Test editorial angle",language_priority:"Hindi"}))}:fixture);
    assert.equal(new URL(url).pathname,`/v1beta/models/${env.gemini.model}:generateContent`);
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text}]},finishReason:"STOP"}]}),{headers:{"Content-Type":"application/json"}});
  }
  if(["trends.google.com","news.google.com","feeds.bbci.co.uk"].includes(host))return new Response(`<rss><channel>${Array.from({length:25},(_,i)=>`<item><title>Integration test topic ${i}</title><link>https://example.com/test-topic-${i}</link><pubDate>${new Date().toUTCString()}</pubDate></item>`).join("")}</channel></rss>`,{status:200});
  return originalFetch(url,options);
};
const freePort=async()=>{const server=net.createServer();server.listen(0,"127.0.0.1");await once(server,"listening");const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;};
const children=[];
let db,server,checks=0;
async function launch(name,port,api){
  const cwd=fileURLToPath(new URL(`../../${name}/`,import.meta.url));
  const child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port)],{cwd,env:{...process.env,NODE_ENV:"production",API_URL:api,NEXT_PUBLIC_API_URL:api},stdio:["ignore","pipe","pipe"],windowsHide:true});
  children.push(child);let logs="";for(const stream of [child.stdout,child.stderr])stream.on("data",chunk=>{logs=(logs+chunk).slice(-5000);});
  for(let attempt=0;attempt<100;attempt++){
    if(child.exitCode!==null)throw new Error(`${name} failed to start: ${logs}`);
    try{const r=await originalFetch(`http://127.0.0.1:${port}/${name==="admin"?"login":""}`,{signal:AbortSignal.timeout(1000)});if(r.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  throw new Error(`${name} startup timed out: ${logs}`);
}
try{
  db=await MongoMemoryReplSet.create({instanceOpts:[{launchTimeout:60000}],replSet:{count:1},binary:{version:"7.0.14"}});
  env.mongoUri=db.getUri();env.gemini={apiKey:"fake-key-for-stack-test",model:"test-model"};
  await mongoose.connect(env.mongoUri);
  await Promise.all(Object.values(models).map(Model=>Model.init()));
  await Admin.create({name:"Stack Test",email:"stack@example.test",password:"Test-only-password-123",role:"superadmin"});
  server=app.listen(0,"127.0.0.1");await once(server,"listening");
  const api=`http://127.0.0.1:${server.address().port}/api`,adminPort=await freePort(),frontPort=await freePort();
  await launch("admin",adminPort,api);await launch("frontend",frontPort,api);
  let cookies="";
  async function cms(path,method="GET",body,expected=200){
    const r=await originalFetch(`http://127.0.0.1:${adminPort}/api/cms${path}`,{method,headers:{"Content-Type":"application/json",Cookie:cookies},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
    const result=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(result)}`);
    const set=r.headers.getSetCookie();if(set.length)cookies=set.map(c=>c.split(";")[0]).join("; ");checks++;return result;
  }
  const health=await cms("/health");assert.deepEqual(health.capabilities,["ai","trending"]);
  await cms("/admin/ai/readiness","GET",undefined,401);
  await cms("/auth/login","POST",{email:"stack@example.test",password:"Test-only-password-123"});
  assert.ok(cookies.includes("td_access="));await cms("/auth/me");
  const unavailableRoute=await cms("/admin/ai/missing","GET",undefined,502);assert.ok(unavailableRoute.message.includes("updated backend"));
  const ready=await cms("/admin/ai/readiness");assert.equal(ready.data.configured,true);assert.ok(!JSON.stringify(ready).includes(env.gemini.apiKey));
  const connected=await cms("/admin/ai/status");assert.equal(connected.data.connected,true);
  await cms("/admin/ai/config","GET",undefined,502);
  const generated=await cms("/admin/ai/generate-article","POST",{title:fixture.title,language:"en-IN"});
  const {suggestedTags,editorialNotes,suggestedCategory,suggestedTagIds,...article}=generated.data.article;
  assert.equal(suggestedTags[0],"Testing");assert.ok(editorialNotes);
  const draft=await cms("/admin/articles","POST",{...article,status:"draft"},201);
  assert.equal(draft.data.status,"draft");
  const hidden=await originalFetch(`${api}/articles/${draft.data.slug}`);assert.equal(hidden.status,404);checks++;
  await cms(`/admin/articles/${draft.data._id}`);
  await cms(`/admin/articles/${draft.data._id}`,"PATCH",{summary:"Updated test draft"});
  await cms(`/admin/articles/${draft.data._id}/revisions`);
  const category=await cms("/admin/categories","POST",{name:"Stack test category"},201);
  await cms(`/admin/articles/${draft.data._id}`,"PATCH",{category:category.data._id,media:{featuredImage:{url:"https://res.cloudinary.com/demo/image/upload/sample.jpg",publicId:"trendsduniya/articles/stack-test",alt:"Test fixture image"},images:[]}});
  await cms(`/admin/articles/${draft.data._id}/publish`,"POST",{});
  const publicArticle=await originalFetch(`http://127.0.0.1:${frontPort}/article/${draft.data.slug}`);
  assert.equal(publicArticle.status,200);const html=await publicArticle.text();assert.ok(html.includes("Integration test headline"));assert.ok(html.includes("application/ld+json"));assert.ok(html.includes('rel="canonical"'));checks++;
  const legacy=await originalFetch(`http://127.0.0.1:${frontPort}/news/${draft.data.slug}`,{redirect:"manual"});if(legacy.status===308){assert.equal(legacy.headers.get("location"),`/article/${draft.data.slug}`);}else{assert.equal(legacy.status,200);const $=load(await legacy.text());assert.equal($('meta[http-equiv="refresh"]').attr("content"),`0;url=/article/${draft.data.slug}`);}checks++;
  await cms("/admin/trending");
  const trends=await cms("/admin/trending/refresh","POST",{country:"IN"});assert.equal(trends.data.topics.length,20);
  await cms("/admin/trending/history");await cms(`/admin/trending/${trends.data.topics[0]._id}`);
  await cms(`/admin/trending/${trends.data.topics[0]._id}/start-article`,"POST",{});
  for(const path of ["/setup-ai","/trending","/articles/new"]){const r=await originalFetch(`http://127.0.0.1:${adminPort}${path}`);assert.equal(r.status,200,path);checks++;}
  for(const path of ["/","/latest","/categories","/authors","/search?q=test","/saved","/about","/robots.txt","/sitemap.xml"]){const r=await originalFetch(`http://127.0.0.1:${frontPort}${path}`,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path);checks++;}
  // Expired access tokens must reach the client as 401 even with a valid refresh cookie.
  const access=cookies.match(/td_access=([^;]+)/)[1],decoded=jwt.decode(access);
  const expired=jwt.sign({id:decoded.id,sid:decoded.sid},env.accessSecret,{expiresIn:-1,audience:'trendsduniya-admin',issuer:'trendsduniya'});
  cookies=cookies.replace(/td_access=[^;]+/,`td_access=${expired}`);
  await cms('/auth/me','GET',undefined,401);
  assert.ok(!cookies.match(/td_access=[^;]/));
  await cms('/auth/login','POST',{email:'stack@example.test',password:'Test-only-password-123'});
  const sessionResponse=await originalFetch(`http://127.0.0.1:${adminPort}/api/cms/auth/me`,{headers:{Cookie:cookies}});
  assert.equal(sessionResponse.status,200);assert.ok(Number(sessionResponse.headers.get('X-Session-Expires-At'))>Date.now());checks++;
  await cms("/auth/logout","POST",{});
  await new Promise(resolve=>server.close(resolve));server=null;
  const offline=await cms("/health","GET",undefined,503);assert.ok(offline.message.includes("Start the backend"));
  console.log(`PASS: ${checks} stack checks (production admin proxy, backend, public frontend; mocked AI/RSS; isolated MongoDB).`);
}finally{
  globalThis.fetch=originalFetch;
  await Promise.all(children.map(async child=>{if(child.exitCode===null){const exited=once(child,"exit");child.kill();await exited;}}));
  if(server)await new Promise(resolve=>server.close(resolve));
  await mongoose.disconnect();await db?.stop();
}
