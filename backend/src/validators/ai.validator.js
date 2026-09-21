import { z } from "zod";
import { articleInput } from "./article.validator.js";
export const providerDefaults = {
  openai: "https://api.openai.com/v1", openrouter: "https://openrouter.ai/api/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta", groq: "https://api.groq.com/openai/v1",
  anthropic: "https://api.anthropic.com/v1", custom: "",
};
export const configInput = z.object({
  provider: z.enum(Object.keys(providerDefaults)), providerName: z.string().trim().max(100).default(""),
  model: z.string().trim().min(1).max(150).regex(/^[\w./:-]+$/),
  apiKey: z.string().trim().min(8).max(1000).optional(), baseUrl: z.string().max(500).default(""),
  temperature: z.number().min(0).max(1).default(0.4), maxTokens: z.number().int().min(256).max(16000).default(5000),
  outputMode: z.enum(["json", "schema", "prompt"]).default("json"), enabled: z.boolean().default(true),
}).strict();
const text = max => z.string().trim().max(max);
export const generationInput = z.object({
  title: text(300).min(1), language: z.enum(["en-IN", "hi-IN", "en", "hi"]).default("en-IN"),
  content: text(20000).default(""), summary: text(5000).default(""), sourceUrl: z.union([z.url({ protocol: /^https?$/ }), z.literal("")]).default(""),
  trendingTopic: text(200).default(""), trendId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();
export const generatedArticle = articleInput.pick({title:true,slug:true,excerpt:true,summary:true,content:true,articleType:true,articleSection:true,trendingTopic:true,seo:true,faq:true,internalLinks:true,externalLinks:true}).required().extend({
  title: text(300).min(1), content: text(100000).min(1), excerpt: text(2000).min(1), summary: text(5000),
  seo: articleInput.shape.seo.unwrap().omit({canonicalUrl:true,robots:true}).required(),
  internalLinks: z.array(z.object({title:text(300),url:text(2048),anchorText:text(300)}).strict()).max(10),
  externalLinks: z.array(z.object({title:text(300),url:text(2048),anchorText:text(300)}).strict()).max(12),
  suggestedTags: z.array(text(100).min(1)).max(12), editorialNotes: text(5000),
}).strict();
export function parseInput(schema, value) {
  const parsed = schema.safeParse(value);
  // Do not include rejected values or provider credentials in validation responses.
  if (!parsed.success) { const error = new Error("Please check the AI fields: " + parsed.error.issues.map(i => i.path.join(".")).join(", ")); error.statusCode = 422; throw error; }
  return parsed.data;
}
