import "./globals.css";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import {getPublic,SITE_URL} from "../lib/api";
export const metadata={metadataBase:new URL(SITE_URL),title:{default:"TrendsDuniya — A world of perspectives",template:"%s | TrendsDuniya"},description:"News, ideas, and useful perspectives. Discover stories that bring you closer to the world.",openGraph:{siteName:"TrendsDuniya",type:"website"}};
export default async function RootLayout({children}){
 const categories=await getPublic("/categories").catch(()=>({data:[]}));
 return <html lang="en-IN"><body id="top"><a className="skip-link" href="#content">Skip to content</a><SiteHeader categories={categories.data||[]}/><div id="content">{children}</div><SiteFooter/></body></html>;
}

