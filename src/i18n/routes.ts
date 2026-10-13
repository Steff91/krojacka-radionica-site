// Static routes per language. Plain module (no astro:content) so astro.config can use it for the sitemap.
export const ROUTES = {
  home: { sr: '/', en: '/en/' },
  services: { sr: '/usluge/', en: '/en/services/' },
  about: { sr: '/o-nama/', en: '/en/about/' },
  works: { sr: '/radovi/', en: '/en/work/' },
  contact: { sr: '/kontakt/', en: '/en/contact/' },
  booking: { sr: '/zakazite-konsultaciju/', en: '/en/book-a-consultation/' },
} as const;

/** Read `urlSlug` from each <collection>/<lang>/<key>.md (falls back to the file name). */
export function slugsFromContent(dir: string, readdir: (d: string) => string[], read: (f: string) => string) {
  const out: Record<string, { sr?: string; en?: string }> = {};
  for (const lang of ['sr', 'en'] as const) {
    for (const file of readdir(`${dir}/${lang}`).filter((f) => f.endsWith('.md'))) {
      const key = file.replace(/\.md$/, '');
      const m = read(`${dir}/${lang}/${file}`).match(/^urlSlug:\s*["']?([^"'\n]+)["']?\s*$/m);
      (out[key] ??= {})[lang] = m ? m[1].trim() : key;
    }
  }
  return out;
}
