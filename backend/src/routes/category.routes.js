import {Router} from "express";
import * as c from "../controllers/category.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";
import {allowRoles} from "../middleware/admin.middleware.js";
const router=Router();router.get("/",c.getCategories);router.get("/:slug",c.getCategory);
export const adminRouter=Router();adminRouter.use(authenticate,allowRoles("superadmin","admin"));adminRouter.get("/",c.getCategories);adminRouter.post("/",c.createCategory);adminRouter.put("/:id",c.updateCategory);adminRouter.delete("/:id",c.deleteCategory);
export default router;

