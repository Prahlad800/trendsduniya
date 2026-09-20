import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let connectionPromise;

export default async function handler(req, res) {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const requestPath = requestUrl.pathname;
  const isFunctionRoot = requestPath === "/api" || requestPath === "/api/index.js";
  const canRunWithoutDatabase = isFunctionRoot || requestPath === "/" || requestPath === "/api/health";

  if (isFunctionRoot) {
    req.url = `/${requestUrl.search}`;
  }

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