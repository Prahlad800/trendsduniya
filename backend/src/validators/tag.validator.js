import { body } from "express-validator";
export const tagValidator = [body("name").trim().notEmpty()];
