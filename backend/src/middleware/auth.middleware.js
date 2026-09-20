import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import AuthSession from "../models/AuthSession.js";
import env from "../config/env.js";
import { AppError } from "../utils/apiResponse.js";
export const authenticate = async (req,res,next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new AppError("Authentication required",401);
    const decoded = jwt.verify(token,env.accessSecret,{ algorithms:["HS256"], audience:"trendsduniya-admin", issuer:"trendsduniya" });
    const session = await AuthSession.findOne({ _id:decoded.sid, admin:decoded.id, revokedAt:null, expiresAt:{$gt:new Date()} });
    if (!session) throw new AppError("Session expired. Please sign in.",401);
    req.admin = await Admin.findById(decoded.id);
    if (!req.admin?.isActive) throw new AppError("Account inactive",401);
    req.authSession = session;
    next();
  } catch(error) { next(error.statusCode ? error : new AppError("Invalid or expired session",401)); }
};
export const signAccessToken = (id,sid) => jwt.sign({ id,sid },env.accessSecret,{ expiresIn:"15m",audience:"trendsduniya-admin",issuer:"trendsduniya" });
export const signRefreshToken = (id,sid) => jwt.sign({ id,sid,nonce:randomUUID() },env.refreshSecret,{ expiresIn:"7d",audience:"trendsduniya-refresh",issuer:"trendsduniya" });

