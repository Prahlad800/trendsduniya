import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const origin=process.env.QA_ORIGIN||'http://localhost:3000';
const output=path.resolve('test-results');fs.mkdirSync(output,{recursive:true});
const code=ts.transpileModule(fs.readFileSync('data/topics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}};vm.runInNewContext(code,context);const topics=JSON.parse(JSON.stringify(context.exports.topics));
const results=[];
const sitemap=await (await fetch(`${origin}/sitemap.xml`)).text();
const siteOrigin=process.env.NEXT_PUBLIC_SITE_URL||'https://trendsduniya.com';
for(const topic of topics){
 const route=`/topic/${topic.slug}`;const response=await fetch(origin+route);assert.equal(response.status,200,route);const html=await response.text();
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${route}: H1 count`);
 assert(html.includes(`<h1>${topic.title}</h1>`),`${route}: exact headline`);
 assert(html.includes(`href="${siteOrigin}${route}"`),`${route}: canonical`);
 assert.equal(sitemap.includes(`${siteOrigin}${route}</loc>`),topic.indexable!==false,`${route}: sitemap indexing`);
 if(topic.indexable===false)assert(html.includes('noindex, follow'),`${route}: robots`);
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));
 assert(schemas.some(s=>s['@type']==='Article'&&s.headline===topic.title),`${route}: Article JSON-LD`);
 assert(schemas.some(s=>s['@type']==='BreadcrumbList'),`${route}: breadcrumb JSON-LD`);
 results.push({route,passed:true});
}
for(const route of ['/','/latest','/search','/about','/contact','/privacy-policy','/terms','/disclaimer','/editorial-policy','/corrections-policy',...Array.from(new Set(topics.map(t=>`/category/${t.category.toLowerCase()}`)))]){
 const response=await fetch(origin+route);assert.equal(response.status,200,route);const html=await response.text();assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${route}: H1`);results.push({route,passed:true});
}
for(const route of ['/topic/not-a-real-story','/category/not-a-category'])assert.equal((await fetch(origin+route)).status,404,route);
const pages=await (await fetch('http://localhost:9222/json/list')).json();const page=pages.find(p=>p.type==='page');assert(page,'Start a headless Chrome on debug port 9222');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();const browserErrors=[];
ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const task=pending.get(message.id);pending.delete(message.id);if(message.error)task.reject(new Error(JSON.stringify(message.error)));else task.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')browserErrors.push(message.params.exceptionDetails.text);else if(message.method==='Log.entryAdded'&&message.params.entry.level==='error')browserErrors.push(message.params.entry.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function navigate(route){await send('Page.navigate',{url:origin+route});for(let i=0;i<80;i++){await pause(150);if(await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'&&!!document.querySelector('h1')`))return;}throw new Error(`Navigation timeout: ${route}`);}
async function screenshot(name,width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});await pause(200);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${name}: horizontal overflow`);const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,`${name}.png`),Buffer.from(result.data,'base64'));}
await navigate('/');assert(await evaluate("!document.querySelector('script[src*=\"pagead2\"]')"),'no ads without configured ID');await screenshot('homepage-desktop',1440,1050);await screenshot('homepage-mobile',390,844);
await evaluate("document.querySelector('.menu-button').click()");await pause(200);assert(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')==='true'"),'mobile menu opens');
await evaluate("document.querySelector('#main-nav a[href=\"/latest\"]').click()");await pause(400);assert(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')==='false'"),'mobile menu closes');
await navigate('/search');await pause(300);
await evaluate("(()=>{const e=document.querySelector('#story-search');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Kia');e.dispatchEvent(new Event('input',{bubbles:true}));})()");await pause(300);
assert(await evaluate("[...document.querySelectorAll('.story-grid h3')].some(e=>e.textContent==='Kia Sorento')"),'Kia search');
assert(await evaluate("document.querySelectorAll('.story-grid .topic-card').length<50"),'search filters');
await evaluate("document.querySelector('.search-form button').click();document.querySelectorAll('.language-filter button')[1].click()");await pause(300);
assert(await evaluate("[...document.querySelectorAll('.story-grid article')].every(e=>e.lang==='hi')"),'Hindi filter');
await screenshot('search-mobile',390,844);
await navigate('/topic/kia-sorento');await screenshot('article-desktop',1440,1050);await screenshot('article-mobile',390,844);
await navigate('/topic/shikshak-diwas');await screenshot('hindi-mobile',390,844);assert(await evaluate("document.querySelector('.article-body').lang==='hi'"),'Hindi language attribute');
await navigate('/contact');assert(await evaluate("!document.querySelector('form')&&!document.querySelector('a[href^=\"mailto:\"]')"),'no fake contact');
assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
ws.close();const report={routes:results.length,articles:topics.length,unknownRoutes:'404 verified',search:'passed',languageFilter:'passed',mobileMenu:'passed',horizontalOverflow:'none at tested widths',browserErrors,screenshots:6,results};
fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
