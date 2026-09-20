import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    oldSlug: { type: String, unique: true },
    newSlug: String,
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);
export default mongoose.model("ArticleRedirect", schema);
