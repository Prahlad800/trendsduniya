import {Router} from "express";
import * as c from "../controllers/author.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";
import {allowRoles} from "../middleware/admin.middleware.js";
const router=Router();router.get("/",c.getAuthors);router.get("/:slug",c.getAuthor);
export const adminRouter=Router();adminRouter.use(authenticate,allowRoles("superadmin"));adminRouter.get("/",c.getAuthors);adminRouter.post("/",c.createAuthor);adminRouter.put("/:id",c.updateAuthor);adminRouter.delete("/:id",c.deleteAuthor);
export default router;

