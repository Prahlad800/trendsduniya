"use client";
import {useEffect,useRef} from "react";
import {AlertCircle,CheckCircle2,Loader2,X,Inbox} from "lucide-react";
export function Notice({children,type="error"}){if(!children)return null;const Icon=type==="success"?CheckCircle2:AlertCircle;return <div className={`notice ${type}`} role={type==="error"?"alert":"status"}><Icon size={18}/><span>{children}</span></div>;}
export function Loading({label="Loading your workspace"}){return <div className="loading-state" role="status"><Loader2 size={24} className="spin"/><p>{label}</p></div>;}
export function Empty({title="Nothing here yet",description,action}){return <div className="empty-state"><span className="empty-icon"><Inbox size={28}/></span><h3>{title}</h3>{description&&<p>{description}</p>}{action}</div>;}
export function Field({label,hint,children,required}){return <label className="field"><span>{label}{required&&<b className="required"> *</b>}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function Badge({status}){return <span className={`badge ${status}`}><i/>{status}</span>;}
export function PageHeading({eyebrow="WORKSPACE",title,description,actions}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="muted">{description}</p>}</div><div className="heading-actions">{actions}</div></div>;}
export function Modal({title,children,onClose,footer}){
 const ref=useRef(null);
 useEffect(()=>{const el=ref.current;el.showModal();return()=>el.close();},[]);
 return <dialog ref={ref} className="modal" onCancel={onClose}><div className="modal-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div><div className="modal-body">{children}</div>{footer&&<div className="modal-footer">{footer}</div>}</dialog>;
}
export const formatDate=value=>value?new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value)):"—";

