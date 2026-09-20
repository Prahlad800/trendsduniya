import mongoose from "mongoose";
import Article from "../models/Article.js";
import Author from "../models/Author.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import {success} from "../utils/apiResponse.js";
export const dashboard=async(req,res)=>{
 const filter=req.admin.role==="author"?{createdBy:new mongoose.Types.ObjectId(req.admin.id)}:{};
 const statuses=["published","draft","scheduled","archived","deleted"];
 const [total,counts,views,authors,categories,tags,recent,top]=await Promise.all([
  Article.countDocuments(filter),Promise.all(statuses.map(status=>Article.countDocuments({...filter,status}))),
  Article.aggregate([{$match:filter},{$group:{_id:null,total:{$sum:"$analytics.views"}}}]),
  Author.countDocuments({isActive:true}),Category.countDocuments({isActive:true}),Tag.countDocuments({isActive:true}),
  Article.find(filter).select("title slug status category updatedAt").populate("category","name slug").sort("-updatedAt").limit(6),
  Article.find({...filter,status:"published"}).select("title slug status analytics").sort("-analytics.views").limit(8),
 ]);
 success(res,{totalArticles:total,...Object.fromEntries(statuses.map((s,i)=>[s+"Articles",counts[i]])),totalViews:views[0]?.total||0,totalAuthors:authors,totalCategories:categories,totalTags:tags,recentArticles:recent,topArticles:top});
};

