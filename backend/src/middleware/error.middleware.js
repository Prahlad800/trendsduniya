import { failure } from "../utils/apiResponse.js";
export const notFound = (req,res) => failure(res, "Route not found", 404);
export const errorHandler = (error,req,res,next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode || (error.http_code === 401 || error.http_code === 403 ? 502 : error.name === "ValidationError" || error.name === "CastError" || error.name === "ZodError" ? 422 : error.code === 11000 || error.name === "VersionError" ? 409 : error.name === "MulterError" ? 422 : 500);
  if (status === 500) console.error(JSON.stringify({ event: "request.failed", name: error.name, code: error.code, path: req.path, ...(process.env.NODE_ENV === "test" ? {message:error.message}: {}) }));
  const message = status === 500 ? (process.env.NODE_ENV === "development" ? error.message : "Something went wrong. Please try again.") : error.http_code === 401 || error.http_code === 403 ? "Cloudinary rejected the credentials. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET." : error.code === 11000 ? "This slug or email already exists." : error.message;
  failure(res, message, status, error.issues || (Array.isArray(error.errors) ? error.errors : undefined));
};
