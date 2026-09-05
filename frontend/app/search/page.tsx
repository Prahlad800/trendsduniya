import StoryBrowser from '@/components/StoryBrowser';
import { latestTopics } from '@/lib/topics';
import { summaries } from '@/lib/summaries';
import { pageMetadata } from '@/lib/seo';
export const metadata=pageMetadata('Search Stories','Find Hindi and English stories by topic, category or keyword.','/search',false);
export default function Search(){return <div className="container listing"><p className="eyebrow">FIND YOUR NEXT READ</p><h1>Search Stories</h1><StoryBrowser search stories={summaries(latestTopics())}/></div>;}
