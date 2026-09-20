import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../src/models/Admin.js";
import { connectDB } from "../src/config/db.js";

const [name, email, password, role = "superadmin"] = process.argv.slice(2);
if (!name || !email || !password) throw new Error("Usage: node scripts/createAdmin.js <name> <email> <password> [role]");
await connectDB();
await Admin.create({ name, email, password, role });
console.log(`Created ${role} admin: ${email}`);
await mongoose.disconnect();
