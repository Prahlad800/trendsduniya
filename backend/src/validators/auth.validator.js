import { body } from "express-validator";
export const loginValidator=[body("email").isEmail().trim().toLowerCase(),body("password").isString().isLength({min:1,max:200})];
export const createAdminValidator=[body("name").trim().isLength({min:1,max:150}),body("email").isEmail().trim().toLowerCase(),body("password").isLength({min:12}).custom(value=>Buffer.byteLength(value)<=72),body("role").isIn(["superadmin","admin","editor","author"])];

