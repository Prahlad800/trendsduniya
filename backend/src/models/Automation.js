import mongoose from "mongoose";
const {Schema}=mongoose;
const settings=new Schema({
 _id:{type:String,default:"main"},enabled:{type:Boolean,default:false},humanReview:{type:Boolean,default:true},
 imageModel:{type:String,default:"@cf/black-forest-labs/flux-1-schnell"},
 language:{type:String,default:"en-IN"},imageCount:{type:Number,default:4},timezone:{type:String,default:"Asia/Kolkata"},
 slots:{type:[String],default:["06:00","12:00","19:00","21:00","23:00"]},retryLimit:{type:Number,default:3},dailyLimit:{type:Number,default:5},
 countries:{type:[String],default:["IN","US","GB"]},sources:{type:[String],default:["bbcNews","googleNewsWORLD","googleNewsTECHNOLOGY","googleNewsSCIENCE","googleNewsBUSINESS"]},
 words:{type:Number,default:800},tone:{type:String,default:"Clear, factual news reporting"},
 owner:{type:Schema.Types.ObjectId,ref:"Admin"},leaseUntil:Date,leaseToken:String,lastTickAt:Date,lastPublishedAt:Date,researchDay:String,lastResearchError:String,generationDay:String,generationCount:{type:Number,default:0},
},{timestamps:true});
export const AutomationSettings=mongoose.model("AutomationSettings",settings);
const task=new Schema({
 day:{type:String,index:true},key:{type:String,unique:true},title:String,category:String,region:String,reason:String,score:Number,
 sources:[{title:String,url:String,publishedAt:Date,provider:String,evidence:String}],verification:{type:String,default:"unverified"},verifiedBy:{type:Schema.Types.ObjectId,ref:"Admin"},
 state:{type:String,default:"topic_selected",index:true},language:String,words:Number,tone:String,categoryId:{type:Schema.Types.ObjectId,ref:"Category"},
 scheduledAt:Date,article:{type:Schema.Types.ObjectId,ref:"Article"},articleId:{type:Schema.Types.ObjectId,default:()=>new mongoose.Types.ObjectId()},
 owner:{type:Schema.Types.ObjectId,ref:"Admin"},draft:Schema.Types.Mixed,images:[Schema.Types.Mixed],imageCount:Number,
 approvedHash:String,approvedBy:{type:Schema.Types.ObjectId,ref:"Admin"},sensitive:{type:Boolean,default:true},replaceDraft:Boolean,replaceImages:Boolean,
 attempts:{type:Number,default:0},nextAttemptAt:Date,error:String,resumeState:String,usage:Schema.Types.Mixed,providerModel:String,
 history:[{at:Date,event:String,message:String}],publishedAt:Date,
},{timestamps:true});
task.index({state:1,nextAttemptAt:1,scheduledAt:1});
export const AutomationTask=mongoose.model("AutomationTask",task);
