import { validationResult } from "express-validator";
import { AppError } from "../utils/apiResponse.js";
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  return errors.isEmpty()
    ? next()
    : next(new AppError("Validation failed", 422, errors.array()));
};
