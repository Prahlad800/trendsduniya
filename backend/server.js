import app from "./src/app.js";
import env from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { startScheduler } from "./src/services/scheduler.service.js";
import mongoose from "mongoose";

try {
  let stopScheduler = () => {};
  if (process.env.VERCEL !== "1") {
    await connectDB();
    stopScheduler = startScheduler();
  }
  const server = app.listen(env.port, () => console.log(`Server running: http://localhost:${env.port}`));
  const shutdown = async (signal) => { console.log(`${signal}: shutting down`); stopScheduler(); server.close(async () => { await mongoose.disconnect(); process.exit(0); }); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
