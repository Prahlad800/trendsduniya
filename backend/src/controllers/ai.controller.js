import { generateArticle } from "../services/ai/ai.service.js";
import { geminiStatus, testGemini } from "../services/gemini.service.js";
import { success } from "../utils/apiResponse.js";
import { audit } from "../services/audit.service.js";
const aiEntity={constructor:{modelName:"Gemini"}};
export const readiness=(req,res)=>success(res,geminiStatus());
export const status=async(req,res)=>{
  try {const result=await testGemini();await audit(req,"AI_CONNECTION_TESTED",aiEntity,null,result);success(res,result);}
  catch(error){if(!error.errorCode)throw error;res.status(error.statusCode).json({success:false,message:error.message,errorCode:error.errorCode,data:{...geminiStatus(),connected:false,error:error.message}});}
};
export const generate=async(req,res)=>{const result=await generateArticle(req.body);await audit(req,"AI_ARTICLE_GENERATED",aiEntity,null,{provider:result.provider,model:result.model,durationMs:result.durationMs,usage:result.usage});success(res,result,"AI draft generated. Review it before publishing.");};
