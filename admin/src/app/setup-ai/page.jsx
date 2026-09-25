"use client";
import {useEffect,useRef,useState} from "react";
import {BrainCircuit,Loader2} from "lucide-react";
import {apiGet} from "../../lib/api";
import {PageHeading,Notice,Loading} from "../../components/ui";
export default function AIStatus(){
 const [status,setStatus]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const lock=useRef(false);
 useEffect(()=>{let active=true;apiGet("/admin/ai/readiness").then(r=>{if(active)setStatus(r.data);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function test(){if(lock.current)return;lock.current=true;setBusy(true);setError("");try{const r=await apiGet("/admin/ai/status");setStatus(r.data);}catch(e){setError(e.message);setStatus(s=>({...s,connected:false}));}finally{lock.current=false;setBusy(false);}}
 return <><PageHeading title="AI Status" description="Article writing and trending topics share one Gemini connection."/><Notice>{error}</Notice>{loading?<Loading/>:<section className="panel" style={{maxWidth:820}}><div className="panel-head"><h2><BrainCircuit size={18}/> Gemini</h2></div><div className="panel-body"><p>AI Provider: Gemini</p><p>Model: {status?.model||"Not configured"}</p><p>Configuration: {status?.configured?"Configured":"Not configured"}</p><p role="status">Connection: {busy?"Testing?":status?.connected===true?"Connected":status?.connected===false?"Failed":"Not tested"}</p><p className="muted">The server administrator manages the Gemini connection. All AI features use these settings.</p><button className="btn primary" disabled={busy} onClick={test}>{busy&&<Loader2 size={15} className="spin"/>}Test connection</button></div></section>}</>;
}
