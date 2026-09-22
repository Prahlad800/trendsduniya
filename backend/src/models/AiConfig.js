import mongoose from "mongoose";
const schema = new mongoose.Schema({
  // Keep the existing unique index and legacy article record in place.
  singleton: { type: String, default: "default", unique: true, enum: ["default", "trending"] },
  provider: String, providerName: String, model: String, baseUrl: String,
  encryptedApiKey: { type: String, select: false },
  apiKeyConfigured: { type: Boolean, default: false },
  temperature: Number, maxTokens: Number, outputMode: String, enabled: Boolean,
  lastTestedAt: Date, lastTestStatus: String, lastTestMessage: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.encryptedApiKey; return ret; } } });
export default mongoose.model("AiConfig", schema);
