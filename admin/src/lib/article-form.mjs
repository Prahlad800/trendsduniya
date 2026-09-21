export const blankArticle=()=>({
 title:"",slug:"",excerpt:"",content:"",summary:"",articleType:"article",language:"en-IN",category:"",subCategory:"",author:"",tags:[],relatedArticles:[],visibility:"public",scheduledAt:"",
 media:{featuredImage:null,images:[]},
 seo:{searchIntent:"informational",searchIntentDescription:"",primaryKeyword:"",relatedKeywords:[],relatedTopics:[],metaTitle:"",metaDescription:"",canonicalUrl:"",robots:{index:true,follow:true,maxSnippet:-1,maxImagePreview:"large",maxVideoPreview:-1},openGraph:{title:"",description:"",image:"",imageAlt:""},twitter:{card:"summary_large_image",title:"",description:"",image:"",imageAlt:""}},
 structuredData:{article:{enabled:true,type:"Article"},breadcrumb:{enabled:true}},
 source:{name:"",url:"",type:"",attributionText:""},faq:[],internalLinks:[],externalLinks:[],
 originalData:{hasOriginalReporting:false,hasOriginalAnalysis:false,hasOriginalResearch:false,hasOriginalImages:false,notes:""},
});
export const idOf=value=>typeof value==="string"?value:value?._id||value?.id||"";
function merge(a,b){const out={...a};for(const[k,v]of Object.entries(b||{})){out[k]=v&&typeof v==="object"&&!Array.isArray(v)?merge(a?.[k]||{},v):v;}return out;}
export function fromArticle(article){
 const base=blankArticle(),selected=Object.fromEntries(Object.keys(base).filter(k=>article[k]!==undefined).map(k=>[k,article[k]]));
 const form=merge(base,selected);
 for(const key of ["category","subCategory","author"])form[key]=idOf(form[key]);
 for(const key of ["tags","relatedArticles"])form[key]=form[key].map(idOf);
 if(form.scheduledAt){const date=new Date(form.scheduledAt);form.scheduledAt=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 return form;
}
const cleanImage=i=>i?Object.fromEntries(["url","publicId","width","height","format","bytes","alt","caption"].filter(k=>i[k]!==undefined).map(k=>[k,i[k]])):null;
export function toPayload(form){
 const payload={...form,category:form.category||null,subCategory:form.subCategory||null,author:form.author||null,media:{featuredImage:cleanImage(form.media.featuredImage),images:form.media.images.map(cleanImage)}};
 if(!payload.slug)delete payload.slug;
 payload.scheduledAt=form.scheduledAt?new Date(form.scheduledAt).toISOString():null;
 payload.seo={...form.seo,relatedKeywords:[...new Set(form.seo.relatedKeywords.map(s=>s.trim()).filter(Boolean))],relatedTopics:[...new Set(form.seo.relatedTopics.map(s=>s.trim()).filter(Boolean))]};
 delete payload.seo.openGraph;
 delete payload.seo.twitter;
 delete payload.structuredData;
 payload.source={...form.source};
 for(const key of ["internalLinks","externalLinks","faq"])payload[key]=form[key].filter(row=>Object.values(row).some(value=>String(value||"").trim()));
 const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).filter(([k])=>k!=="_id").map(([k,val])=>[k,strip(val)])):v;
 return strip(payload);
}
export const unicodeSlug=value=>value.normalize("NFKC").toLowerCase().replace(/[.'’]/gu,"").replace(/[^\p{L}\p{N}\p{M}]+/gu,"-").replace(/^-+|-+$/g,"");

