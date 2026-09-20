import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let connectionPromise;

export default async function handler(req, res) {
  const requestPath = req.url?.split("?", 1)[0];
  const canRunWithoutDatabase = requestPath === "/" || requestPath === "/api/health";

  if (!canRunWithoutDatabase) {
    try {
      connectionPromise ??= connectDB();
      await connectionPromise;
    } catch (error) {
      connectionPromise = undefined;
      console.error(`Database connection failed: ${error.message}`);
      return res.status(503).json({ success: false, message: "Database unavailable" });
    }
  }

  return app(req, res);
}