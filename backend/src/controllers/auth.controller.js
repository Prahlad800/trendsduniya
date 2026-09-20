import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import AuthSession from "../models/AuthSession.js";
import env from "../config/env.js";
import { AppError, success } from "../utils/apiResponse.js";
import { signAccessToken, signRefreshToken } from "../middleware/auth.middleware.js";
const hash = token => createHash("sha256").update(token).digest("hex");
const safeAdmin = admin => ({ id:admin.id,name:admin.name,email:admin.email,role:admin.role,avatar:admin.avatar });
export const login = async (req,res) => {
  const admin = await Admin.findOne({ email:req.body.email }).select("+password");
  if (!admin?.isActive || !(await admin.comparePassword(req.body.password))) throw new AppError("Invalid email or password",401);
  const session = new AuthSession({ admin:admin.id,expiresAt:new Date(Date.now()+7*86400000) });
  const refreshToken = signRefreshToken(admin.id,session.id);
  session.refreshHash = hash(refreshToken);
  await session.save();
  admin.lastLoginAt = new Date(); await admin.save();
  success(res,{ admin:safeAdmin(admin),accessToken:signAccessToken(admin.id,session.id),refreshToken },"Signed in");
};
export const me = (req,res) => success(res,safeAdmin(req.admin));
export const logout = async (req,res) => { await AuthSession.updateOne({_id:req.authSession.id},{$set:{revokedAt:new Date()}}); success(res,null,"Signed out"); };
export const refresh = async (req,res) => {
  try {
    const token=req.body.refreshToken;
    const decoded=jwt.verify(token,env.refreshSecret,{ algorithms:["HS256"],audience:"trendsduniya-refresh",issuer:"trendsduniya" });
    const admin=await Admin.findById(decoded.id);
    if (!admin?.isActive) throw new Error("Inactive");
    const refreshToken=signRefreshToken(admin.id,decoded.sid);
    const session=await AuthSession.findOneAndUpdate({_id:decoded.sid,admin:admin.id,refreshHash:hash(token),revokedAt:null,expiresAt:{$gt:new Date()}},{$set:{refreshHash:hash(refreshToken)}});
    if (!session) throw new Error("Invalid session");
    success(res,{accessToken:signAccessToken(admin.id,session.id),refreshToken,admin:safeAdmin(admin)});
  } catch { throw new AppError("Session expired. Please sign in.",401); }
};
export const createAdmin=async(req,res)=>{
  const {name,email,password,role}=req.body;
  const admin=await Admin.create({name,email,password,role});
  success(res,safeAdmin(admin),"Team member created",201);
};
export const listAdmins=async(req,res)=>success(res,await Admin.find().select("name email role isActive lastLoginAt createdAt").sort("name"));

