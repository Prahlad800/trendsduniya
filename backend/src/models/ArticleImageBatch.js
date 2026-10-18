import mongoose from "mongoose";
const image=new mongoose.Schema({prompt:String,alt:String,caption:String,status:{type:String,default:"pending"},url:String,publicId:String,width:Number,height:Number,format:String,bytes:Number,error:String,attempts:{type:Number,default:0},nextAttemptAt:Date},{_id:false});
const schema=new mongoose.Schema({
 key:{type:String,required:true,unique:true},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"Admin",required:true,index:true},article:{type:mongoose.Schema.Types.ObjectId,ref:"Article"},
 state:{type:String,default:"planning"},language:String,model:{type:String,default:"@cf/black-forest-labs/flux-1-schnell"},
 images:[image],error:String,leaseUntil:Date,leaseToken:String,
},{timestamps:true});
schema.index({createdBy:1,updatedAt:-1});
export default mongoose.model("ArticleImageBatch",schema);
