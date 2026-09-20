import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {load} from 'cheerio';
const run=promisify(execFile);
const all=JSON.parse(await fs.readFile('docs/content/source-candidates.json','utf8'));
const ids=[82,88,117,131,133,134,217,218,236,248,250,251,256,261,270,278,300,301,302,303,304,305,306,307,315,320,331,339,341,374,376,379,382,394,396,397,435,598,599,610,616,642,646,651,653,808,845,847,858,862];
const selected=ids.map(n=>({...all[n-43],id:n,url:all[n-43].url.replace('PressReleseDetail','PressReleasePage')}));
await fs.mkdir('docs/content/research',{recursive:true});
for(let start=0;start<selected.length;start+=4){
 await Promise.all(selected.slice(start,start+4).map(async(s)=>{
  const path=`docs/content/research/${s.id}.json`;
  try{await fs.access(path);return;}catch{}
  try{const{stdout}=await run('curl.exe',['-fsSL','--max-time','25',s.url],{encoding:'utf8',maxBuffer:3000000});const $=load(stdout);$('script,style').remove();
   const body=$('.innner-page-main-about-us').text()||$('.readcontent').text()||$('body').text();
   await fs.writeFile(path,JSON.stringify({...s,text:body.replace(/\s+/g,' ').trim()},null,2));
   console.log(`Fetched ${s.id}`);
  }catch{console.log(`FAILED ${s.id}`);}
 }));
}
await fs.writeFile('docs/content/selected-sources.json',JSON.stringify(selected,null,2));
