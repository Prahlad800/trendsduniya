import {test} from "node:test";
import assert from "node:assert/strict";
import {parseTrendSelection} from "../src/services/trending/aiRanking.service.js";
import {parseGenerated,editorialPrompt} from "../src/services/ai/ai.service.js";
import {rankTrends} from "../src/services/trending/trendRanking.service.js";
import {mergeAiDraft} from "../../admin/src/lib/ai-draft.mjs";
import {blankArticle} from "../../admin/src/lib/article-form.mjs";
import {safeReturnPath,resetSession,sessionExpired,setSessionExpiry,checkSessionExpiry,sessionSignal,expireSession} from "../../admin/src/lib/session-state.mjs";
import {apiGet,apiPost} from "../../admin/src/lib/api.js";
import {trendProviders} from "../src/services/trending/providers/index.js";

const selection=()=>({topics:Array.from({length:20},(_,candidateId)=>({candidateId,category:"Technology",trend_score:100-candidateId,why_trending:"Current coverage",search_keywords:["policy"],article_angle:"Explain the update",language_priority:"Hindi"}))});
const candidates=()=>rankTrends(Array.from({length:25},(_,i)=>({title:`Policy number ${i}`,provider:"news",url:`https://source.test/${i}`,position:i+1,publishedAt:new Date()})),new Date(),120);
const article=()=>({title:"Verified policy",slug:"verified-policy",excerpt:"A policy update.",summary:"Policy context.",content:"<p>Policy update.</p>",articleType:"news",articleSection:"Technology",trendingTopic:"",seo:{searchIntent:"news",searchIntentDescription:"Policy context",primaryKeyword:"policy",relatedKeywords:[],relatedTopics:[],metaTitle:"Policy update",metaDescription:"A policy update."},suggestedTags:[],editorialNotes:"Verify before publication."});

