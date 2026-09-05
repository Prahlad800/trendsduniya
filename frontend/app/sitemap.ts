import type { MetadataRoute } from 'next';
import { topics } from '@/data/topics';
import { categories } from '@/lib/types';
import { policyLinks } from '@/config/site';
import { absoluteUrl } from '@/lib/seo';
export default function sitemap():MetadataRoute.Sitemap{return [...['/','/latest',...categories.map(c=>`/category/${c.toLowerCase()}`),...policyLinks.map(([,p])=>p)].map(p=>({url:absoluteUrl(p)})),...topics.filter(t=>t.indexable!==false).map(t=>({url:absoluteUrl(`/topic/${t.slug}`),lastModified:new Date(t.updatedAt)}))];}
