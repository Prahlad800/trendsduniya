import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanHtml, cleanGeneratedHtml } from "../src/utils/sanitize.js";
import { parseGenerated } from "../src/services/ai/ai.service.js";

test("article typography and responsive table styles survive generation and save sanitizers", () => {
  const html='<h2 style="color:#0f172a;font-size:1.5rem;margin-top:32px">Details</h2><p style="line-height:1.8;padding:16px;background-color:#f1f5f9;border-left:3px solid #2563eb">Key facts.</p><table style="width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;overflow-wrap:anywhere"><tbody><tr><td style="padding:12px;border:1px solid #e2e8f0">Fact</td></tr></tbody></table>';
  const generated=cleanGeneratedHtml(html),saved=cleanHtml(generated);
  assert.equal(saved,generated);
  for(const value of ['font-size:1.5rem','line-height:1.8','background-color:#f1f5f9','border-left:3px solid #2563eb','width:100%','overflow-wrap:anywhere'])assert.ok(saved.includes(value));
});

test("inline styles cannot load URLs, execute code, hide content or cover the page", () => {
  const dirty='<p onclick="alert(1)" style="color:#334155;position:fixed;display:none;opacity:0;width:9999px;margin-top:-50px;background-image:url(https://tracker.test/a);padding:expression(alert(1));--evil:red">Visible</p><style>body{display:none}</style><script>alert(1)</script><img src="https://tracker.test/a"><a href="javascript:alert(1)">link</a>';
  for(const clean of [cleanHtml(dirty),cleanGeneratedHtml(dirty)]){
    assert.ok(clean.includes('color:#334155'));
    assert.doesNotMatch(clean,/onclick|position:|display:|opacity:|9999|-50|background-image|expression|--evil|<script|<style|javascript:/);
  }
  assert.doesNotMatch(cleanGeneratedHtml(dirty),/<img|href=/);
});

test("AI article parser preserves inline styles while enforcing its output contract",()=>{
  const article={title:"Article",slug:"article",excerpt:"An article.",summary:"Summary.",content:'<p style="line-height:1.8;color:#334155" onmouseover="alert(1)">Article text.</p>',articleType:"news",articleSection:"Technology",trendingTopic:"",seo:{searchIntent:"news",searchIntentDescription:"Read the article",primaryKeyword:"article",relatedKeywords:[],relatedTopics:[],metaTitle:"Article",metaDescription:"An article."},suggestedTags:[],editorialNotes:""};
  const result=parseGenerated(JSON.stringify(article),{internal:[],external:[]});
  assert.ok(result.content.includes('style="line-height:1.8;color:#334155"'));
  assert.ok(!result.content.includes('onmouseover'));
  assert.equal(cleanHtml(result.content),result.content);
});
