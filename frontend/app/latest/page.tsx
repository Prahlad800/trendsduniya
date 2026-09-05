import StoryBrowser from '@/components/StoryBrowser';
import { latestTopics } from '@/lib/topics';
import { summaries } from '@/lib/summaries';
import { pageMetadata } from '@/lib/seo';
export const metadata=pageMetadata('Latest Stories','The newest reporting and explainers from TrendsDuniya, ordered by their latest editorial update.','/latest');
export default function Latest(){return <div className="container listing"><p className="eyebrow">THE NEWSROOM</p><h1>Latest Stories</h1><p className="listing-intro">Fresh perspectives. Useful context. The latest from our editorial desk.</p><StoryBrowser stories={summaries(latestTopics())}/></div>;}
