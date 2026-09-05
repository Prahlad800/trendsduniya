export const siteConfig = {
  name: 'TrendsDuniya',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://trendsduniya.com',
  // TODO: Set the owner's genuine contact email before production.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  socialUrls: [] as string[],
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
};
export const policyLinks = [
  ['About', '/about'], ['Contact', '/contact'], ['Privacy Policy', '/privacy-policy'],
  ['Terms', '/terms'], ['Disclaimer', '/disclaimer'], ['Editorial Policy', '/editorial-policy'],
  ['Corrections Policy', '/corrections-policy'],
] as const;
