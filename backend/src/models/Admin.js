import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ADMIN_ROLES } from "../utils/constants.js";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "author" },
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
schema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
schema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};
export default mongoose.model("Admin", schema);
