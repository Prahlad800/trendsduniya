"use client";
import {createContext,useContext,useState,useEffect,useCallback} from "react";
import {useRouter,usePathname} from "next/navigation";
import {apiGet,apiPost} from "../lib/api";
import {Loading,Notice} from "./ui";
import {loginPath,safeReturnPath,expireSession,checkSessionExpiry} from "../lib/session-state.mjs";
const AuthContext=createContext(null);
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}){
 const router=useRouter(),pathname=usePathname();
 const [admin,setAdmin]=useState(null),[loading,setLoading]=useState(pathname!=="/login"),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  try{const r=await apiGet("/auth/me");setAdmin(r.data);setError("");}
  catch(e){setAdmin(null);if(e.status!==401)setError(e.message);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{let active=true;
  // Signing in does not require a session probe. Avoid expiring an anonymous
  // session and cancelling parallel requests while the login page mounts.
  if(window.location.pathname==="/login")return;
  apiGet("/auth/me")
   .then(r=>{if(active){setAdmin(r.data);setError("");}})
   .catch(e=>{if(!active||e?.name==="AbortError")return;if(e.status!==401)setError(e.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{const expire=()=>{setAdmin(null);setError("");if(window.location.pathname!=="/login")router.replace(loginPath());};window.addEventListener("session-expired",expire);return()=>window.removeEventListener("session-expired",expire);},[router]);
 useEffect(()=>{if(!loading&&!admin&&!error&&pathname!=="/login")router.replace(loginPath());},[loading,admin,error,pathname,router]);
 useEffect(()=>{
  if(!admin)return;
  let pending=false;
  const check=async()=>{if(checkSessionExpiry()||pending||document.visibilityState==="hidden")return;pending=true;try{await apiGet("/auth/me");}catch(e){if(e.status===401)expireSession();}finally{pending=false;}};
  const timer=setInterval(check,60000);window.addEventListener("focus",check);
  document.addEventListener("visibilitychange",check);
  return()=>{clearInterval(timer);window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",check);};
 },[admin]);
 const login=async(values)=>{const r=await apiPost("/auth/login",values);setAdmin(r.data.admin);setError("");router.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));};
 const logout=async()=>{try{await apiPost("/auth/logout");}finally{expireSession();setAdmin(null);router.replace("/login");}};
 if(loading)return <Loading label="Opening TrendsDuniya Studio"/>;
 if(!admin&&pathname!=="/login")return error?<div className="connection-error"><Notice>{error}</Notice><button className="btn primary" onClick={refresh}>Reconnect</button><a className="btn" href="/login">Go to sign in</a></div>:<Loading label="Opening sign in"/>;
 return <AuthContext.Provider value={{admin,login,logout,refresh}}>{children}</AuthContext.Provider>;
}
