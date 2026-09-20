import { AppError } from "../utils/apiResponse.js";
export const allowRoles =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.admin.role)
      ? next()
      : next(new AppError("Insufficient permissions", 403));
export const requireAdmin = allowRoles(
  "superadmin",
  "admin",
  "editor",
  "author",
);
