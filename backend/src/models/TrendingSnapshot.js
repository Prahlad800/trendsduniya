import mongoose from "mongoose";
const source=new mongoose.Schema({provider:String,title:String,url:String,position:Number,fetchedAt:Date},{_id:false});
const topic=new mongoose.Schema({title:String,normalizedTitle:String,slug:String,rank:Number,score:Number,categoryGuess:String,whyTrending:String,articleAngle:String,languagePriority:String,sourceCount:Number,sources:[source],relatedQueries:[String],keywords:[String],firstSeenAt:Date,lastSeenAt:Date});
const schema=new mongoose.Schema({date:{type:String,required:true},country:{type:String,required:true},language:{type:String,default:"en-IN"},topics:[topic],sourceHealth:[{_id:false,provider:String,status:String,count:Number,message:String}],topicsCollected:Number,lastRefreshedAt:Date,lastAttemptAt:Date,lockUntil:Date,lockToken:String},{timestamps:true});
schema.index({date:1,country:1},{unique:true});
schema.add({provider:String,model:String,generatedAt:Date});
// Creation time keeps same-day refreshes from extending historical retention.
schema.index({createdAt:1},{expireAfterSeconds:30*86400});
schema.index({country:1,date:-1});
schema.index({"topics._id":1});
export default mongoose.model("TrendingSnapshot",schema);
