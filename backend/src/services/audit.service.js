import AuditLog from "../models/AuditLog.js";
export const audit = (req, action, entity, previousData, newData) => AuditLog.create({ action, entityType: entity.constructor?.modelName || "Article", entityId: entity._id, performedBy: req.admin?._id, previousData, newData, ipAddress: req.ip, userAgent: req.get("user-agent") });
