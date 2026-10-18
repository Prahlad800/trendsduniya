import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import env from '../src/config/env.js';
import {generateText,groqStatus,testGroq} from '../src/services/groq.service.js';
const secret='fixture-groq-key-not-real';
const response=(text='OK',finish='stop')=>new Response(JSON.stringify({choices:[{message:{content:text},finish_reason:finish}],usage:{prompt_tokens:2,completion_tokens:3}}));
beforeEach(()=>{env.groq={apiKey:secret,model:'test-model'};});
test('all features use the fixed Groq endpoint and environment model',async t=>{
 const requests=[];t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(new Headers(options.headers).get('Authorization'),'Bearer '+secret);assert.equal(options.redirect,'error');requests.push(JSON.parse(options.body));return response();
 });
 assert.equal((await testGroq()).connected,true);
 const result=await generateText({system:'Return JSON',input:'article',json:true});await generateText({system:'Return JSON',input:'trending',json:true});
 assert.deepEqual(result.usage,{inputTokens:2,outputTokens:3,totalTokens:5});
 assert.ok(requests.every(r=>r.messages[1].role==='user'&&r.messages[0].content&&r.model==='test-model'));
 assert.equal(requests[1].messages[0].content,'Return JSON');assert.equal(requests[1].messages[1].content,'article');
 assert.equal(requests[0].max_completion_tokens,1024);assert.equal(requests[0].response_format,undefined);
 assert.equal(requests[1].response_format.type,'json_object');
 assert.deepEqual(groqStatus(),{provider:'Groq',model:'test-model',configured:true});assert.ok(!JSON.stringify(groqStatus()).includes(secret));
});
test('missing key and model fail before any network request',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('unexpected network');});
 for(const field of ['apiKey','model']){const value=env.groq[field];env.groq[field]='';await assert.rejects(testGroq(),e=>e.errorCode==='CONFIGURATION_ERROR'&&e.statusCode===503);assert.equal(groqStatus().configured,false);env.groq[field]=value;}
});
test('upstream failures are classified without leaking secrets or retrying',async t=>{
 const logs=[];t.mock.method(console,'warn',v=>logs.push(v));
 for(const [status,code,expected] of [[401,'','INVALID_API_KEY'],[403,'','ACCESS_DENIED'],[429,'','RATE_LIMITED'],[404,'','MODEL_NOT_FOUND'],[408,'','PROVIDER_TIMEOUT'],[400,'','INVALID_REQUEST']]){
  let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(JSON.stringify({error:{code,message:secret}}),{status});});
  await assert.rejects(testGroq(),e=>e.errorCode===expected&&!e.message.includes(secret));assert.equal(calls,1);globalThis.fetch.mock.restore();
 }
 assert.ok(!logs.join('').includes(secret));
});

test('temporary server failures retry the same request and recover',async t=>{
 let calls=0;const bodies=[];
 t.mock.method(globalThis,'fetch',async(_url,options)=>{bodies.push(options.body);return ++calls===1?new Response(JSON.stringify({error:{code:503}}),{status:503}):response();});
 assert.equal((await testGroq()).connected,true);assert.equal(calls,2);assert.equal(bodies[0],bodies[1]);
});

test('persistent server failures stop after three attempts',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(JSON.stringify({error:{code:503,message:secret}}),{status:503});});
 await assert.rejects(testGroq(),e=>e.errorCode==='PROVIDER_UNAVAILABLE'&&!e.message.includes(secret));assert.equal(calls,3);
});

test('cancellation stops retry backoff before another request',async t=>{
 let calls=0;const controller=new AbortController();
 t.mock.method(globalThis,'fetch',async()=>{calls++;controller.abort();return new Response(JSON.stringify({error:{code:503}}),{status:503});});
 await assert.rejects(generateText({system:'s',input:'u',signal:controller.signal}),e=>e.errorCode==='PROVIDER_TIMEOUT');assert.equal(calls,1);
});
test('Groq API key details and HTTP 200 errors remain safe',async t=>{
 for(const [status,error,expected] of [[200,{code:429,message:secret},'RATE_LIMITED'],[400,{code:'invalid_api_key',message:secret},'INVALID_API_KEY']]){
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error}),{status}));await assert.rejects(testGroq(),e=>e.errorCode===expected&&!e.message.includes(secret));globalThis.fetch.mock.restore();
 }
});

test('network and aborted requests return safe errors',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw Error(secret);});
 await assert.rejects(testGroq(),e=>e.errorCode==='PROVIDER_UNREACHABLE'&&!e.message.includes(secret));
 await assert.rejects(generateText({system:'s',input:'u',signal:AbortSignal.abort()}),e=>e.errorCode==='PROVIDER_TIMEOUT');
});
test('invalid, oversized, refused and truncated output is rejected',async t=>{
 const cases=[[response(''),'INVALID_RESPONSE'],[response('partial','length'),'OUTPUT_TRUNCATED'],[response('no','content_filter'),'INVALID_RESPONSE'],[new Response('not json'),'INVALID_RESPONSE'],[new Response('null'),'INVALID_RESPONSE'],[new Response('x'.repeat(3000001)),'INVALID_RESPONSE']];
 for(const [payload,expected] of cases){t.mock.method(globalThis,'fetch',async()=>payload);await assert.rejects(testGroq(),e=>e.errorCode===expected);globalThis.fetch.mock.restore();}
});


test('private reasoning is omitted and completion usage retains thinking tokens',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{reasoning:'private thinking',content:'OK'}}],usage:{prompt_tokens:2,completion_tokens:10,total_tokens:12}})));
 const result=await generateText({system:'s',input:'u'});assert.equal(result.text,'OK');assert.equal(result.usage.totalTokens,12);assert.ok(!JSON.stringify(result).includes('private thinking'));
});

test('refusals and unexpected tool calls are rejected even when content is present',async t=>{
 for(const extra of [{refusal:'Cannot answer'},{tool_calls:[{type:'function'}]}]){
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'unsafe',...extra}}]})));
  await assert.rejects(testGroq(),e=>e.errorCode==='INVALID_RESPONSE');globalThis.fetch.mock.restore();
 }
});

test('changing GROQ_MODEL changes the next request without a cached database model',async t=>{
 const models=[];t.mock.method(globalThis,'fetch',async(_url,options)=>{models.push(JSON.parse(options.body).model);return response();});
 await testGroq();env.groq.model='new-model';await testGroq();assert.deepEqual(models,['test-model','new-model']);
});

test('quota retry hints are retained without exposing the upstream body',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error:{message:secret}}),{status:429,headers:{'Retry-After':'45'}}));
 await assert.rejects(testGroq(),e=>e.errorCode==='RATE_LIMITED'&&e.retryable&&e.retryAfter===45000&&!e.message.includes(secret));
});
