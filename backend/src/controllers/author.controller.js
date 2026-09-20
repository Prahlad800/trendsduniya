import Model from "../models/Author.js";
import {taxonomyController} from "../services/taxonomy.service.js";
const c=taxonomyController(Model);
export const getAuthors=c.list,getAuthor=c.get,createAuthor=c.create,updateAuthor=c.update,deleteAuthor=c.remove;

