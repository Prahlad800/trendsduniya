import { load } from 'cheerio';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const base='https://www.pib.gov.in';
const html=execFileSync('curl.exe',['-fsSL','--max-time','30',base+'/AllRelease.aspx?MenuId=23&PMO=1&lang=1&reg=1'],{encoding:'utf8',maxBuffer:5000000});
const $=load(html);
const links=[];
$('a[href*="PRID="]').each((_,el)=>{
 const a=$(el),title=a.text().trim(),row=a.closest('li').text().trim(),date=row.match(/Posted on:\s*(\d{1,2}\s+\w+\s+\d{4})/i)?.[1];
 if(title&&date)links.push({title,date,url:new URL(a.attr('href'),base).href});
});
await fs.mkdir('docs/content',{recursive:true});
await fs.writeFile('docs/content/source-candidates.json',JSON.stringify(links,null,2));
console.log(JSON.stringify(links.map((x,i)=>({i,...x})),null,2));
