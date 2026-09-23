import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import { connectDB, databaseStatus } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import articleRoutes, {
  adminRouter as adminArticleRoutes,
} from "./routes/article.routes.js";
import categoryRoutes, {
  adminRouter as adminCategoryRoutes,
} from "./routes/category.routes.js";
import tagRoutes, {
  adminRouter as adminTagRoutes,
} from "./routes/tag.routes.js";
import authorRoutes, {
  adminRouter as adminAuthorRoutes,
} from "./routes/author.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import sitemapRoutes from "./routes/sitemap.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import trendingRoutes, { jobsRouter } from "./routes/trending.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
let connectionPromise;

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin))
        return callback(null, true);
      return callback(Object.assign(new Error("Origin is not allowed by CORS"),{statusCode:403}));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/api/health") return next();
  try {
    if(databaseStatus()!=="connected"){
      connectionPromise ??= connectDB().finally(()=>{connectionPromise=undefined;});
      await connectionPromise;
    }
    next();
  } catch {
    console.error(JSON.stringify({event:"database.unavailable"}));
    res.status(503).json({ success: false, message: "Database unavailable. Please try again shortly.",errorCode:"DATABASE_ERROR" });
  }
});
app.get("/", (req, res) =>
  res.json({ success: true, message: "TrendsDuniya CMS API is running" }),
);
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    message: "Backend is running",
    database: databaseStatus(),
    capabilities: ["ai", "trending"],
    timestamp: new Date().toISOString(),
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/authors", authorRoutes);
app.use(sitemapRoutes);
app.use("/api/admin/articles", adminArticleRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/tags", adminTagRoutes);
app.use("/api/admin/authors", adminAuthorRoutes);
app.use("/api/admin/upload", uploadRoutes);
app.use("/api/admin", analyticsRoutes);
app.use("/api/admin/ai", aiRoutes);
app.use("/api/admin/trending", trendingRoutes);
app.use("/api/internal/jobs", jobsRouter);
app.use(notFound);
app.use(errorHandler);
export default app;
