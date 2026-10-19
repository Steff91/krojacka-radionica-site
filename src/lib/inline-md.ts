// Minimal inline Markdown for short CMS text fields (intro, FAQ answers): only [label](url) links.
// Everything else is escaped. External links open in a new tab.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function inlineMd(text: string) {
  return esc(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const external = /^https?:\/\//.test(url);
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
}

/** Plain text without link markup (meta tags, JSON-LD) */
export const stripMd = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
