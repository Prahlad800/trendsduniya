let expired=false;
let requests=new AbortController();
export const sessionExpired=()=>expired;
export const sessionSignal=()=>requests.signal;
export function resetSession(){expired=false;requests=new AbortController();}
export function expireSession(){
  if(expired)return;
  expired=true;requests.abort();
  if(typeof window!=="undefined")window.dispatchEvent(new Event("session-expired"));
}
export function safeReturnPath(value){
  if(typeof value!=="string"||!value.startsWith("/")||value.startsWith("//")||/[\\\u0000-\u0020]/.test(value))return "/";
  try{const url=new URL(value,"https://studio.invalid");return url.origin==="https://studio.invalid"&&!/^\/(login|api)(\/|$)/.test(url.pathname)?url.pathname+url.search+url.hash:"/";}catch{return "/";}
}
export function loginPath(){
  if(typeof window==="undefined"||window.location.pathname==="/login")return "/login";
  return "/login?next="+encodeURIComponent(safeReturnPath(window.location.pathname+window.location.search));
}
