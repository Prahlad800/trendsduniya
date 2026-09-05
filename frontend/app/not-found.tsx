import Link from 'next/link';
export default function NotFound(){return <div className="container not-found"><p className="eyebrow">404 / STORY NOT FOUND</p><h1>That page isn’t here.</h1><p>The link may have changed, or the story may no longer be available.</p><Link className="outline-link" href="/latest">Read the latest stories →</Link><Link href="/search">Search the publication</Link></div>;}
