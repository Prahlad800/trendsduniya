import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    bio: String,
    avatar: String,
    avatarPublicId: String,
    designation: String,
    website: String,
    socialLinks: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Author", schema);
