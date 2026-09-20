import env from "../config/env.js";
import { generateArticleSitemap } from "../services/sitemap.service.js";
export const sitemap = async (req, res, next) => {
  try {
    res.type("application/xml").send(await generateArticleSitemap());
  } catch (e) {
    next(e);
  }
};
export const robots = (req, res) =>
  res
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\n\nSitemap: ${env.siteUrl}/sitemap.xml`);
