"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
export default function ArticleError({reset}){const router=useRouter();const [pending,startTransition]=useTransition();return <main className="site-container article-not-found"><p className="eyebrow">PLEASE TRY AGAIN</p><h1>Unable to load this article right now.</h1><p>Please try again in a moment.</p><button className="public-btn dark" disabled={pending} onClick={()=>startTransition(()=>{router.refresh();reset();})}>{pending?"Retrying…":"Retry"}</button></main>;}
