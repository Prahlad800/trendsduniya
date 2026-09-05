import { notFound } from 'next/navigation';
import { categories } from '@/lib/types';
import { latestTopics } from '@/lib/topics';
import { summaries } from '@/lib/summaries';
import { pageMetadata } from '@/lib/seo';
import StoryBrowser from '@/components/StoryBrowser';
export function generateStaticParams(){return categories.map(c=>({slug:c.toLowerCase()}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=categories.find(c=>c.toLowerCase()===slug);if(!category)notFound();return pageMetadata(`${category} News & Explainers`,`Read the latest ${category.toLowerCase()} stories and useful explainers in Hindi and English.`,`/category/${slug}`);}
export default async function Category({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=categories.find(c=>c.toLowerCase()===slug);if(!category)notFound();return <div className="container listing"><p className="eyebrow">EXPLORE THE STORIES</p><h1>{category}</h1><p className="listing-intro">The details behind the {category.toLowerCase()} headlines.</p><StoryBrowser stories={summaries(latestTopics().filter(t=>t.category===category))}/></div>;}
