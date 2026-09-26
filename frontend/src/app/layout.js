import "./globals.css";
import "./news.css";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import {getPublic,SITE_URL} from "../lib/api";
export const metadata={metadataBase:new URL(SITE_URL),title:{default:"TrendsDuniya - Latest News, Trending News & Breaking News",template:"%s | TrendsDuniya"},description:"Latest India, World, Business, Technology, Sports and Entertainment news from TrendsDuniya.",openGraph:{siteName:"TrendsDuniya",type:"website",title:"TrendsDuniya - Latest News & Breaking News",description:"Latest India, World, Business, Technology, Sports and Entertainment news from TrendsDuniya."},twitter:{card:"summary_large_image",title:"TrendsDuniya - Latest News & Breaking News"}};
export const viewport={width:"device-width",initialScale:1,viewportFit:"cover"};
export default async function RootLayout({children}){
 const categories=await getPublic("/categories").catch(()=>({data:[]}));
 return <html lang="en-IN"><body id="top"><a className="skip-link" href="#content">Skip to content</a><SiteHeader categories={categories.data||[]}/><div id="content">{children}</div><SiteFooter categories={categories.data||[]}/></body></html>;
}

