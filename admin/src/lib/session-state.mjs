let expired=false;
let requests=new AbortController();
let expiryTimer,expiresAt=0;
export const sessionExpired=()=>expired;
export const sessionSignal=()=>requests.signal;
export function resetSession(){clearTimeout(expiryTimer);expiresAt=0;expired=false;requests=new AbortController();}
export function setSessionExpiry(value){
  const expiry=Number(value);
  if(!Number.isFinite(expiry)||expiry<=0||expired)return;
  clearTimeout(expiryTimer);expiresAt=expiry;
  if(expiry<=Date.now()){expireSession();return;}
  expiryTimer=setTimeout(expireSession,Math.min(2147483647,expiry-Date.now()));
  expiryTimer.unref?.();
}
export function checkSessionExpiry(){if(expiresAt&&Date.now()>=expiresAt)expireSession();return expired;}
export function expireSession(){
  if(expired)return;
  clearTimeout(expiryTimer);expired=true;requests.abort();
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
