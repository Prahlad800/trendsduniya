import mongoose from "mongoose";
import {connectDB} from "../src/config/db.js";
import Article from "../src/models/Article.js";
import ArticleImageBatch from "../src/models/ArticleImageBatch.js";
import {AutomationTask,AutomationSettings} from "../src/models/Automation.js";
try{await connectDB();await Promise.all([Article.createIndexes(),AutomationTask.createIndexes(),AutomationSettings.createIndexes(),ArticleImageBatch.createIndexes()]);console.log("Automation and image batch indexes created; existing data retained.");}finally{await mongoose.disconnect();}
