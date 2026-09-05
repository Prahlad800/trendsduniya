import type { Topic } from './types';
import { dateLabel,getRelated } from './topics';
export const summaries=(topics:Topic[])=>topics.map(t=>({slug:t.slug,title:t.title,excerpt:t.excerpt,category:t.category,language:t.language,date:dateLabel(t.updatedAt),updatedAt:t.updatedAt,relatedCount:getRelated(t).length,relatedSearches:t.relatedSearches}));
