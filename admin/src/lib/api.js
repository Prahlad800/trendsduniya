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
export const apiPost=(path,body={})=>request(path,{method:"POST",body:body instanceof FormData?body:JSON.stringify(body)});
export const apiPut=(path,body)=>request(path,{method:"PUT",body:JSON.stringify(body)});
export const apiPatch=(path,body)=>request(path,{method:"PATCH",body:JSON.stringify(body)});
export const apiDelete=(path,body)=>request(path,{method:"DELETE",body:body?JSON.stringify(body):undefined});
export const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";

