"use client";
import {useCallback,useEffect,useState} from "react";
import {apiGet} from "./api";
export function useResource(path){
 const [state,setState]=useState({data:null,pagination:null,loading:true,error:""}),[version,setVersion]=useState(0);
 const reload=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{
  const controller=new AbortController();
    apiGet(path,{signal:controller.signal})
     .then(r=>{if(!controller.signal.aborted)setState({data:r.data??r,pagination:r.pagination,loading:false,error:""});})
     .catch(e=>{if(controller.signal.aborted||e?.name==="AbortError")return;setState({data:null,pagination:null,loading:false,error:e.message});});
  return()=>controller.abort();
 },[path,version]);
 return {...state,reload};
}
