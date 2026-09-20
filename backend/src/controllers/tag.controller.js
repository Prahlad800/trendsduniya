import Model from "../models/Tag.js";
import {taxonomyController} from "../services/taxonomy.service.js";
const c=taxonomyController(Model);
export const getTags=c.list,getTag=c.get,createTag=c.create,updateTag=c.update,deleteTag=c.remove;

