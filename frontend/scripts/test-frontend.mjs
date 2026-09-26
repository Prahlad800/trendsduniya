// Isolated public API fixtures: this suite never writes to the project database.
import assert from "node:assert/strict";
import http from "node:http";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "@playwright/test";
const categories=["India","World","Business","Technology","Sports","Entertainment","Lifestyle","Education","Auto","Health","Politics"].map((name,i)=>({_id:String(i+1).padStart(24,"0"),name,slug:name.toLowerCase(),description:"News from the test newsroom."}));
const articles=Array.from({length:28},(_,i)=>({id:(i+100).toString(16).padStart(24,"0"),slug:"test-story-"+i,title:i===1?"टेस्ट समाचार: भारत में तकनीक और शिक्षा की नई पहल":`Test report ${i+1}: The developments shaping our world and what comes next`,excerpt:"A test-only summary used to verify responsive news layouts. These fixtures are never published to the database.",content:"<p>This is an isolated integration test article, not a published news report.</p><h2>What you need to know</h2><p>Readable article content for verifying the page layout and sharing controls.</p>",category:categories[i%4],tags:[{_id:"tag-1",name:"Technology",slug:"technology"},{_id:"tag-2",name:"India news",slug:"india-news"}],author:{name:"Test Editor",slug:"test-editor",bio:"Test newsroom author."},language:i===1?"hi-IN":"en-IN",publishedAt:"2026-09-25T08:00:00.000Z",updatedAt:"2026-09-26T08:00:00.000Z",readingTime:3,articleType:"news",seo:{robots:{index:true,follow:true}},media:{}}));
articles[0].content='<h1>Untrusted heading</h1><p>A test paragraph with <strong>bold</strong> text.</p><h2>Test analysis</h2><ul><li>First point</li></ul><blockquote>A test quotation.</blockquote><table><thead><tr><th>Topic</th><th>Result</th></tr></thead><tbody><tr><td>Responsive</td><td>Verified</td></tr></tbody></table><script>window.articleXss=true</script><iframe src="https://example.com"></iframe><a href="javascript:alert(1)">Unsafe link</a>';
let articleDelay=0;
let mode="normal",viewCount=0,browser,child;const errors=[];const checks=[];let logs="";
const api=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost");res.setHeader("Content-Type","application/json");
 const send=(data,status=200,extra={})=>{res.statusCode=status;res.end(JSON.stringify({data,...extra}));};
 if(mode==="error")return send(null,503,{message:"Internal database secret must never appear in UI"});
 if(url.pathname==="/api/categories")return send(mode==="empty"?[]:categories);
 if(url.pathname.startsWith("/api/categories/")){const c=categories.find(c=>c.slug===url.pathname.split("/").pop());return send(c,c?200:404);}
 if(url.pathname==="/api/authors")return send([{_id:"author-1",...articles[0].author}]);
 if(url.pathname==="/api/authors/test-editor")return send(articles[0].author);
 if(url.pathname.startsWith("/api/tags/"))return send({name:"Technology",slug:"technology"});
 if(req.method==="POST"&&url.pathname.endsWith("/view")){viewCount++;return send(null);}
 if(url.pathname.startsWith("/api/articles/")&&!/\/(search|category|tag|author)(\/|$)/.test(url.pathname)){
  const slug=url.pathname.split("/")[3];const article=articles.find(a=>a.slug===slug);
  if(articleDelay&&!url.pathname.endsWith("/related")){setTimeout(()=>send(article,article?200:404),articleDelay);return;}
  return send(url.pathname.endsWith("/related")?articles.slice(1,4):article,article?200:404);
 }
 if(url.pathname.startsWith("/api/articles")){
  let data=mode==="empty"?[]:[...articles];
  if(url.pathname.includes("/category/"))data=data.filter(a=>a.category.slug===url.pathname.split("/").pop());
  const q=url.searchParams.get("q");if(q)data=data.filter(a=>a.title.toLowerCase().includes(q.toLowerCase()));
  if(url.searchParams.get("sort")==="-analytics.views")data.reverse();
  const page=Number(url.searchParams.get("page")||1),limit=Number(url.searchParams.get("limit")||12),total=data.length;
  return send(data.slice((page-1)*limit,page*limit),200,{pagination:{page,limit,total,totalPages:Math.ceil(total/limit),hasNextPage:page*limit<total}});
 }
 return send(null,404);
});
await new Promise(resolve=>api.listen(0,"127.0.0.1",resolve));
const reserve=http.createServer();await new Promise(resolve=>reserve.listen(0,"127.0.0.1",resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
const base="http://localhost:"+port;
const record=label=>{checks.push(label);console.log("PASS "+label);};
try {
 child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port)],{cwd:process.cwd(),env:{...process.env,API_URL:`http://127.0.0.1:${api.address().port}/api`},windowsHide:true,stdio:["ignore","pipe","pipe"]});
 for(const stream of [child.stdout,child.stderr])stream.on("data",chunk=>logs+=chunk);
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error("Startup timeout: "+logs)),90000);const ready=chunk=>{if(chunk.toString().includes("Ready")){clearTimeout(timeout);resolve();}};child.stdout.on("data",ready);child.on("exit",code=>{clearTimeout(timeout);reject(Error("Next exited "+code+": "+logs));});});
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||"msedge",headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on("pageerror",e=>errors.push(e.message));
 await mkdir("test-results",{recursive:true});
 await page.goto(base,{waitUntil:"networkidle",timeout:90000});
 await page.locator(".hero-controls").waitFor();
 assert.equal(await page.locator(".featured-side .story-card").count(),3);
 assert.equal(await page.locator(".trending-pills a").count(),2);
 await page.getByRole("button",{name:"Next featured story",exact:true}).click();
 assert.equal(await page.locator(".hero-slide:not([hidden])").innerText().then(t=>t.includes("टेस्ट समाचार")),true);
 await page.getByRole("button",{name:"Previous featured story",exact:true}).click();record("Dynamic homepage, tags, featured cards and accessible hero controls");
 for(const width of [320,360,375,390,414,430,768,820,912,1024,1280,1366,1440,1536,1920]){
  await page.setViewportSize({width,height:950});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Homepage overflow at "+width);
 }
 record("Homepage has no horizontal overflow at all 15 requested widths");
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"test-results/desktop.png",fullPage:true});
 await page.getByRole("button",{name:"Switch to dark theme"}).click();assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");await page.getByRole("button",{name:"Switch to light theme"}).click();record("Theme toggle");
 await page.setViewportSize({width:375,height:812});
 await page.getByRole("button",{name:"Open search",exact:true}).click();await page.locator("#mobile-search input").fill("report 10");
 await Promise.all([page.waitForURL(/\/search\?q=/),page.locator("#mobile-search button").click()]);
 assert.equal(await page.locator(".stories-grid .story-card").count(),1);record("Mobile search returns matching API content");
 await page.goto(base,{waitUntil:"networkidle"});
 await page.locator(".masthead").getByRole("button",{name:"Open menu"}).click();assert.ok(await page.locator("#mobile-menu").isVisible());await page.keyboard.press("Escape");assert.equal(await page.locator("#mobile-menu").count(),0);
 await page.locator(".mobile-bottom-nav").getByRole("button",{name:"Open menu"}).click();await page.locator("#mobile-menu").getByRole("link",{name:"Technology",exact:true}).click();await page.waitForURL(/categories\/technology/);record("Hamburger, Escape dismissal and bottom menu category navigation");
 for(const route of ["/categories/india","/article/test-story-0"]){
  await page.goto(base+route,{waitUntil:"networkidle"});
  for(const width of [320,360,375,390,414,430,768,820,912,1024,1280,1366,1440,1536,1920]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+" overflow "+width);}
 }
 assert.ok(await page.locator('script[type="application/ld+json"]').count()>=2);
 assert.equal(await page.locator('meta[property="og:type"]').getAttribute("content"),"article");
 await page.getByRole("button",{name:"Save story",exact:true}).click();await page.goto(base+"/saved");assert.ok(await page.getByRole("heading",{name:articles[0].title}).isVisible());record("Article layout, metadata, JSON-LD and saved-story persistence");

 await page.goto(base+"/article/test-story-0",{waitUntil:"networkidle"});
 assert.equal(await page.locator("h1").count(),1);
 assert.equal(await page.locator(".prose script,.prose iframe").count(),0);
 assert.equal(await page.locator('.prose a[href^="javascript:"]').count(),0);
 assert.equal(await page.evaluate(()=>window.articleXss),undefined);
 assert.ok(await page.locator(".prose table").isVisible());
 assert.ok(await page.locator(".prose blockquote").isVisible());
 for(const name of ["Facebook","X","WhatsApp","LinkedIn"]){const link=page.getByRole("link",{name:"Share on "+name,exact:true});assert.ok((await link.getAttribute("href")).startsWith("https://"));assert.equal(await link.getAttribute("rel"),"noopener noreferrer");}
 await page.context().grantPermissions(["clipboard-read","clipboard-write"]);
 await page.getByRole("button",{name:"Copy article link"}).click();
 assert.ok(await page.getByText("Link copied!",{exact:true}).isVisible());
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+"/article/test-story-0");
 record("Article sanitization, semantic formatting, share destinations and Copy Link");
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"test-results/article-desktop.png",fullPage:true});
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:"test-results/article-mobile.png",fullPage:true});
 const oldAuthor=articles[0].author,oldExcerpt=articles[0].excerpt;
 delete articles[0].author;delete articles[0].excerpt;
 await page.reload({waitUntil:"networkidle"});
 assert.equal(await page.locator(".article-author").count(),0);
 assert.ok((await page.locator(".article-summary").innerText()).includes("test paragraph"));
 assert.ok(await page.locator(".article-detail-hero .image-fallback").isVisible());
 record("Missing author, summary and hero image fallbacks");
 articles[0].author=oldAuthor;articles[0].excerpt=oldExcerpt;
 mode="error";await page.goto(base+"/article/test-story-0",{waitUntil:"networkidle"});
 assert.ok(await page.getByRole("heading",{name:"Unable to load this article right now.",exact:true}).isVisible());
 mode="normal";await page.getByRole("button",{name:"Retry",exact:true}).click();await page.locator(".article-detail-header").waitFor();
 record("Article-specific API failure and retry recovery");

 const viewResponse=await page.request.post(base+"/api/articles/"+articles[0].id+"/view");assert.equal(viewResponse.status(),204);assert.ok(viewCount>0);assert.equal((await page.request.post(base+"/api/articles/invalid/view")).status(),400);record("Same-origin view tracker reaches only fixture API and rejects invalid IDs");
 await page.goto(base+"/latest",{waitUntil:"networkidle"});await page.getByRole("link",{name:/Next/}).click();await page.waitForURL(/page=2/);assert.equal(await page.locator(".story-card").count(),12);record("Latest-news pagination");
 await page.goto(base+"/trending",{waitUntil:"networkidle"});assert.ok((await page.locator(".story-card h2").first().innerText()).includes("report 28"));record("Trending sort uses API view ranking");
 await page.goto(base+"/search?q=zzzz-no-match",{waitUntil:"networkidle"});assert.ok(await page.getByRole("heading",{name:"No stories found."}).isVisible());record("Search empty state");
 for(const route of ["/about","/authors","/authors/test-editor","/tags/technology","/categories","/sitemap.xml","/robots.txt"]){const response=await page.request.get(base+route);assert.equal(response.status(),200,route);}
 await page.goto(base+"/news/test-story-0",{waitUntil:"networkidle"});await page.waitForURL(/\/article\/test-story-0/);
 await page.goto(base+"/article/not-a-story",{waitUntil:"networkidle"});assert.ok(await page.getByRole("heading",{name:"Article Not Found",exact:true}).isVisible());record("Existing routes, sitemap, robots, legacy redirect and missing article");
 mode="error";await page.goto(base,{waitUntil:"networkidle"});assert.ok(await page.getByRole("heading",{name:"Unable to load news right now."}).isVisible());assert.ok(!(await page.locator("body").innerText()).includes("Internal database secret"));
 mode="normal";await page.getByRole("button",{name:"Retry",exact:true}).click();await page.locator(".hero-carousel").waitFor();record("API failure hides backend details; Retry recovers current page");
 articleDelay=2500;await page.goto(base+"/article/test-story-2",{waitUntil:"commit"});await page.getByRole("main",{name:"Loading article"}).waitFor();await page.locator(".article-detail-header").waitFor();articleDelay=0;record("Article loading skeleton streams before delayed API response");
 mode="empty";await page.goto(base,{waitUntil:"networkidle"});assert.ok(await page.getByRole("heading",{name:"No news available right now."}).isVisible());record("Empty newsroom state");
 mode="normal";articles[0].featuredImage={url:"https://res.cloudinary.com/demo/image/upload/fixture-missing-image.jpg",alt:"Missing test image"};
 await page.route("**/_next/image?*",route=>route.fulfill({status:404,body:"test missing image"}));
 await page.goto(base,{waitUntil:"networkidle"});await page.locator(".hero-slide").first().locator(".image-fallback").waitFor();record("Failed article image renders branded fallback");
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:"test-results/mobile.png",fullPage:true});
 assert.deepEqual(errors,[]);record("No browser JavaScript or hydration errors");
 await writeFile("test-results/report.json",JSON.stringify({checks,errors,widths:[320,360,375,390,414,430,768,820,912,1024,1280,1366,1440,1536,1920]},null,2));
 console.log(checks.length+" checks passed.");
} catch(error){console.error(logs.slice(-3000));throw error;}
finally{await browser?.close();child?.kill();await new Promise(resolve=>api.close(resolve));}
