import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {MongoMemoryReplSet} from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import env from "../src/config/env.js";
import Admin from "../src/models/Admin.js";
import ArticleImageBatch from "../src/models/ArticleImageBatch.js";
import RequestQuota from "../src/models/RequestQuota.js";
import cloudinary from "../src/config/cloudinary.js";
import {createImageBatch,generateNextImage,getImageBatch} from "../src/services/ai/article-images.service.js";
import {blankArticle,toPayload} from "../../admin/src/lib/article-form.mjs";
import {mergeGeneratedImages,imageBatchFits} from "../../admin/src/lib/ai-images.mjs";
import {articleInput} from "../src/validators/article.validator.js";
let db,admin,other,token,otherToken,authorToken;
const context={title:"Satellite communication",content:"<h2>Networks</h2><p>Satellites connect remote ground stations using radio signals and orbiting infrastructure.</p>",summary:"How satellites and ground stations carry data across remote areas.",language:"en-IN"};
const plans=()=>({images:Array.from({length:5},(_,i)=>({prompt:`Distinct editorial satellite illustration composition ${i}`,alt:`Satellite illustration ${i}`,caption:`Satellite network perspective ${i}`}))});
const photo=Buffer.from([255,216,255,224,0,1]).toString("base64");
const auth=(req,t=token)=>req.set("Authorization",`Bearer ${t}`);
before(async()=>{
 env.groq={apiKey:"fake-groq-image-planner",model:"test-model"};
 process.env.CLOUDFLARE_ACCOUNT_ID="a".repeat(32);process.env.CLOUDFLARE_API_TOKEN="fake-cloudflare-key";process.env.CLOUDINARY_CLOUD_NAME="fixture";process.env.CLOUDINARY_API_KEY="fake";process.env.CLOUDINARY_API_SECRET="fake";
 db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:"7.0.14"}});await mongoose.connect(db.getUri());await Promise.all([ArticleImageBatch.init(),RequestQuota.init()]);
 const tokens=[];for(const [role,email]of [["superadmin","images-admin@example.test"],["editor","images-editor@example.test"],["author","images-author@example.test"]]){const a=await Admin.create({name:role,email,password:"Strong-password-123",role});if(role==="superadmin")admin=a;if(role==="editor")other=a;tokens.push((await request(app).post("/api/auth/login").send({email,password:"Strong-password-123"})).body.data.accessToken);}[token,otherToken,authorToken]=tokens;
},{timeout:180000});
after(async()=>{await mongoose.disconnect();await db?.stop();});
function mockProviders(t,{failImage=0}={}){
 const calls={planning:0,images:0,uploads:0};
 t.mock.method(globalThis,"fetch",async(url,options)=>{
  if(String(url).includes("api.groq.com")){calls.planning++;const body=JSON.parse(options.body);assert.equal(body.max_completion_tokens,2048);assert.equal(JSON.parse(body.messages[1].content).title,context.title);return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(plans())}}]});}
  calls.images++;assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(),["prompt","steps"]);assert.equal(JSON.parse(options.body).steps,4);
  if(failImage&&calls.images===failImage)return Response.json({errors:[{message:"fake-cloudflare-key"}]},{status:429,headers:{"retry-after":"30"}});
  return Response.json({success:true,result:{image:photo}});
 });
 t.mock.method(cloudinary.uploader,"upload_stream",(options,done)=>({end:()=>{
  calls.uploads++;assert.equal(options.format,"webp");assert.equal(options.transformation[0].width,1920);assert.equal(options.transformation[0].height,1080);assert.equal(options.transformation[0].crop,"fill");
  done(null,{secure_url:`https://res.cloudinary.com/fixture/image/upload/${options.public_id}.webp`,public_id:`trendsduniya/articles/${options.public_id}`,width:1920,height:1080,format:"webp",bytes:4000});
 }}));
 return calls;
}
test("image endpoints require editor permissions and all three article fields",async()=>{
 assert.equal((await request(app).post("/api/admin/ai/image-batches").send(context)).status,401);
 assert.equal((await auth(request(app).post("/api/admin/ai/image-batches"),authorToken).send(context)).status,403);
 assert.equal((await auth(request(app).post("/api/admin/ai/image-batches")).send({...context,summary:""})).status,422);
 assert.equal((await auth(request(app).post("/api/admin/ai/image-batches")).send({...context,content:""})).status,422);
 const bad=await auth(request(app).post("/api/admin/ai/image-batches")).send({...context,apiKey:"private-user-input"});assert.equal(bad.status,422);assert.ok(!JSON.stringify(bad.body).includes("private-user-input"));
 const readiness=await auth(request(app).get("/api/admin/ai/readiness"));assert.equal(readiness.body.data.images.count,5);assert.equal(readiness.body.data.images.configured,true);
});
test("five Full HD images checkpoint individually and the same batch is idempotent",async t=>{
 const calls=mockProviders(t);let batch=await createImageBatch(context,admin);assert.equal(batch.images.length,5);
 const again=await createImageBatch(context,admin);assert.equal(again.id,batch.id);assert.equal(calls.planning,1);
 for(let i=0;i<5;i++){batch=await generateNextImage(batch.id,admin);assert.equal(batch.images.filter(image=>image.url).length,i+1);}
 assert.equal(batch.state,"complete");assert.equal(calls.images,5);assert.equal(calls.uploads,5);assert.ok(batch.images.every(image=>image.width===1920&&image.height===1080&&image.alt&&image.caption.startsWith("AI-generated")));
 await generateNextImage(batch.id,admin);assert.equal(calls.images,5);assert.equal(calls.uploads,5);
 await assert.rejects(getImageBatch(batch.id,other),e=>e.statusCode===404);
 const form=blankArticle();Object.assign(form,context);const merged=mergeGeneratedImages(form,batch.images);assert.equal(merged.media.images.length,4);assert.equal(merged.media.featuredImage.publicId,batch.images[0].publicId);assert.equal(merged.content,form.content);assert.equal(merged.summary,form.summary);
 articleInput.parse(toPayload(merged));assert.deepEqual(mergeGeneratedImages(merged,batch.images),merged);
});
test("failed images keep previous successes and resume without regenerating them",async t=>{
 const calls=mockProviders(t,{failImage:2});const raw={...context,summary:context.summary+" Retry workflow."};let batch=await createImageBatch(raw,admin);
 batch=await generateNextImage(batch.id,admin);const first=batch.images[0].url;
 await assert.rejects(generateNextImage(batch.id,admin),e=>!e.message.includes("fake-cloudflare-key"));
 batch=await getImageBatch(batch.id,admin);assert.equal(batch.state,"failed");assert.equal(batch.images[0].url,first);assert.equal(batch.images[1].status,"failed");assert.ok(new Date(batch.images[1].nextAttemptAt)>Date.now());
 await assert.rejects(generateNextImage(batch.id,admin),e=>e.statusCode===429);assert.equal(calls.images,2);
 await ArticleImageBatch.updateOne({_id:batch.id},{$set:{"images.1.nextAttemptAt":new Date(0)}});
 for(let i=0;i<4;i++)batch=await generateNextImage(batch.id,admin);
 assert.equal(batch.state,"complete");assert.equal(batch.images[0].url,first);assert.equal(calls.images,6);assert.equal(calls.uploads,5);
});
test("worker leases prevent concurrent image calls and expired leases recover",async t=>{
 mockProviders(t);const batch=await createImageBatch({...context,summary:context.summary+" Lease workflow."},admin);
 await ArticleImageBatch.updateOne({_id:batch.id},{$set:{leaseUntil:new Date(Date.now()+60000),leaseToken:"other-worker"}});
 await assert.rejects(generateNextImage(batch.id,admin),e=>e.statusCode===409);
 await ArticleImageBatch.updateOne({_id:batch.id},{$set:{leaseUntil:new Date(0)}});const recovered=await generateNextImage(batch.id,admin);assert.ok(recovered.images[0].url);
});
test("manual media stays attached and gallery capacity is checked before generating",()=>{
 const form=blankArticle();form.media.featuredImage={url:"https://example.org/manual",publicId:"manual",alt:"Manual photo"};const image={url:"https://example.org/ai",publicId:"ai",alt:"AI illustration",prompt:"private plan",status:"complete"};const merged=mergeGeneratedImages(form,[image]);assert.equal(merged.media.featuredImage.publicId,"manual");assert.equal(merged.media.images.length,1);assert.equal(merged.media.images[0].prompt,undefined);
 form.media.images=Array.from({length:27},(_,i)=>({publicId:`manual-${i}`,url:`https://example.org/${i}`}));assert.equal(imageBatchFits(form,{id:"fixture",images:[]}),false);
});
test("daily image quota prevents additional provider requests",async()=>{
 const bucket=Math.floor(Date.now()/86400000);await RequestQuota.updateOne({_id:`ai-image-generation:${admin.id}:${bucket}`},{$set:{count:env.aiImageDailyLimit,expiresAt:new Date(Date.now()+172800000)}},{upsert:true});
 const response=await auth(request(app).post("/api/admin/ai/image-batches/507f1f77bcf86cd799439011/next")).send({});assert.equal(response.status,429);assert.ok(response.headers["retry-after"]);
});
