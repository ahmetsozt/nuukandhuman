// Tiny templating helpers. Every dynamic value goes through esc() unless it is
// markup produced by these helpers, so content from site.json can never inject HTML.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Pick the language variant of a bilingual {en, tr} value; plain values pass through. */
export function t(value, lang) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !Array.isArray(value) && ("en" in value || "tr" in value)) {
    const picked = value[lang] ?? value.en;
    if (picked === undefined || picked === null) throw new Error(`Missing "${lang}" translation`);
    return picked;
  }
  return value;
}

export const join = (parts) => parts.filter(Boolean).join("\n");

export function createUrls(basePath) {
  const base = basePath.replace(/\/$/, "");
  const prefix = (lang) => (lang === "tr" ? "/tr" : "");
  return {
    base,
    page: (lang, path = "/") => `${base}${prefix(lang)}${path}`,
    asset: (file) => `${base}/assets/${file}`,
  };
}

/** Inline SVG icons kept small and decorative (aria-hidden). */
export const icon = {
  arrow: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  shield: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
