import AiConfig from "../models/AiConfig.js";
import { publicConfig,saveConfig,testConfig,generateArticle,configKey } from "../services/ai/ai.service.js";
import { success } from "../utils/apiResponse.js";
import { audit } from "../services/audit.service.js";
export const getConfig=async(req,res)=>success(res,publicConfig(await AiConfig.findOne(configKey(req.params.type))));
export const status=async(req,res)=>{const c=await AiConfig.findOne({singleton:"default"});success(res,{enabled:!!c?.enabled,apiKeyConfigured:!!c?.apiKeyConfigured,provider:c?.provider,model:c?.model});};
export const putConfig=async(req,res)=>{const c=await saveConfig(req.body,req.admin,req.params.type);await audit(req,"AI_CONFIG_UPDATED",c,null,publicConfig(c));success(res,publicConfig(c),"Configuration saved");};
export const test=async(req,res)=>{
  try{const result=await testConfig(req.body,req.params.type);await audit(req,"AI_CONNECTION_TESTED",new AiConfig(),null,{provider:result.provider,model:result.model,success:true});success(res,result);}
  catch(error){await audit(req,"AI_CONNECTION_TESTED",new AiConfig(),null,{success:false});throw error;}
};
export const generate=async(req,res)=>{const result=await generateArticle(req.body);await audit(req,"AI_ARTICLE_GENERATED",new AiConfig(),null,{provider:result.provider,model:result.model,durationMs:result.durationMs,usage:result.usage});success(res,result,"AI draft generated. Review it before publishing.");};
