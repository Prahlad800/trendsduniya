import {z} from "zod";
import Category from "../models/Category.js";
import {uniqueSlug} from "./slug.service.js";
import {success,AppError} from "../utils/apiResponse.js";
const text=z.string().trim().max(5000),name=z.string().trim().min(1).max(150);
const url=z.union([z.literal(""),z.url().refine(v=>/^https?:\/\//.test(v))]);
const common={name,slug:z.string().regex(/^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u).optional(),isActive:z.boolean().optional()};
const schemas={
 Category:z.object({...common,description:text.optional(),parent:z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional(),seoTitle:text.optional(),seoDescription:text.optional()}).strict(),
 Tag:z.object({...common,description:text.optional()}).strict(),
 Author:z.object({...common,bio:text.optional(),designation:text.optional(),website:url.optional()}).strict(),
};
export function taxonomyController(Model){
 const input=schemas[Model.modelName];
 const validateParent=async(id,parent)=>{const seen=new Set([String(id)]);while(parent){if(seen.has(String(parent)))throw new AppError("Category nesting cannot contain a cycle",422);seen.add(String(parent));const node=await Category.findById(parent);if(!node?.isActive)throw new AppError("Choose an active parent category",422);parent=node.parent;}};
 return {
  list:async(req,res)=>success(res,await Model.find(req.admin?{}:{isActive:true}).select(req.admin?"":"-createdBy -updatedBy -__v").sort("name")),
  get:async(req,res)=>{const item=await Model.findOne({slug:req.params.slug,isActive:true}).select("-createdBy -updatedBy -__v");if(!item)throw new AppError("Not found",404);success(res,item);},
  create:async(req,res)=>{const data=input.parse(req.body);if(Model.modelName==="Category")await validateParent("",data.parent);const item=await Model.create({...data,slug:await uniqueSlug(Model,data.slug||data.name),createdBy:req.admin.id});success(res,item,Model.modelName+" created",201);},
  update:async(req,res)=>{const data=input.partial().parse(req.body);const item=await Model.findById(req.params.id);if(!item)throw new AppError("Not found",404);if(Model.modelName==="Category"&&data.parent)await validateParent(item.id,data.parent);Object.assign(item,data,{updatedBy:req.admin.id});await item.save();success(res,item,Model.modelName+" saved");},
  remove:async(req,res)=>{const item=await Model.findByIdAndUpdate(req.params.id,{isActive:false,updatedBy:req.admin.id},{new:true});if(!item)throw new AppError("Not found",404);success(res,item,Model.modelName+" deactivated");},
 };
}

