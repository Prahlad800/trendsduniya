import sanitizeHtml from "sanitize-html";
// Explicit value grammars keep article styling readable without allowing URL
// loads, positioning overlays, hidden text, or arbitrary CSS expressions.
const color = /^#[\da-f]{3}(?:[\da-f]{3})?$/i;
const space = /^(?:0|(?:[0-9]|[1-3][0-9]|40)px|(?:0(?:\.[0-9]+)?|[1-2](?:\.[0-9]+)?|3)rem)$/;
const articleStyles = { "*": {
  color: [color], "background-color": [color],
  "font-size": [/^(?:1(?:\.[0-9]+)?|2(?:\.[0-4][0-9]*)?|2\.5)rem$/],
  "font-weight": [/^(?:normal|bold|[4-7]00)$/],
  "line-height": [/^(?:1\.[5-9]|2)$/],
  "text-align": [/^(?:left|center|right)$/],
  "margin-top": [space], "margin-bottom": [space],
  padding: [space], "padding-left": [space],
  border: [/^[1-3]px solid #[\da-f]{3}(?:[\da-f]{3})?$/i],
  "border-left": [/^[1-4]px solid #[\da-f]{3}(?:[\da-f]{3})?$/i],
  "border-radius": [/^(?:0|[1-9]px|1[0-6]px)$/],
  "border-collapse": [/^collapse$/],
  width: [/^100%$/], "max-width": [/^100%$/],
  "table-layout": [/^fixed$/], "overflow-wrap": [/^(?:anywhere|break-word)$/],
} };
const htmlOptions = {
  allowedTags: ["p","br","h2","h3","h4","strong","em","b","i","u","blockquote","ul","ol","li","a","img","figure","figcaption","pre","code","table","thead","tbody","tr","th","td","hr"],
  allowedAttributes: { "*": ["style"], a: ["href","title","rel"], img: ["src","alt","width","height"] },
  allowedStyles: articleStyles,
  allowedSchemes: ["https","http","mailto"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
};
export const cleanHtml = (value = "") => sanitizeHtml(value, htmlOptions);
export const cleanGeneratedHtml = (value = "") => sanitizeHtml(value, {
  ...htmlOptions,
  allowedTags: ["p","br","h2","h3","ul","ol","li","strong","em","blockquote","table","thead","tbody","tr","th","td","hr"],
  allowedAttributes: { "*": ["style"] },
  transformTags: {},
});
export const plainText = (value = "") => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
export const safeInternalUrl = (value = "") => value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
export const xmlEscape = value => String(value).replace(/[<>&"']/g, char => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;", "'":"&apos;" })[char]);
