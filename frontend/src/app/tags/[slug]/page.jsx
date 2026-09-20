import {notFound} from "next/navigation";
import {getPublic} from "../../../lib/api";
import StoryListing from "../../../components/story-listing";
export async function generateMetadata({params}){const {slug}=await params;try{const {data}=await getPublic("/tags/"+encodeURIComponent(slug));return {title:data.seoTitle||data.name,description:data.seoDescription||data.description||data.bio};}catch{return {title:"Stories"};}}
export default async function Page({params,searchParams}){const {slug}=await params;let entity;try{entity=(await getPublic("/tags/"+encodeURIComponent(slug))).data;}catch(e){if(e.status===404)notFound();throw e;}return <StoryListing endpoint={`/articles/tag/${encodeURIComponent(slug)}`} title={entity.name} eyebrow="EXPLORE YOUR INTERESTS" description={entity.description||entity.bio||"Fresh stories and thoughtful perspectives."} searchParams={await searchParams} basePath={`/tags/${encodeURIComponent(slug)}`}/>;}

