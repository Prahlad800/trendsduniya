import dns from "node:dns";
import mongoose from "mongoose";
import env from "./env.js";
import Article from "../models/Article.js";
import { mongoConnectionOptions } from "./dns.js";

export const connectDB = async () => {
  if (env.mongoDnsServers.length && env.mongoUri.startsWith("mongodb+srv://")) {
    dns.setServers(env.mongoDnsServers);
  }
  await mongoose.connect(env.mongoUri, mongoConnectionOptions());
  const indexes = await Article.collection.indexes().catch(error => { if (error.code === 26) return []; throw error; });
  const textIndex = indexes.find((index) => index.key?._fts === "text");
  if (textIndex && (textIndex.language_override === "language" || textIndex.default_language === "english")) {
    await Article.collection.dropIndex(textIndex.name);
    await Article.syncIndexes();
  }
  return mongoose.connection;
};
export const databaseStatus = () =>
  mongoose.connection.readyState === 1 ? "connected" : "disconnected";
