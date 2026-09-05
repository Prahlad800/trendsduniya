import type { Metadata } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { siteConfig } from '@/config/site';
import './globals.css';
const description='Understand today’s stories with TrendsDuniya: clear news, useful context and original explainers in Hindi and English, across India, sports, technology and more.';
export const metadata:Metadata={metadataBase:new URL(siteConfig.url),title:{default:'TrendsDuniya - Latest Trending News in Hindi & English',template:'%s | TrendsDuniya'},description,robots:{index:true,follow:true},openGraph:{title:'TrendsDuniya - Latest Trending News in Hindi & English',description,url:siteConfig.url,siteName:siteConfig.name,type:'website',locale:'en_IN'},twitter:{card:'summary',title:siteConfig.name,description}};
export default function RootLayout({children}:{children:React.ReactNode}){const ads=/^ca-pub-\d{16}$/.test(siteConfig.adsenseClientId);return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/>{ads&&<Script id="adsense" async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsenseClientId}`} crossOrigin="anonymous"/>}</body></html>;}
