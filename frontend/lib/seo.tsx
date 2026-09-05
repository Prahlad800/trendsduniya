import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();
export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  return { title, description, alternates: { canonical: absoluteUrl(path) }, robots: { index, follow:true }, openGraph:{ title: `${title} | ${siteConfig.name}`, description, url:absoluteUrl(path), siteName:siteConfig.name, type:'website', locale:'en_IN', alternateLocale:['hi_IN'] }, twitter:{ card:'summary', title, description } };
}
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
