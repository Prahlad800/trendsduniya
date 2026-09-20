"use client";
import Link from "next/link";
import Image from "next/image";
import {useParams} from "next/navigation";
import {useResource} from "../../../../lib/use-resource";
import {Loading,Notice,Badge,formatDate} from "../../../../components/ui";
export default function Preview(){
 const {id}=useParams();const {data,loading,error}=useResource(`/admin/articles/${id}/preview`);
 if(loading)return <Loading label="Preparing your preview"/>;if(error)return <Notice>{error}</Notice>;
 return <div className="panel"><div className="preview-banner">Private preview · Only signed-in team members can see this page.</div><article className="preview-article"><Link href={`/articles/${id}/edit`} className="text-link">← Back to editor</Link><div style={{margin:"25px 0 15px"}}><Badge status={data.status}/></div><p className="eyebrow">{data.category?.name}</p><h1>{data.title}</h1><p className="muted">{data.excerpt}</p><small className="muted">{data.author?.name} · {formatDate(data.updatedAt)}</small>{data.media?.featuredImage?.url&&<Image unoptimized width={1200} height={800} src={data.media.featuredImage.url} alt={data.media.featuredImage.alt||""}/>}<div className="prose" dangerouslySetInnerHTML={{__html:data.content}}/></article></div>;
}


