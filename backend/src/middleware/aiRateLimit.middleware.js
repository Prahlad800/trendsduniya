import RequestQuota from "../models/RequestQuota.js";
import { AppError } from "../utils/apiResponse.js";
// MongoDB counters are shared by serverless instances; TTL is cleanup, not enforcement.
export const durableLimit=(scope,limit,windowMs=600000)=>async(req,res,next)=>{
  try {
    const bucket=Math.floor(Date.now()/windowMs),id=`${scope}:${req.admin.id}:${bucket}`;
    let record;
    try{record=await RequestQuota.findOneAndUpdate({_id:id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((bucket+2)*windowMs)}},{upsert:true,returnDocument:"after"});}
    catch(error){if(error.code!==11000)throw error;record=await RequestQuota.findOneAndUpdate({_id:id},{$inc:{count:1}},{returnDocument:"after"});}
    if(record.count>limit){res.set("Retry-After",String(Math.ceil(((bucket+1)*windowMs-Date.now())/1000)));throw new AppError("Request limit reached. Please try again later.",429);}
    next();
  }catch(error){next(error);}
};
