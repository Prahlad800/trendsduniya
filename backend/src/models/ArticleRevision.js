import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    version: { type: Number, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    changeReason: String,
  },
  { timestamps: true },
);
schema.index({ article: 1, version: -1 });
export default mongoose.model("ArticleRevision", schema);