test("login expiry schedules one redirect event and cancels pending requests",async(t)=>{
 resetSession();const previousWindow=globalThis.window;globalThis.window=new EventTarget();
 t.after(()=>{resetSession();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 let events=0;window.addEventListener('session-expired',()=>events++);
 t.mock.timers.enable({apis:['Date','setTimeout'],now:10000});
 const signal=sessionSignal();setSessionExpiry(12000);t.mock.timers.tick(1999);assert.equal(sessionExpired(),false);
 t.mock.timers.tick(1);assert.equal(sessionExpired(),true);assert.equal(signal.aborted,true);assert.equal(events,1);
 checkSessionExpiry();assert.equal(events,1);
 resetSession();setSessionExpiry(13000);resetSession();t.mock.timers.tick(2000);assert.equal(sessionExpired(),false);
});

test("CMS client rejects malformed successes and reports HTTP failures safely",async(t)=>{
 resetSession();
 for(const body of ['<html>private-key</html>','null','[]','']){
  t.mock.method(globalThis,'fetch',async()=>new Response(body));
  await assert.rejects(apiGet('/admin/ai/status'),e=>e.status===502&&!e.message.includes('private-key'));globalThis.fetch.mock.restore();
 }
 for(const status of [400,403,404,408,409,422,429,500,502,503,504]){
  t.mock.method(globalThis,'fetch',async()=>new Response('<html>private-key</html>',{status}));
  await assert.rejects(apiGet('/admin/ai/status'),e=>e.status===status&&!e.message.includes('private-key'));globalThis.fetch.mock.restore();
 }
});

test("trending selection enforces 20 distinct source-backed candidates",()=>{
 const input=selection(),source=candidates();const result=parseTrendSelection("Result:\n"+JSON.stringify(input),source);
 assert.equal(result.length,20);assert.ok(result.every((topic,i)=>topic.rank===i+1&&topic.sourceCount===1&&source.some(s=>s.title===topic.title&&s.sources[0].url===topic.sources[0].url)));
 input.topics[19].candidateId=0;assert.throws(()=>parseTrendSelection(JSON.stringify(input),source));
 input.topics[19].candidateId=1000;assert.throws(()=>parseTrendSelection(JSON.stringify(input),source));
 assert.throws(()=>parseTrendSelection('{"topics":[]}',source));
});
test("optional arrays, long HTML, tables and manual fields survive generation",()=>{
 const data=article();data.content='<h2>Policy</h2><table><tbody><tr><th>Change</th><td>Context</td></tr></tbody></table><p>'+"policy context ".repeat(5000)+"</p>";
 const parsed=parseGenerated(JSON.stringify(data),{internal:[],external:[]});
 assert.ok(parsed.content.includes("<table>"));assert.equal(parsed.content.match(/policy context/g).length,5000);assert.deepEqual(parsed.faq,[]);assert.deepEqual(parsed.externalLinks,[]);
 assert.throws(()=>parseGenerated(JSON.stringify({...data,content:"## Markdown"}),{internal:[],external:[]}));
 const form=blankArticle();form.title="Manual headline";form.scheduledAt="2026-10-01T10:00";form.tags=["existing"];form.category="existing";form.articleType="analysis";form.seo.searchIntent="commercial";
 const merged=mergeAiDraft(form,{...parsed,suggestedCategory:"another",suggestedTagIds:["another"]});
 assert.equal(merged.title,form.title);assert.equal(merged.scheduledAt,form.scheduledAt);assert.equal(merged.category,form.category);assert.deepEqual(merged.tags,form.tags);assert.deepEqual(merged.media,form.media);
 assert.equal(merged.articleType,"analysis");assert.equal(merged.seo.searchIntent,"commercial");
 assert.match(editorialPrompt,/10,000/);
});
test("expired sessions stop requests, login resets state and role 403 stays signed in",async(t)=>{
 resetSession();const window=new EventTarget();const previousWindow=globalThis.window;globalThis.window=window;t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 let calls=0,expiredEvents=0;window.addEventListener("session-expired",()=>expiredEvents++);
 t.mock.method(globalThis,"fetch",async()=>{calls++;return new Response('{"message":"Session expired"}',{status:401});});
 await assert.rejects(apiGet("/admin/articles"),e=>e.status===401);
 await assert.rejects(apiGet("/admin/articles"),e=>e.status===401);
 assert.equal(calls,1);assert.equal(expiredEvents,1);assert.equal(sessionExpired(),true);
 globalThis.fetch.mock.restore();t.mock.method(globalThis,"fetch",async()=>new Response('{"success":true}'));
 await apiPost("/auth/login",{});assert.equal(sessionExpired(),false);
 globalThis.fetch.mock.restore();t.mock.method(globalThis,"fetch",async()=>new Response('{"message":"Permission denied"}',{status:403}));
 await assert.rejects(apiGet("/admin/ai/config"),e=>e.status===403);assert.equal(sessionExpired(),false);
 resetSession();
});
test("login return paths reject external redirects and loops",()=>{
 for(const value of ["//evil.test","https://evil.test","/\\evil.test","/login?next=/","/api/cms/auth","javascript:alert(1)","/\n/evil.test"])assert.equal(safeReturnPath(value),"/");
 assert.equal(safeReturnPath("/articles/new?trend=story"),"/articles/new?trend=story");
});

test("session cancellation during fetch or body reading becomes a handled 401",async(t)=>{
 for(const duringBody of [false,true]){
  resetSession();
  let started;
  const ready=new Promise(resolve=>{started=resolve;});
  t.mock.method(globalThis,"fetch",async(_url,{signal})=>{
   const pending=()=>new Promise((_resolve,reject)=>{
    signal.addEventListener("abort",()=>reject(signal.reason),{once:true});started();
   });
   return duringBody?{ok:true,headers:new Headers(),json:pending}:pending();
  });
  const checked=assert.rejects(apiGet("/admin/articles"),error=>error.status===401&&error.name!=="AbortError");
  await ready;expireSession();await checked;
  globalThis.fetch.mock.restore();
 }
 resetSession();
});

test("parallel session probes finish without aborting or restoring an expired session",async(t)=>{
 resetSession();t.after(resetSession);
 let release,probeSignal;
 t.mock.method(globalThis,"fetch",async(_url,{signal})=>{
  probeSignal=signal;
  return new Promise(resolve=>{release=resolve;});
 });
 const checked=assert.rejects(apiGet("/auth/me"),error=>error.status===401);
 expireSession();assert.equal(probeSignal.aborted,false);
 release(new Response('{"success":true,"data":{"name":"Stale session"}}'));
 await checked;assert.equal(sessionExpired(),true);
});

test("RSS redirects stay on the original HTTPS origin and RSS path",async(t)=>{
 let calls=0;t.mock.method(globalThis,"fetch",async()=>++calls===1?new Response("",{status:302,headers:{location:"https://news.google.com/rss/topics/safe"}}):new Response(`<rss><channel><item><title>Current headline</title><link>https://source.test/story</link><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`));
 assert.equal((await trendProviders[3].fetch("IN")).length,1);assert.equal(calls,2);
 globalThis.fetch.mock.restore();t.mock.method(globalThis,"fetch",async()=>new Response("",{status:302,headers:{location:"http://127.0.0.1/private"}}));
 await assert.rejects(trendProviders[3].fetch("IN"),/Unsafe feed redirect/);
});
