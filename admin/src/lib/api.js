import {sessionExpired,sessionSignal,expireSession,resetSession,setSessionExpiry,checkSessionExpiry} from "./session-state.mjs";
export class ApiError extends Error { constructor(message,status,errors){super(message);this.status=status;this.errors=errors;} }
async function request(path,options={}){
 const authAction=path==="/auth/login"||path==="/auth/logout";
 if(!authAction)checkSessionExpiry();
 if(sessionExpired()&&!authAction)throw new ApiError("Session expired. Please sign in.",401);
 const headers=new Headers(options.headers);
 if(options.body&&!(options.body instanceof FormData))headers.set("Content-Type","application/json");
 let response;
 const deadline=AbortSignal.timeout(/^\/admin\/(ai|trending)(\/|$)/.test(path)?285000:35000);
 // Concurrent session probes must finish normally: the first 401 can expire
 // the session while another probe is still reading its response body.
 const signal=AbortSignal.any([deadline,...(!authAction&&path!=="/auth/me"?[sessionSignal()]:[]),...(options.signal?[options.signal]:[])]);
 try{response=await fetch(`/api/cms${path}`,{...options,signal,headers,cache:"no-store"});}catch(error){
  if(!authAction&&sessionExpired())throw new ApiError("Session expired. Please sign in.",401);
  if(error?.name==="AbortError")throw error;
  if(deadline.aborted||error?.name==="TimeoutError")throw new ApiError("Request timed out. Please try again.",408);
  throw new ApiError("Unable to connect. Check your connection and try again.",0);
 }
 let payload;
 try{payload=await response.json();}catch{
  if(signal.aborted){if(!authAction&&sessionExpired())throw new ApiError("Session expired. Please sign in.",401);if(deadline.aborted)throw new ApiError("Request timed out. Please try again.",408);signal.throwIfAborted();}
 }
 const valid=payload!==null&&typeof payload==="object"&&!Array.isArray(payload);
 if(!response.ok){
  if(response.status===401&&path!=="/auth/login")expireSession();
  const error=new ApiError(valid&&typeof payload.message==="string"?payload.message:"The CMS request failed. Please try again.",response.status,valid?payload.errors:undefined);error.errorCode=valid?payload.errorCode:undefined;throw error;
 }
 if(!authAction&&sessionExpired())throw new ApiError("Session expired. Please sign in.",401);
 if(!valid||payload.success===false)throw new ApiError("The CMS returned an invalid response. Please try again.",502);
 if(path==="/auth/login")resetSession();
 setSessionExpiry(response.headers.get("X-Session-Expires-At"));
 return payload;
}
export const apiGet=(path,options)=>request(path,options);
export function apiUpload(path,body,onProgress){
 if(sessionExpired())return Promise.reject(new ApiError("Session expired. Please sign in.",401));
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhr.open("POST",`/api/cms${path}`);
  xhr.timeout=120000;
  xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.min(100,Math.round(event.loaded/event.total*100)));};
  xhr.upload.onload=()=>onProgress(100);
  xhr.onload=()=>{
   let payload;try{payload=JSON.parse(xhr.responseText);}catch{payload={};}
   if(xhr.status>=200&&xhr.status<300&&payload.data?.url)return resolve(payload);
   if(xhr.status===401)expireSession();
   reject(new ApiError(payload.message||(xhr.status===413?"Image is too large. Choose an image under 4 MB.":"Image upload failed. Please try again."),xhr.status,payload.errors));
  };
  xhr.onerror=()=>reject(new ApiError("Upload interrupted. Check your connection and try again.",0));
  xhr.ontimeout=()=>reject(new ApiError("Upload timed out. Please try again.",408));
  xhr.onabort=()=>reject(new ApiError("Upload cancelled.",0));
  const signal=sessionSignal(),cancel=()=>xhr.abort();
  signal.addEventListener("abort",cancel,{once:true});
  xhr.onloadend=()=>signal.removeEventListener("abort",cancel);
  xhr.send(body);
 });
}
export const apiPost=(path,body={},options={})=>request(path,{...options,method:"POST",body:body instanceof FormData?body:JSON.stringify(body)});
export const apiPut=(path,body)=>request(path,{method:"PUT",body:JSON.stringify(body)});
export const apiPatch=(path,body)=>request(path,{method:"PATCH",body:JSON.stringify(body)});
export const apiDelete=(path,body)=>request(path,{method:"DELETE",body:body?JSON.stringify(body):undefined});
export const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
