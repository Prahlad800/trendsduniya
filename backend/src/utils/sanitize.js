import sanitizeHtml from "sanitize-html";
export const cleanHtml = (value = "") => sanitizeHtml(value, {
  allowedTags: ["p","br","h2","h3","h4","strong","em","b","i","u","blockquote","ul","ol","li","a","img","figure","figcaption","pre","code","table","thead","tbody","tr","th","td","hr"],
  allowedAttributes: { a: ["href","title","rel"], img: ["src","alt","width","height"] },
  allowedSchemes: ["https","http","mailto"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
});
export const plainText = (value = "") => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
export const safeInternalUrl = (value = "") => value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
export const xmlEscape = value => String(value).replace(/[<>&"']/g, char => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;", "'":"&apos;" })[char]);

