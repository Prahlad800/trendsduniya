import { topics } from '@/data/topics';
import type { Topic } from './types';
export const latestTopics = () => [...topics].sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt) || Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
export const getTopic = (slug: string) => topics.find(t => t.slug === slug);
export const getRelated = (topic: Topic) => [...new Set(topic.relatedTopics)].filter(s => s !== topic.slug).map(getTopic).filter((t): t is Topic => Boolean(t));
// New stories automatically join relevant article sections through incoming links
// and a small same-category selection. Card counts remain explicit valid links.
export const getRelatedStories = (topic: Topic) => {
  const candidates = [...getRelated(topic), ...latestTopics().filter(t => t.relatedTopics.includes(topic.slug)), ...latestTopics().filter(t => t.category === topic.category)];
  return candidates.filter((t,i,all) => t.slug !== topic.slug && all.findIndex(x => x.slug === t.slug) === i).slice(0,6);
};
export const categorySlug = (category: string) => category.toLowerCase();
export const dateLabel = (date: string, language: 'en' | 'hi' = 'en') => new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'Asia/Kolkata' }).format(new Date(date));
