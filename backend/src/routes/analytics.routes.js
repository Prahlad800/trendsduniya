import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/admin.middleware.js";
import { dashboard } from "../controllers/analytics.controller.js";
const router = Router(); router.get("/dashboard", authenticate, allowRoles("superadmin", "admin", "editor"), dashboard); export default router;
