import {getPublic} from "../lib/api";
import {buildSitemap} from "../lib/sitemap-data.mjs";

// Read current published articles on every request, including new posts.
export const dynamic = "force-dynamic";
export default async function sitemap() {
  return buildSitemap(getPublic);
}
