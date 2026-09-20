import { NextResponse } from "next/server";
const base=(process.env.API_URL||process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api").replace(/\/$/,"");
const secure=process.env.NODE_ENV==="production";
const refreshing=new Map();
function refreshSession(refreshToken){
 if(!refreshing.has(refreshToken)){
  const promise=fetch(base+"/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken}),cache:"no-store",signal:AbortSignal.timeout(10000)}).then(async response=>response.ok?(await response.json()).data:null);
  refreshing.set(refreshToken,promise);
  promise.finally(()=>{const timer=setTimeout(()=>refreshing.delete(refreshToken),5000);timer.unref?.();}).catch(()=>{});
 }
 return refreshing.get(refreshToken);
}
function cookie(res,name,value,maxAge){res.cookies.set(name,value,{httpOnly:true,secure,sameSite:"strict",path:"/api/cms",maxAge});}
async function proxy(req,{params}){
 const path="/"+(await params).path.map(encodeURIComponent).join("/");
 if(!/^\/(auth|admin|articles|categories|tags|authors|health)(\/|$)/.test(path))return NextResponse.json({message:"Not found"},{status:404});
 if(!["GET","HEAD"].includes(req.method)){
  const origin=req.headers.get("origin");
  if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({message:"Invalid request origin"},{status:403});
 }
 const contentType=req.headers.get("content-type");
 const headers=new Headers();if(contentType)headers.set("Content-Type",contentType);
 const access=req.cookies.get("td_access")?.value;
 if(access)headers.set("Authorization",`Bearer ${access}`);
 const body=["GET","HEAD"].includes(req.method)?undefined:await req.arrayBuffer();
 const url=base+path+new URL(req.url).search;
 let tokens;
 try{
  let upstream=await fetch(url,{method:req.method,headers,body,cache:"no-store",signal:AbortSignal.timeout(25000)});
  const refreshToken=req.cookies.get("td_refresh")?.value;
  if(upstream.status===401&&refreshToken&&path!=="/auth/login"){
   const refreshed=await refreshSession(refreshToken);
   if(refreshed){
    tokens=refreshed;headers.set("Authorization",`Bearer ${tokens.accessToken}`);
    upstream=await fetch(url,{method:req.method,headers,body,cache:"no-store",signal:AbortSignal.timeout(25000)});
   }
  }
  const payload=await upstream.json().catch(()=>({success:false,message:"Invalid API response"}));
  if(path==="/auth/login"&&upstream.ok)tokens=payload.data;
  const safePayload=path==="/auth/login"&&upstream.ok?{...payload,data:{admin:payload.data.admin}}:payload;
  const response=NextResponse.json(safePayload,{status:upstream.status,headers:{"Cache-Control":"no-store"}});
  if(tokens){cookie(response,"td_access",tokens.accessToken,900);cookie(response,"td_refresh",tokens.refreshToken,7*86400);}
  if(path==="/auth/logout"||upstream.status===401){cookie(response,"td_access","",0);cookie(response,"td_refresh","",0);}
  return response;
 }catch{return NextResponse.json({success:false,message:"The CMS server is unavailable. Please try again."},{status:503});}
}
export {proxy as GET,proxy as POST,proxy as PUT,proxy as PATCH,proxy as DELETE};
