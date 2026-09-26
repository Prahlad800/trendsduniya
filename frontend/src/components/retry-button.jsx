"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
export default function RetryButton(){const router=useRouter();const [pending,startTransition]=useTransition();return <button className="public-btn dark" disabled={pending} onClick={()=>startTransition(()=>router.refresh())}>{pending?"Retrying…":"Retry"}</button>;}
