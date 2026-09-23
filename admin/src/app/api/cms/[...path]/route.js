import { NextResponse } from "next/server";
const base=(process.env.API_URL||process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api").replace(/\/$/,"");
export const maxDuration=300;
const secure=process.env.NODE_ENV==="production";
function expiresAt(token){
 try{const exp=JSON.parse(Buffer.from(token.split(".")[1],"base64url").toString()).exp;return Number.isFinite(exp)?exp*1000:null;}catch{return null;}
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
  const upstream=await fetch(url,{method:req.method,headers,body,cache:"no-store",signal:AbortSignal.timeout(/^\/admin\/(ai|trending)(\/|$)/.test(path)?270000:25000)});
  const payload=await upstream.json().catch(()=>null);
  if(!payload||typeof payload!=="object"||Array.isArray(payload))return NextResponse.json({success:false,message:"The CMS backend returned an invalid response."},{status:upstream.ok?502:upstream.status});
  if(upstream.status===404&&payload.message==="Route not found"&&/^\/admin\/(ai|trending)(\/|$)/.test(path)){
   return NextResponse.json({success:false,message:"The configured backend does not have AI/trending routes. Use the updated backend or check API_URL in the admin environment."},{status:502});
  }
  if(path==="/auth/login"&&upstream.ok)tokens=payload.data;
  const safePayload=path==="/auth/login"&&upstream.ok?{...payload,data:{admin:payload.data.admin}}:payload;
  const response=NextResponse.json(safePayload,{status:upstream.status,headers:{"Cache-Control":"no-store",...(upstream.headers.has("retry-after")?{"Retry-After":upstream.headers.get("retry-after")}: {})}});
  const expiry=expiresAt(tokens?.accessToken||access);
  if(upstream.ok&&expiry)response.headers.set("X-Session-Expires-At",String(expiry));
  if(tokens){cookie(response,"td_access",tokens.accessToken,900);cookie(response,"td_refresh",tokens.refreshToken,7*86400);}
  if(path==="/auth/logout"||upstream.status===401){cookie(response,"td_access","",0);cookie(response,"td_refresh","",0);}
  return response;
 }catch(error){return NextResponse.json({success:false,message:error?.name==="TimeoutError"?"The CMS request timed out. Please retry.":"Cannot connect to the CMS backend. Start the backend server and check the admin API_URL setting."},{status:503});}
}
export {proxy as GET,proxy as POST,proxy as PUT,proxy as PATCH,proxy as DELETE};
