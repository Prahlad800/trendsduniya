import { z } from "zod";
import { articleInput } from "./article.validator.js";
const text = max => z.string().trim().max(max);
export const generationInput = z.object({
  title: text(300).min(1), language: z.enum(["en-IN", "hi-IN", "en", "hi"]).default("en-IN"),
  content: text(20000).default(""), summary: text(5000).default(""), sourceUrl: z.union([z.url({ protocol: /^https?$/ }), z.literal("")]).default(""),
  trendingTopic: text(200).default(""), trendId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  targetWords: z.number().int().min(300).max(10000).default(10000),
}).strict();
export const generatedArticle = articleInput.pick({title:true,slug:true,excerpt:true,summary:true,content:true,articleType:true,articleSection:true,trendingTopic:true,seo:true,faq:true,internalLinks:true,externalLinks:true}).required().extend({
  title: text(300).min(1), content: text(500000).min(1), excerpt: text(2000).min(1), summary: text(5000),
  seo: articleInput.shape.seo.unwrap().omit({canonicalUrl:true,robots:true}).required(),
  faq: articleInput.shape.faq.default([]),
  internalLinks: z.array(z.object({title:text(300),url:text(2048),anchorText:text(300)}).strict()).max(10).default([]),
  externalLinks: z.array(z.object({title:text(300),url:text(2048),anchorText:text(300)}).strict()).max(12).default([]),
  suggestedTags: z.array(text(100).min(1)).max(12), editorialNotes: text(5000),
}).strict();
export function parseInput(schema, value) {
  const parsed = schema.safeParse(value);
  // Do not include rejected values or provider credentials in validation responses.
  if (!parsed.success) { const error = new Error("Please check the AI fields: " + parsed.error.issues.map(i => i.path.join(".")).join(", ")); error.statusCode = 422; throw error; }
  return parsed.data;
}
