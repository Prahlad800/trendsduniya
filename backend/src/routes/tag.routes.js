import {Router} from "express";
import * as c from "../controllers/tag.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";
import {allowRoles} from "../middleware/admin.middleware.js";
const router=Router();router.get("/",c.getTags);router.get("/:slug",c.getTag);
export const adminRouter=Router();adminRouter.use(authenticate,allowRoles("superadmin","admin"));adminRouter.get("/",c.getTags);adminRouter.post("/",c.createTag);adminRouter.put("/:id",c.updateTag);adminRouter.delete("/:id",c.deleteTag);
export default router;

