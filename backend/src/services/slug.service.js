import { generateSlug } from "../utils/generateSlug.js";
export const uniqueSlug = async (Model, value, excludeId) => { const base = generateSlug(value); let slug = base; let count = 1; while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${base}-${++count}`; return slug; };
