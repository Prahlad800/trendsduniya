import multer from "multer";
import { AppError } from "../utils/apiResponse.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new AppError("Use a JPG, PNG, WebP, GIF, or AVIF image", 422)),
});
export default upload;
