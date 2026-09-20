"use client";
import {createContext,useContext,useState,useEffect,useCallback} from "react";
import {useRouter,usePathname} from "next/navigation";
import {apiGet,apiPost} from "../lib/api";
import {Loading,Notice} from "./ui";
const AuthContext=createContext(null);
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}){
 const [admin,setAdmin]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const router=useRouter(),pathname=usePathname();
 const refresh=useCallback(async()=>{
  try{const r=await apiGet("/auth/me");setAdmin(r.data);setError("");}
  catch(e){setAdmin(null);if(e.status!==401)setError(e.message);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{const controller=new AbortController();
  apiGet("/auth/me",{signal:controller.signal})
   .then(r=>{if(!controller.signal.aborted){setAdmin(r.data);setError("");}})
   .catch(e=>{if(controller.signal.aborted||e?.name==="AbortError")return;if(e.status!==401)setError(e.message);})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{const expire=()=>{setAdmin(null);router.replace("/login");};window.addEventListener("session-expired",expire);return()=>window.removeEventListener("session-expired",expire);},[router]);
 useEffect(()=>{if(!loading&&!admin&&!error&&pathname!=="/login")router.replace("/login");},[loading,admin,error,pathname,router]);
 const login=async(values)=>{const r=await apiPost("/auth/login",values);setAdmin(r.data.admin);setError("");router.replace("/");};
 const logout=async()=>{await apiPost("/auth/logout");setAdmin(null);router.replace("/login");};
 if(loading)return <Loading label="Opening TrendsDuniya Studio"/>;
 if(!admin&&pathname!=="/login")return error?<div className="connection-error"><Notice>{error}</Notice><button className="btn primary" onClick={refresh}>Reconnect</button><a className="btn" href="/login">Go to sign in</a></div>:<Loading label="Opening sign in"/>;
 return <AuthContext.Provider value={{admin,login,logout,refresh}}>{children}</AuthContext.Provider>;
}
