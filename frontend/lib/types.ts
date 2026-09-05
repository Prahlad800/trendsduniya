export const categories = ['Sports', 'Entertainment', 'Technology', 'Automobile', 'Education', 'Science', 'Health', 'Business', 'Finance', 'India', 'World', 'Lifestyle'] as const;
export type Category = typeof categories[number];
export interface Topic {
  id: string;
  slug: string;
  title: string;
  language: 'en' | 'hi';
  category: Category;
  excerpt: string;
  introduction: string;
  sections: { heading: string; paragraphs: string[] }[];
  keyPoints?: string[];
  relatedSearches?: string[];
  relatedTopics: string[];
  faqs?: { question: string; answer: string }[];
  sources?: { name: string; url: string }[];
  publishedAt: string;
  updatedAt: string;
  featured?: boolean;
  breaking?: boolean;
  indexable?: boolean;
  image?: string;
  imageAlt?: string;
  imageCredit?: string;
}
