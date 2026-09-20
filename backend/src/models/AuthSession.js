import mongoose from "mongoose";
const schema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  refreshHash: { type: String, required: true }, expiresAt: { type: Date, required: true }, revokedAt: Date,
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("AuthSession", schema);

