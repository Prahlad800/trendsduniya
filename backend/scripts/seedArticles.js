import "dotenv/config";

const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running this script.");

const articles = [
  ["India Technology Trends to Watch This Year", "Technology", "How AI, cloud infrastructure and digital public services are reshaping India's technology landscape.", "technology", "guide"],
  ["How Small Businesses Can Use AI Responsibly", "Business", "A practical framework for small teams adopting AI without losing trust, privacy or human judgment.", "business", "guide"],
  ["The Future of Digital Payments in India", "Business", "What safer authentication, instant settlements and better financial access mean for India's next payment wave.", "digital-payments", "analysis"],
  ["Practical Cybersecurity Habits for Everyone", "Technology", "Simple daily habits that reduce account takeovers, phishing risk and avoidable data exposure.", "cybersecurity", "tutorial"],
  ["Why Local News Still Matters", "Society", "Strong local reporting helps communities understand decisions that affect their everyday lives.", "local-news", "opinion"],
  ["A Beginner Guide to Sustainable Living", "Lifestyle", "Small, measurable choices can make sustainable living more practical and affordable.", "sustainable-living", "guide"],
  ["How Data Is Changing Modern Healthcare", "Science", "Responsible use of data is helping clinicians detect patterns while keeping patient trust central.", "healthcare-data", "analysis"],
  ["The Rise of Creator-Led Businesses", "Business", "Creators are turning audiences into durable businesses through products, memberships and community.", "creator-business", "analysis"],
  ["Simple Ways to Build Better Work Habits", "Lifestyle", "A calmer work system starts with clear priorities, smaller feedback loops and protected focus time.", "work-habits", "guide"],
  ["What the Next Generation of Web Apps Needs", "Technology", "Fast, accessible and privacy-aware web apps are setting a higher standard for digital products.", "next-web-apps", "article"],
];

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} ${response.status}: ${body.message || "Request failed"}`);
  return body;
};

const login = await request("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const auth = { Authorization: `Bearer ${login.data.accessToken}` };

const create = async (path, body) => request(path, {
  method: "POST",
  headers: { ...auth, "content-type": "application/json" },
  body: JSON.stringify(body),
});
const list = async path => (await request(path, { headers: auth })).data;

const categoryByName = new Map((await list("/api/admin/categories")).map(item => [item.name, item]));
for (const name of [...new Set(articles.map(article => article[1]))]) {
  if (!categoryByName.has(name)) categoryByName.set(name, (await create("/api/admin/categories", { name, description: `${name} reporting and perspectives from TrendsDuniya.` })).data);
}

let author = (await list("/api/admin/authors"))[0];
if (!author) author = (await create("/api/admin/authors", { name: "TrendsDuniya Editorial Desk", bio: "The TrendsDuniya editorial team reports, explains and contextualizes the stories shaping everyday life.", designation: "Editorial Desk", website: "" })).data;

const tagNames = [...new Set(articles.map(article => article[3]))];
const tagByName = new Map((await list("/api/admin/tags")).map(item => [item.name, item]));
for (const name of tagNames) {
  if (!tagByName.has(name)) tagByName.set(name, (await create("/api/admin/tags", { name, description: `TrendsDuniya coverage about ${name.replaceAll("-", " ")}.` })).data);
}

const adminArticles = await list("/api/admin/articles?limit=100");
let updated = 0;
for (let index = 0; index < articles.length; index += 1) {
  const [title, categoryName, excerpt, tagName, articleType] = articles[index];
  const article = adminArticles.find(item => item.title === title);
  if (!article) throw new Error(`Article not found: ${title}`);

  const imageResponse = await fetch(`https://picsum.photos/seed/trendsduniya-${index + 1}/1200/630`);
  if (!imageResponse.ok) throw new Error(`Photo download failed for ${title}: ${imageResponse.status}`);
  const imageForm = new FormData();
  imageForm.append("image", new Blob([await imageResponse.arrayBuffer()], { type: "image/jpeg" }), `trendsduniya-${index + 1}.jpg`);
  const uploaded = await request("/api/admin/upload/image", { method: "POST", headers: auth, body: imageForm });

  const slug = article.slug;
  const content = `<p>${excerpt}</p><h2>What this means</h2><p>${excerpt} This article brings together practical context, verified observations and clear next steps for readers.</p><h2>Key takeaways</h2><ul><li>Good decisions start with reliable information.</li><li>People and communities should remain at the center of change.</li><li>Small, measurable actions create lasting progress.</li></ul><p>TrendsDuniya will continue tracking this topic as new evidence and perspectives emerge.</p>`;
  const body = {
    title, slug, excerpt, content,
    summary: `${excerpt} A clear TrendsDuniya perspective with practical context and takeaways.`,
    articleType, language: "en-IN", articleSection: categoryName, trendingTopic: tagName,
    category: categoryByName.get(categoryName)._id, author: author._id,
    tags: [tagByName.get(tagName)._id], relatedArticles: [], visibility: "public", status: "draft",
    media: { featuredImage: { ...uploaded.data, alt: `${title} featured photo`, caption: `${title} | TrendsDuniya` }, images: [] },
    seo: {
      searchIntent: "informational", searchIntentDescription: excerpt,
      primaryKeyword: tagName.replaceAll("-", " "), relatedKeywords: [tagName.replaceAll("-", " "), categoryName, "TrendsDuniya"],
      relatedTopics: [categoryName, "India", "current affairs"], metaTitle: title,
      metaDescription: excerpt, robots: { index: true, follow: true, maxSnippet: -1, maxImagePreview: "large", maxVideoPreview: -1 },
    },
    source: { name: "TrendsDuniya Editorial Desk", type: "original", attributionText: "Original editorial content by TrendsDuniya." },
    originalData: { hasOriginalReporting: true, hasOriginalAnalysis: true, hasOriginalResearch: false, hasOriginalImages: false, notes: "Seeded editorial article for the TrendsDuniya content database." },
  };
  await request(`/api/admin/articles/${article._id}`, { method: "PATCH", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(body) });
  await request(`/api/admin/articles/${article._id}/publish`, { method: "POST", headers: auth });
  updated += 1;
  console.log(`published ${updated}/10: ${title}`);
}
console.log(`Seed complete: ${updated} complete published articles with Cloudinary photos.`);
