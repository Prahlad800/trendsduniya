import { AppError, success } from "../utils/apiResponse.js";
import { deleteImage, uploadImage } from "../services/cloudinary.service.js";
import Article from "../models/Article.js";
import Author from "../models/Author.js";
function validImage(file) {
  const b=file.buffer;
  if(file.mimetype==='image/png')return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(file.mimetype==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;
  if(file.mimetype==='image/gif')return /^GIF8[79]a$/.test(b.subarray(0,6).toString());
  if(file.mimetype==='image/webp')return b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP';
  if(file.mimetype==='image/avif')return b.subarray(4,8).toString()==='ftyp'&&/avif|avis/.test(b.subarray(8,40).toString());
  return false;
}
export const upload = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("Image file is required", 400);
    if (!validImage(req.file)) throw new AppError("The file content does not match a supported image format", 422);
    success(res, await uploadImage(req.file.buffer), "Image uploaded", 201);
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    const publicId = req.params.publicId;
    if (!/^trendsduniya\/articles\/[\w-]+$/.test(publicId))
      throw new AppError("Invalid image path", 400);
    const [article,author]=await Promise.all([
      Article.exists({$or:[{'media.featuredImage.publicId':publicId},{'media.images.publicId':publicId}]}),
      Author.exists({avatarPublicId:publicId}),
    ]);
    if(article||author)throw new AppError("This image is in use. Remove its references before deleting it",409);
    await deleteImage(publicId);
    success(res, null, "Image deleted");
  } catch (e) {
    next(e);
  }
};
