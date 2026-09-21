import mongoose from "mongoose";
import { ARTICLE_STATUSES, ARTICLE_TYPES } from "../utils/constants.js";

const image = {
  url: String,
  publicId: String,
  width: Number,
  height: Number,
  format: String,
  bytes: Number,
  alt: String,
  caption: String,
};
const link = { title: String, url: String, anchorText: String, rel: String };
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: String,
    content: String,
    summary: String,
    language: { type: String, enum: ["hi-IN", "en-IN", "hi", "en"], default: "en-IN" },
    articleSection: String,
    trendingTopic: String,
    status: {
      type: String,
      enum: ARTICLE_STATUSES,
      default: "draft",
      index: true,
    },
    articleType: { type: String, enum: ARTICLE_TYPES, default: "article" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag", index: true }],
    media: { featuredImage: image, images: [image] },
    video: { provider: { type: String, enum: ["youtube"] }, url: String, videoId: String },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: false,
      index: true,
    },
    seo: {
      searchIntent: {
        type: String,
        enum: [
          "informational",
          "navigational",
          "commercial",
          "transactional",
          "news",
        ],
      },
      searchIntentDescription: String,
      primaryKeyword: String,
      relatedKeywords: { type: [String], default: [] },
      relatedTopics: { type: [String], default: [] },
      metaTitle: String,
      metaDescription: String,
      canonicalUrl: String,
      robots: {
        index: { type: Boolean, default: false },
        follow: { type: Boolean, default: true },
        maxSnippet: { type: Number, default: -1 },
        maxImagePreview: { type: String, default: "large" },
        maxVideoPreview: { type: Number, default: -1 },
      },
    },
    faq: [{ question: String, answer: String }],
    source: {
      name: String,
      url: String,
      type: {
        type: String,
        enum: [
          "",
          "original",
          "agency",
          "official",
          "publication",
          "government",
          "research",
          "other",
        ],
      },
      publishedAt: Date,
      attributionText: String,
    },
    originalData: {
      hasOriginalReporting: Boolean,
      hasOriginalAnalysis: Boolean,
      hasOriginalResearch: Boolean,
      hasOriginalImages: Boolean,
      notes: String,
    },
    internalLinks: [link],
    externalLinks: [link],
    relatedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    publishedAt: Date,
    scheduledAt: Date,
    deletedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    analytics: {
      views: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      readingTime: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);
schema.index({ status: 1, publishedAt: -1 });
schema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  "seo.primaryKeyword": "text",
  "seo.relatedKeywords": "text",
}, { default_language: "none", language_override: "textIndexLanguage" });
export default mongoose.model("Article", schema);
