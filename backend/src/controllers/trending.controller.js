import TrendingSnapshot from "../models/TrendingSnapshot.js";
import { queryDate,publicSnapshot,refreshTrends } from "../services/trending/trending.service.js";
import { AppError,success } from "../utils/apiResponse.js";
import { audit } from "../services/audit.service.js";
export const list=async(req,res)=>success(res,publicSnapshot(await TrendingSnapshot.findOne(queryDate(req.query))));
export const history=async(req,res)=>{
  const {country,date}=queryDate(req.query),days=Number(req.query.days||30);
  if(!Number.isInteger(days)||days<1||days>366)throw new AppError("History days must be between 1 and 366",422);
  const since=new Date(date);since.setUTCDate(since.getUTCDate()-days+1);
  success(res,await TrendingSnapshot.find({country,date:{$gte:since.toISOString().slice(0,10),$lte:date}}).select("date country lastRefreshedAt topicsCollected sourceHealth").sort({date:-1}).lean());
};
export async function topicById(id){
  if(!/^[a-f\d]{24}$/i.test(id))throw new AppError("Invalid trend ID",422);
  const s=await TrendingSnapshot.findOne({"topics._id":id}).lean();
  if(!s)throw new AppError("Trend not found",404);
  return {...s.topics.find(t=>String(t._id)===id),country:s.country,date:s.date};
}
export const detail=async(req,res)=>success(res,await topicById(req.params.id));
export const startArticle=async(req,res)=>{const topic=await topicById(req.params.id);await audit(req,"TREND_ARTICLE_STARTED",{_id:topic._id,constructor:{modelName:"TrendingTopic"}},null,{title:topic.title});success(res,topic);};
export const refresh=async(req,res)=>{const {country}=queryDate(req.body||{});const result=await refreshTrends(country,{force:!!req.admin});await audit(req,"TRENDS_REFRESHED",{_id:result._id,constructor:{modelName:"TrendingSnapshot"}},null,{date:result.date,country,topics:result.topics.length});success(res,result);};
