import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    previousData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);
export default mongoose.model("AuditLog", schema);
