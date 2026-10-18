const imageFields=["url","publicId","width","height","format","bytes","alt","caption"];
export function imageBatchFits(form,batch){
 const current=[form.media?.featuredImage,...(form.media?.images||[])].filter(i=>i?.publicId);
 const ids=new Set(current.map(i=>i.publicId));
 const missing=Array.from({length:5},(_,index)=>batch.images[index]?.publicId||`trendsduniya/articles/ai-${batch.id}-${index}`).filter(id=>!ids.has(id)).length;
 return (form.media?.images?.length||0)+missing-(form.media?.featuredImage?.url?0:Math.min(1,missing))<=30;
}
export function mergeGeneratedImages(form,images){
 const next=structuredClone(form);next.media||={featuredImage:null,images:[]};next.media.images||=[];
 const existing=new Set([next.media.featuredImage?.publicId,...next.media.images.map(i=>i.publicId)].filter(Boolean));
 for(const image of images){
  if(!image.url||!image.publicId||existing.has(image.publicId))continue;
  const safe=Object.fromEntries(imageFields.filter(key=>image[key]!==undefined).map(key=>[key,image[key]]));
  if(!next.media.featuredImage?.url)next.media.featuredImage=safe;
  else if(next.media.images.length<30)next.media.images.push(safe);
  existing.add(image.publicId);
 }
 return next;
}
