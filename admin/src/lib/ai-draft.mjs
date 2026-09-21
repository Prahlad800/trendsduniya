// Explicit allowlist: never copy organization, media, publishing state or IDs from AI.
export function mergeAiDraft(form,generated){
  if(!generated||typeof generated.title!=="string"||typeof generated.content!=="string"||!generated.seo)throw new Error("Invalid AI article response");
  const next=structuredClone(form);
  for(const key of ["slug","excerpt","content","summary","articleSection","trendingTopic","faq","internalLinks","externalLinks"]){
    if(key==="faq"&&form.content)continue;
    if(generated[key]!==undefined && (!next[key]||Array.isArray(next[key])&&!next[key].length))next[key]=generated[key];
  }
  // The entered headline and existing manual text remain authoritative.
  if(!next.title)next.title=generated.title;
  if(!form.content&&generated.articleType)next.articleType=generated.articleType;
  for(const key of ["searchIntentDescription","primaryKeyword","relatedKeywords","relatedTopics","metaTitle","metaDescription"]){if(!next.seo[key]||Array.isArray(next.seo[key])&&!next.seo[key].length)next.seo[key]=generated.seo[key];}
  if(!form.seo.searchIntentDescription&&!form.seo.primaryKeyword)next.seo.searchIntent=generated.seo.searchIntent;
  if(!next.originalData.notes)next.originalData.notes=[generated.editorialNotes,generated.suggestedTags?.length?"Suggested tags (review manually): "+generated.suggestedTags.join(", "):""].filter(Boolean).join("\n\n").slice(0,5000);
  next.scheduledAt="";
  return next;
}
