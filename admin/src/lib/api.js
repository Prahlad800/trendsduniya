export class ApiError extends Error { constructor(message,status,errors){super(message);this.status=status;this.errors=errors;} }
async function request(path,options={}){
 const headers=new Headers(options.headers);
 if(options.body&&!(options.body instanceof FormData))headers.set("Content-Type","application/json");
 let response;
 try{response=await fetch(`/api/cms${path}`,{...options,headers,cache:"no-store"});}catch(error){
  if(error?.name==="AbortError")throw error;
  throw new ApiError("Unable to connect. Check your connection and try again.",0);
 }
 const payload=await response.json().catch(()=>({}));
 if(!response.ok){
  if(response.status===401&&path!=="/auth/login"&&typeof window!=="undefined")window.dispatchEvent(new Event("session-expired"));
  throw new ApiError(payload.message||"Request failed",response.status,payload.errors);
 }
 return payload;
}
export const apiGet=(path,options)=>request(path,options);
export function apiUpload(path,body,onProgress){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhr.open("POST",`/api/cms${path}`);
  xhr.timeout=120000;
  xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.min(100,Math.round(event.loaded/event.total*100)));};
  xhr.upload.onload=()=>onProgress(100);
  xhr.onload=()=>{
   let payload;try{payload=JSON.parse(xhr.responseText);}catch{payload={};}
   if(xhr.status>=200&&xhr.status<300&&payload.data?.url)return resolve(payload);
   if(xhr.status===401)window.dispatchEvent(new Event("session-expired"));
   reject(new ApiError(payload.message||(xhr.status===413?"Image is too large. Choose an image under 4 MB.":"Image upload failed. Please try again."),xhr.status,payload.errors));
  };
  xhr.onerror=()=>reject(new ApiError("Upload interrupted. Check your connection and try again.",0));
  xhr.ontimeout=()=>reject(new ApiError("Upload timed out. Please try again.",408));
  xhr.onabort=()=>reject(new ApiError("Upload cancelled.",0));
  xhr.send(body);
 });
}
export const apiPost=(path,body={})=>request(path,{method:"POST",body:body instanceof FormData?body:JSON.stringify(body)});
export const apiPut=(path,body)=>request(path,{method:"PUT",body:JSON.stringify(body)});
export const apiPatch=(path,body)=>request(path,{method:"PATCH",body:JSON.stringify(body)});
export const apiDelete=(path,body)=>request(path,{method:"DELETE",body:body?JSON.stringify(body):undefined});
export const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
