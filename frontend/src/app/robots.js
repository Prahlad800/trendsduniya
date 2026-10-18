import {SITE_URL} from "../lib/site-url.mjs";

export default function robots() {
  return {rules: {userAgent: "*", allow: "/", disallow: ["/search", "/saved"]}, sitemap: `${SITE_URL}/sitemap.xml`};
}
