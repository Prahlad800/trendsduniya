import { body } from "express-validator";
export const categoryValidator = [body("name").trim().notEmpty()];
