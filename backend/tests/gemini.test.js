import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import env from '../src/config/env.js';
import {generateText,geminiStatus,testGemini} from '../src/services/gemini.service.js';
const secret='fixture-gemini-key-not-real';
const response=(text='OK',finish='STOP')=>new Response(JSON.stringify({candidates:[{content:{parts:[{text}]},finishReason:finish}],usageMetadata:{promptTokenCount:2,candidatesTokenCount:3}}));
beforeEach(()=>{env.gemini={apiKey:secret,model:'test-model'};});
test('all features use the fixed Gemini endpoint and environment model',async t=>{
 const requests=[];t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent');assert.equal(new Headers(options.headers).get('x-goog-api-key'),secret);assert.equal(options.redirect,'error');requests.push(JSON.parse(options.body));return response();
 });
 assert.equal((await testGemini()).connected,true);
 const result=await generateText({system:'Return JSON',input:'article',json:true});await generateText({system:'Return JSON',input:'trending',json:true});
 assert.deepEqual(result.usage,{inputTokens:2,outputTokens:3,totalTokens:5});
 assert.ok(requests.every(r=>r.contents[0].role==='user'&&r.systemInstruction.parts[0].text));
 assert.equal(requests[1].systemInstruction.parts[0].text,'Return JSON');assert.equal(requests[1].contents[0].parts[0].text,'article');
 assert.equal(requests[0].generationConfig.maxOutputTokens,1024);assert.equal(requests[0].generationConfig.responseMimeType,undefined);
 assert.equal(requests[1].generationConfig.responseMimeType,'application/json');
 assert.deepEqual(geminiStatus(),{provider:'Gemini',model:'test-model',configured:true});assert.ok(!JSON.stringify(geminiStatus()).includes(secret));
});
test('missing key and model fail before any network request',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('unexpected network');});
 for(const field of ['apiKey','model']){const value=env.gemini[field];env.gemini[field]='';await assert.rejects(testGemini(),e=>e.errorCode==='CONFIGURATION_ERROR'&&e.statusCode===503);assert.equal(geminiStatus().configured,false);env.gemini[field]=value;}
});
test('upstream failures are classified without leaking secrets or retrying',async t=>{
 const logs=[];t.mock.method(console,'warn',v=>logs.push(v));
 for(const [status,code,expected] of [[401,'','INVALID_API_KEY'],[403,'','ACCESS_DENIED'],[429,'','RATE_LIMITED'],[404,'','MODEL_NOT_FOUND'],[408,'','PROVIDER_TIMEOUT'],[400,'','INVALID_REQUEST']]){
  let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(JSON.stringify({error:{code,message:secret}}),{status});});
  await assert.rejects(testGemini(),e=>e.errorCode===expected&&!e.message.includes(secret));assert.equal(calls,1);globalThis.fetch.mock.restore();
 }
 assert.ok(!logs.join('').includes(secret));
});

test('temporary server failures retry the same request and recover',async t=>{
 let calls=0;const bodies=[];
 t.mock.method(globalThis,'fetch',async(_url,options)=>{bodies.push(options.body);return ++calls===1?new Response(JSON.stringify({error:{code:503}}),{status:503}):response();});
 assert.equal((await testGemini()).connected,true);assert.equal(calls,2);assert.equal(bodies[0],bodies[1]);
});

test('persistent server failures stop after three attempts',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(JSON.stringify({error:{code:503,message:secret}}),{status:503});});
 await assert.rejects(testGemini(),e=>e.errorCode==='PROVIDER_UNAVAILABLE'&&!e.message.includes(secret));assert.equal(calls,3);
});

test('cancellation stops retry backoff before another request',async t=>{
 let calls=0;const controller=new AbortController();
 t.mock.method(globalThis,'fetch',async()=>{calls++;controller.abort();return new Response(JSON.stringify({error:{code:503}}),{status:503});});
 await assert.rejects(generateText({system:'s',input:'u',signal:controller.signal}),e=>e.errorCode==='PROVIDER_TIMEOUT');assert.equal(calls,1);
});
test('Gemini API key details and HTTP 200 errors remain safe',async t=>{
 for(const [status,error,expected] of [[200,{code:429,message:secret},'RATE_LIMITED'],[400,{details:[{reason:'API_KEY_INVALID'}],message:secret},'INVALID_API_KEY']]){
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error}),{status}));await assert.rejects(testGemini(),e=>e.errorCode===expected&&!e.message.includes(secret));globalThis.fetch.mock.restore();
 }
});

test('network and aborted requests return safe errors',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw Error(secret);});
 await assert.rejects(testGemini(),e=>e.errorCode==='PROVIDER_UNREACHABLE'&&!e.message.includes(secret));
 await assert.rejects(generateText({system:'s',input:'u',signal:AbortSignal.abort()}),e=>e.errorCode==='PROVIDER_TIMEOUT');
});
test('invalid, oversized, refused and truncated output is rejected',async t=>{
 const cases=[[response(''),'INVALID_RESPONSE'],[response('partial','MAX_TOKENS'),'OUTPUT_TRUNCATED'],[response('no','SAFETY'),'INVALID_RESPONSE'],[new Response('not json'),'INVALID_RESPONSE'],[new Response('null'),'INVALID_RESPONSE'],[new Response('x'.repeat(3000001)),'INVALID_RESPONSE']];
 for(const [payload,expected] of cases){t.mock.method(globalThis,'fetch',async()=>payload);await assert.rejects(testGemini(),e=>e.errorCode===expected);globalThis.fetch.mock.restore();}
});

test('thought parts are omitted and total usage includes thinking tokens',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private thinking'},{text:'O'},{text:'K'}]}}],usageMetadata:{promptTokenCount:2,candidatesTokenCount:3,totalTokenCount:12}})));
 const result=await generateText({system:'s',input:'u'});assert.equal(result.text,'OK');assert.equal(result.usage.totalTokens,12);
});
test('blocked prompts are rejected even when a candidate is present',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({promptFeedback:{blockReason:'SAFETY'},candidates:[{finishReason:'STOP',content:{parts:[{text:'unsafe'}]}}]})));
 await assert.rejects(testGemini(),e=>e.errorCode==='INVALID_RESPONSE');
});
