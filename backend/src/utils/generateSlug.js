export const generateSlug = value => String(value).normalize("NFKC").toLowerCase().replace(/[.'’]/gu, "").replace(/[^\p{L}\p{N}\p{M}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0,180).replace(/-+$/, "");

