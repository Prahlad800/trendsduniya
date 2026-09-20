import Model from "../models/Category.js";
import {taxonomyController} from "../services/taxonomy.service.js";
const c=taxonomyController(Model);
export const getCategories=c.list,getCategory=c.get,createCategory=c.create,updateCategory=c.update,deleteCategory=c.remove;

