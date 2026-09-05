import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL, pageMetadata } from "@/lib/seo";
import "./globals.css";
export const metadata: Metadata = {
  ...pageMetadata(
    "TrendsDuniya - Latest Google & X Trends Today",
    "Discover today's trending searches, viral topics, Google Trends and X trends with useful explanations and related searches on TrendsDuniya.",
    "/",
  ),
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrendsDuniya - Latest Google & X Trends Today",
    template: "%s | TrendsDuniya",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="shell">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
