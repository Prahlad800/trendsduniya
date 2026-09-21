import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/admin.middleware.js";
import { durableLimit } from "../middleware/aiRateLimit.middleware.js";
import { AppError } from "../utils/apiResponse.js";
import env from "../config/env.js";
import * as c from "../controllers/trending.controller.js";
const router=Router();
router.use(authenticate,allowRoles("superadmin","admin","editor"));
router.get("/",c.list);router.get("/history",c.history);
router.post("/refresh",durableLimit("trends-refresh",3),c.refresh);
router.get("/:id",c.detail);router.post("/:id/start-article",c.startArticle);
export const jobsRouter=Router();
export function cronAuth(req,res,next){
  const actual=Buffer.from(req.get("authorization")||""),expected=Buffer.from(`Bearer ${env.cronSecret}`);
  if(!env.cronSecret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return next(new AppError("Unauthorized job request",401));
  next();
}
jobsRouter.route("/trending").get(cronAuth,c.refresh).post(cronAuth,c.refresh);
export default router;
