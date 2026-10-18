import { generateArticle } from "../services/ai/ai.service.js";
import { groqStatus, testGroq } from "../services/groq.service.js";
import { success } from "../utils/apiResponse.js";
import { audit } from "../services/audit.service.js";
import {imageReadiness,createImageBatch,getImageBatch,generateNextImage} from "../services/ai/article-images.service.js";
const aiEntity={constructor:{modelName:"Groq"}};
export const readiness=(req,res)=>success(res,{...groqStatus(),images:imageReadiness()});
export const status=async(req,res)=>{
  try {const result=await testGroq();await audit(req,"AI_CONNECTION_TESTED",aiEntity,null,result);success(res,result);}
  catch(error){if(!error.errorCode)throw error;res.status(error.statusCode).json({success:false,message:error.message,errorCode:error.errorCode,data:{...groqStatus(),connected:false,error:error.message}});}
};
export const generate=async(req,res)=>{const result=await generateArticle(req.body);await audit(req,"AI_ARTICLE_GENERATED",aiEntity,null,{provider:result.provider,model:result.model,durationMs:result.durationMs,usage:result.usage});success(res,result,"AI draft generated. Review it before publishing.");};
export const startImages=async(req,res)=>success(res,await createImageBatch(req.body,req.admin),"Five image concepts prepared");
export const getImages=async(req,res)=>success(res,await getImageBatch(req.params.id,req.admin));
export const nextImage=async(req,res)=>success(res,await generateNextImage(req.params.id,req.admin),"Image generation progress saved");
