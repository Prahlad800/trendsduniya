import "dotenv/config";

const env = {
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
    model: (process.env.GEMINI_MODEL || "").trim(),
  },
  cronSecret: process.env.CRON_SECRET || "",
  aiTimeoutMs: Math.min(240000, Math.max(1000, Number(process.env.AI_TIMEOUT_MS) || 240000)),
  aiGenerationLimit: Math.max(1, Number(process.env.AI_GENERATION_LIMIT) || 10),
  trendRefreshHours: Math.min(24, Math.max(1, Number(process.env.TREND_REFRESH_HOURS) || 24)),
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/trendsduniya",
  mongoDnsServers: (process.env.MONGODB_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean),
  accessSecret: process.env.JWT_ACCESS_SECRET || "development-access-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "development-refresh-secret",
  siteUrl: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  frontendUrl: (process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  adminUrl: (process.env.ADMIN_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  ),
  corsOrigins: (
    process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001"
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
};

export default env;
