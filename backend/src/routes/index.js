import { Router } from "express";
import authRoutes from "./auth.routes.js";
import articleRoutes, {
  adminRouter as adminArticleRoutes,
} from "./article.routes.js";
import categoryRoutes, {
  adminRouter as adminCategoryRoutes,
} from "./category.routes.js";
import tagRoutes, { adminRouter as adminTagRoutes } from "./tag.routes.js";
import authorRoutes, {
  adminRouter as adminAuthorRoutes,
} from "./author.routes.js";
import uploadRoutes from "./upload.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import aiRoutes from "./ai.routes.js";
import trendingRoutes, { jobsRouter } from "./trending.routes.js";
const router = Router();
router.use("/auth", authRoutes);
router.use("/articles", articleRoutes);
router.use("/categories", categoryRoutes);
router.use("/tags", tagRoutes);
router.use("/authors", authorRoutes);
router.use("/admin/articles", adminArticleRoutes);
router.use("/admin/categories", adminCategoryRoutes);
router.use("/admin/tags", adminTagRoutes);
router.use("/admin/authors", adminAuthorRoutes);
router.use("/admin/upload", uploadRoutes);
router.use("/admin", analyticsRoutes);
router.use("/admin/ai", aiRoutes);
router.use("/admin/trending", trendingRoutes);
router.use("/internal/jobs", jobsRouter);
export default router;
