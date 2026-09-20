import "./globals.css";
import {AuthProvider} from "../components/auth-provider";
import AdminShell from "../components/admin-shell";
export const metadata={title:{default:"TrendsDuniya Studio",template:"%s · TrendsDuniya Studio"},description:"Your editorial workspace",robots:{index:false,follow:false}};
export default function RootLayout({children}){return <html lang="en"><body><AuthProvider><AdminShell>{children}</AdminShell></AuthProvider></body></html>;}

