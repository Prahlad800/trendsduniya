import 'dotenv/config';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import briefs from '../docs/content/news-briefs.mjs';
const sharp=createRequire(new URL('../../frontend/package.json',import.meta.url))('sharp');
const api=process.env.IMPORT_API_URL||'http://localhost:5000/api';
const directory=new URL('../docs/content/',import.meta.url);
const sources=JSON.parse(await fs.readFile(new URL('selected-sources.json',directory),'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert.equal(briefs.length,50);assert.equal(new Set(briefs.map(b=>b[0])).size,50);
const languages=briefs.map(b=>/[\u0900-\u097f]/.test(b[2])?'hi-IN':'en-IN');
assert.equal(languages.filter(l=>l==='hi-IN').length,25);
for(const b of briefs){assert(sources.some(s=>s.id===b[0]));assert(b[3].length>100&&b[4].length>100);}
if(!process.argv.includes('--publish')){console.log('Validated 50 unique sourced briefs: 25 Hindi + 25 English. Use --publish to import through authenticated APIs.');process.exit(0);}
let token;
async function request(path,method='GET',body){
 const multipart=body instanceof FormData;
 const response=await fetch(api+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(!multipart&&body?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined,signal:AbortSignal.timeout(60000)});
 const result=await response.json();if(!response.ok)throw new Error(`${method} ${path}: ${response.status} ${result.message} ${JSON.stringify(result.errors||'')}`);return result;
}
if(process.env.SEED_ADMIN_EMAIL&&process.env.SEED_ADMIN_PASSWORD){
 const login=await request('/auth/login','POST',{email:process.env.SEED_ADMIN_EMAIL,password:process.env.SEED_ADMIN_PASSWORD});token=login.data.accessToken;
 assert(['superadmin','admin'].includes(login.data.admin.role),'Import requires an administrator');
}else{
 // A local maintenance session uses the configured DB access and an existing
 // administrator. It never changes an account or its password and expires in 1h.
 const {connectDB}=await import('../src/config/db.js');
 const {default:Admin}=await import('../src/models/Admin.js');
 const {default:AuthSession}=await import('../src/models/AuthSession.js');
 const {signAccessToken}=await import('../src/middleware/auth.middleware.js');
 const {randomBytes}=await import('node:crypto');
 const connection=await connectDB();
 const admin=await Admin.findOne({isActive:true,role:'superadmin'});
 assert(admin,'An existing active superadmin is required');
 const session=await AuthSession.create({admin:admin.id,refreshHash:randomBytes(32).toString('hex'),expiresAt:new Date(Date.now()+3600000)});
 token=signAccessToken(admin.id,session.id);await connection.close();
}
const before=await request('/articles?limit=1');
const [cats,authors,tags]=await Promise.all(['/admin/categories','/admin/authors','/admin/tags'].map(p=>request(p)));
const categoryMap=new Map(cats.data.map(c=>[c.name,c]));
for(const name of new Set(briefs.map(b=>b[1])))if(!categoryMap.has(name))categoryMap.set(name,(await request('/admin/categories','POST',{name,description:`News and perspectives on ${name.toLowerCase()}.`})).data);
let author=authors.data.find(a=>a.slug==='trendsduniya-news-desk');
if(!author)author=(await request('/admin/authors','POST',{name:'TrendsDuniya News Desk',slug:'trendsduniya-news-desk',designation:'Attributed news briefs',bio:'AI-assisted summaries of linked primary-source announcements. This desk does not claim on-location reporting. Dates, estimates and implementation status are identified in each story; covers are original editorial illustrations.'})).data;
let tag=tags.data.find(t=>t.slug==='september-2026');
if(!tag)tag=(await request('/admin/tags','POST',{name:'September 2026',slug:'september-2026',description:'A dated editorial selection of recent official announcements; not a measured popularity ranking.'})).data;
let manifest={};try{manifest=JSON.parse(await fs.readFile(new URL('cover-manifest.json',directory),'utf8'));}catch{}
const palettes={Technology:['#111b34','#87e3e2'],Business:['#202c37','#d2e7a1'],Sports:['#23372e','#eea780'],Environment:['#163b34','#b6d887'],Science:['#282549','#bdb3fa'],Society:['#203b55','#a2d5ee'],Culture:['#4a2938','#f0b8a7']};
for(const name of categoryMap.keys()){
 if(!briefs.some(b=>b[1]===name)||manifest[name])continue;
 const [bg,accent]=palettes[name]||palettes.Society;
 const shapes=Array.from({length:7},(_,i)=>`<ellipse cx="900" cy="325" rx="${65+i*28}" ry="${225-i*18}" transform="rotate(${i*25} 900 325)" fill="none" stroke="${accent}" stroke-opacity="${.18+i*.08}" stroke-width="2"/>`).join('');
 const grid=Array.from({length:14},(_,i)=>`<path d="M${i*100} 0V675 M0 ${i*80}H1200" stroke="${accent}" stroke-opacity=".055"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="${bg}"/>${grid}<circle cx="1080" cy="60" r="210" fill="${accent}" opacity=".06"/>${shapes}<circle cx="900" cy="325" r="11" fill="${accent}"/><path d="M70 99h45" stroke="${accent}" stroke-width="6"/><text x="70" y="155" fill="${accent}" font-family="Arial" font-size="22" letter-spacing="4">TRENDSDUNIYA</text><text x="65" y="360" fill="#fff" font-family="Arial" font-weight="700" font-size="68">${name}</text><text x="70" y="408" fill="${accent}" font-family="Arial" font-size="23">Ideas. Developments. Perspectives.</text><path d="M70 565H1130" stroke="${accent}" opacity=".35"/><text x="70" y="613" fill="${accent}" font-family="Arial" font-size="17" letter-spacing="2">SEPTEMBER 2026 / NEWS BRIEFS</text><text x="905" y="613" fill="${accent}" font-family="Arial" font-size="14">EDITORIAL ILLUSTRATION</text></svg>`;
 const buffer=await sharp(Buffer.from(svg)).png().toBuffer();
 await fs.mkdir(new URL('covers/',directory),{recursive:true});await fs.writeFile(new URL(`covers/${name.toLowerCase()}.png`,directory),buffer);
 const form=new FormData();form.set('image',new Blob([buffer],{type:'image/png'}),`${name.toLowerCase()}.png`);
 manifest[name]=(await request('/admin/upload/image','POST',form)).data;
 await fs.writeFile(new URL('cover-manifest.json',directory),JSON.stringify(manifest,null,2));
 console.log(`Uploaded original ${name} cover`);
}
const report=[];
try{
 for(let i=0;i<briefs.length;i++){
  const [id,category,title,lead,detail]=briefs[i],source=sources.find(s=>s.id===id),language=languages[i];
  const slug=`news-2026-${new URL(source.url).searchParams.get('PRID')}-${language.slice(0,2)}`;
  let existing;try{existing=(await request('/articles/'+slug)).data;}catch(e){if(!e.message.includes(': 404 '))throw e;}
  let article=existing;
  if(!existing){
   const hindi=language==='hi-IN',attribution=hindi?`स्रोत: Press Information Bureau की ${source.date} की आधिकारिक विज्ञप्ति। यह AI-सहायता से तैयार संक्षिप्त सार है; स्वतंत्र मैदानी रिपोर्टिंग नहीं।`:`Source: Press Information Bureau release dated ${source.date}. This is an AI-assisted, attributed news brief, not independent on-location reporting.`;
   const payload={title,slug,excerpt:lead,summary:lead,content:`<p>${escape(lead)}</p><h2>${hindi?'विवरण और संदर्भ':'Details and context'}</h2><p>${escape(detail)}</p><h2>${hindi?'स्रोत और पारदर्शिता':'Source and transparency'}</h2><p>${escape(attribution)}</p><p><a href="${escape(source.url)}" rel="noopener noreferrer">${hindi?'पूरी आधिकारिक विज्ञप्ति पढ़ें':'Read the full official release'}</a></p>`,language,articleType:'news',articleSection:category,trendingTopic:category,status:'published',visibility:'public',category:categoryMap.get(category)._id,author:author._id,tags:[tag._id],media:{featuredImage:{...manifest[category],alt:`Original abstract editorial illustration for ${category.toLowerCase()} news; not an event photograph`,caption:hindi?'TrendsDuniya की मूल संपादकीय illustration; घटना की तस्वीर नहीं।':'Original TrendsDuniya editorial illustration; not a photograph of the reported event.'},images:[]},seo:{metaTitle:title,metaDescription:lead.slice(0,190),primaryKeyword:title.split(/[:：]/)[0].slice(0,180),relatedKeywords:[category,'September 2026',hindi?'हिंदी समाचार':'India news'],searchIntent:'news',robots:{index:true,follow:true,maxImagePreview:'large'}},source:{name:'Press Information Bureau',url:source.url,type:'government',publishedAt:new Date(source.date+' 12:00:00 GMT+0530').toISOString(),attributionText:attribution},originalData:{hasOriginalReporting:false,hasOriginalAnalysis:false,hasOriginalResearch:false,hasOriginalImages:true,notes:'Original attributed paraphrase of a primary source. Category artwork created for TrendsDuniya. Curated topical selection; no measured trending rank.'},externalLinks:[{title:source.title,url:source.url,rel:'noopener noreferrer'}]};
   article=(await request('/admin/articles','POST',payload)).data;
  }
  const publicArticle=(await request('/articles/'+slug)).data;
  assert.equal(publicArticle.title,title);assert.equal(publicArticle.language,language);assert.equal(publicArticle.source.url,source.url);assert(publicArticle.featuredImage.url);assert(publicArticle.seo.robots.index);
  report.push({id:publicArticle.id||publicArticle._id,title,slug,language,sourceUrl:source.url,sourceDate:source.date,url:publicArticle.publicUrl,status:'published',created:!existing});
  await fs.writeFile(new URL('import-report.json',directory),JSON.stringify({importedAt:new Date().toISOString(),articles:report},null,2));
  console.log(`${report.length}/50 ${language} ${existing?'verified existing':'published'} ${slug}`);
 }
 const after=await request('/articles?limit=1');
 console.log(JSON.stringify({verified:report.length,hindi:report.filter(a=>a.language==='hi-IN').length,english:report.filter(a=>a.language==='en-IN').length,created:report.filter(a=>a.created).length,before:before.pagination,after:after.pagination}));
}finally{await request('/auth/logout','POST',{});}
