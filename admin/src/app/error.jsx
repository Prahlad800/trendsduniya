"use client";
export default function ErrorPage({reset}){const retry=()=>{reset();window.location.reload();};return <div className="empty-state"><h1>Something interrupted your workspace.</h1><p>Your saved work is safe. Try loading this page again.</p><button className="btn primary" onClick={retry}>Try again</button></div>;}

