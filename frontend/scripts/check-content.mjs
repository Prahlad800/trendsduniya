import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../data/topics.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}}; vm.runInNewContext(compiled,context);
const topics=JSON.parse(JSON.stringify(context.exports.topics));
const categories=['Sports','Entertainment','Technology','Automobile','Education','Science','Health','Business','Finance','India','World','Lifestyle'];
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,`Duplicate ${label}`);
unique(topics.map(t=>t.id),'id'); unique(topics.map(t=>t.slug),'slug');
unique(topics.map(t=>t.excerpt),'excerpt'); unique(topics.map(t=>t.introduction),'introduction');
const slugs=new Set(topics.map(t=>t.slug));
const forbidden=['search'+'Volume','gro'+'wth','sta'+'tus'];
for(const t of topics){
  assert(t.title.trim()&&t.excerpt.trim()&&t.introduction.trim(),`${t.slug}: missing copy`);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug),`${t.slug}: invalid slug`);
  assert(['en','hi'].includes(t.language)); assert(categories.includes(t.category));
  assert(!forbidden.some(f=>Object.hasOwn(t,f)),`${t.slug}: prohibited field`);
  assert(t.sections.length>0); unique(t.sections.map(s=>s.heading),`${t.slug} heading`);
  for(const s of t.sections){assert(s.heading.trim()); assert(s.paragraphs.length>0&&s.paragraphs.every(p=>p.trim()));}
  assert(t.relatedTopics.every(s=>slugs.has(s)&&s!==t.slug),`${t.slug}: invalid related link`);
  unique(t.relatedTopics,`${t.slug} relation`);
  assert(t.sources?.length>0,`${t.slug}: missing sources`);
  for(const s of t.sources){assert(s.name.trim());assert.equal(new URL(s.url).protocol,'https:');}
  assert(Number.isFinite(Date.parse(t.publishedAt))&&Number.isFinite(Date.parse(t.updatedAt)));
  assert(Date.parse(t.updatedAt)>=Date.parse(t.publishedAt));
  assert(Date.parse(t.publishedAt)<=Date.now(),`${t.slug}: future publication date`);
  if(t.image){assert(t.imageAlt?.trim(),`${t.slug}: missing image alt`);assert(t.image.startsWith('/'),`${t.slug}: use a licensed local image`);}
}
for(const category of categories)assert(topics.some(t=>t.category===category),`Empty category ${category}`);
const paragraphs=topics.flatMap(t=>[t.introduction,...t.sections.flatMap(s=>s.paragraphs)]);
unique(paragraphs,'article paragraph');
const report={total:topics.length,hindi:topics.filter(t=>t.language==='hi').length,english:topics.filter(t=>t.language==='en').length,categories,indexable:topics.filter(t=>t.indexable!==false).length,noindex:topics.filter(t=>t.indexable===false).map(t=>t.slug),articles:topics.map(t=>({slug:t.slug,words:[t.introduction,...t.sections.flatMap(s=>s.paragraphs)].join(' ').split(/\s+/u).length,sourceCount:t.sources.length}))};
console.log(JSON.stringify(report,null,2));
