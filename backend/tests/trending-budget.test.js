import {test} from "node:test";
import assert from "node:assert/strict";
import env from "../src/config/env.js";
import {generateText} from "../src/services/groq.service.js";
import {selectTrendingTopics} from "../src/services/trending/aiRanking.service.js";
import {providerRequests,worldRegions} from "../src/services/trending/providers/index.js";
const selected=()=>({topics:Array.from({length:5},(_,candidateId)=>({candidateId,title_en:"News "+candidateId,title_hi:"समाचार "+candidateId,why_trending_hi:"हाल की विश्वसनीय खबरों में चर्चा।",article_angle_hi:"खबर की पृष्ठभूमि समझाएँ।",category:"Technology",trend_score:100-candidateId,why_trending:"Current supplied source coverage",search_keywords:["technology","news"],article_angle:"Explain the supplied update",language_priority:"Hindi"}))});
const sourceCandidates=()=>Array.from({length:120},(_,i)=>({title:`Independent technology development ${i}`,score:100-i/2,sources:[{provider:"googleNews",title:`Development ${i}`,url:`https://news.google.com/rss/articles/${"a".repeat(2000)}-${i}`},{provider:"bbcNews",title:`Development ${i}`,url:`https://example.org/article/${i}`}]}));
function configure(t){const previous=env.groq;env.groq={apiKey:"fixture-key",model:"openai/gpt-oss-120b"};t.after(()=>{env.groq=previous;});}
const response=body=>Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(body)}}]});
test("trending request fits a bounded budget and preserves complete source URLs in selected topics",async t=>{
 configure(t);const candidates=sourceCandidates();
 t.mock.method(globalThis,"fetch",async(_url,options)=>{
  const body=JSON.parse(options.body),input=JSON.parse(body.messages[1].content);
  assert.equal(body.max_completion_tokens,3072);assert.equal(body.reasoning_effort,"low");assert.equal(input.candidates.length,40);
  assert.ok(options.body.length<16000);assert.ok(!options.body.includes("a".repeat(2000)));assert.equal(input.candidates[0].sourceCount,2);
  return response(selected());
 });
 const result=await selectTrendingTopics(candidates,{country:"IN",date:"2026-10-16",now:new Date()});
 assert.equal(result.topics.length,5);assert.equal(result.topics[0].sources[0].url,candidates[0].sources[0].url);
});
test("IDs outside the supplied shortlist cannot enter saved trends",async t=>{
 configure(t);const invalid=selected();invalid.topics[4].candidateId=100;let calls=0;
 t.mock.method(globalThis,"fetch",async()=>{calls++;return response(invalid);});
 await assert.rejects(selectTrendingTopics(sourceCandidates(),{country:"IN",date:"2026-10-16",now:new Date()}),e=>e.errorCode==="INVALID_RESPONSE");assert.equal(calls,2);
});
test("Groq request-size rejection explains the budget and does not retry the same oversized request",async t=>{
 configure(t);let calls=0;
 t.mock.method(globalThis,"fetch",async()=>{calls++;return Response.json({error:{code:"rate_limit_exceeded",message:"private account details"}},{status:413});});
 await assert.rejects(generateText({system:"Return JSON",input:"{}",json:true}),e=>e.errorCode==="REQUEST_TOO_LARGE"&&e.statusCode===413&&!e.retryable&&!e.message.includes("private account details"));assert.equal(calls,1);
});
test("non-probe requests default to a modest configurable output budget",async t=>{
 configure(t);env.groq.maxCompletionTokens=2048;
 t.mock.method(globalThis,"fetch",async(_url,options)=>{assert.equal(JSON.parse(options.body).max_completion_tokens,2048);return response({ok:true});});
 await generateText({system:"Return JSON",input:"{}",json:true});
});
test("worldwide research includes a global news feed and excludes bare search queries",async()=>{
 let globalCalls=0;
 const providers=[{name:"googleTrends",fetch:()=>assert.fail("Bare search queries must not enter world news selection")},{name:"bbcWorld",worldOnly:true,fetch:async()=>{globalCalls++;return [{title:"Global development"}];}},{name:"news",fetch:async region=>[{title:`Current news in ${region}`}]}];
 const requests=providerRequests("WORLD",providers);assert.equal(requests.length,worldRegions.length+1);assert.equal(requests[0].name,"WORLD:bbcWorld");
 const result=await Promise.all(requests.map(p=>p.fetch()));assert.equal(globalCalls,1);assert.equal(result[0][0].region,"WORLD");assert.deepEqual(new Set(result.slice(1).map(items=>items[0].region)),new Set(worldRegions));
 const regional=providerRequests("IN",providers);assert.ok(regional.some(p=>p.name==="googleTrends"));assert.ok(!regional.some(p=>p.name==="bbcWorld"));
});
