import cloudinary from "../config/cloudinary.js";
export const uploadImage = (buffer) => new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ folder: "trendsduniya/articles", resource_type: "image" }, (error, result) => error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format, bytes: result.bytes })); stream.end(buffer); });
export const deleteImage = (publicId) => publicId ? cloudinary.uploader.destroy(publicId, { resource_type: "image" }) : null;
export const deleteImages = (images = []) => Promise.all(images.filter(Boolean).map(deleteImage));
export const replaceImage = async (buffer, oldPublicId) => { const next = await uploadImage(buffer); try { await deleteImage(oldPublicId); } catch (error) { console.error("Cloudinary cleanup failed", error.message); } return next; };
