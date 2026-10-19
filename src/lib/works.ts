// Collects every real photo (with src) from all service galleries for the works page (/radovi/, /en/work/).
// A photo used by several services appears once, tagged with all of their categories.
// Category ids are the language-neutral service keys (file names), so filter anchors match in both languages.
import { getServices, type Lang } from '../i18n';
import sharp from 'sharp'; // installed with Astro
import path from 'node:path';
import extra from '../data/works-tags.json';

export type Work = {
  src: string;
  alt: string;
  width: number;
  height: number;
  categories: { id: string; label: string; href: string }[];
};

const sizeCache = new Map<string, { width: number; height: number }>();
async function size(src: string) {
  if (!sizeCache.has(src)) {
    try {
      const meta = await sharp(path.join(process.cwd(), 'public', src)).metadata();
      sizeCache.set(src, { width: meta.width ?? 4, height: meta.height ?? 5 });
    } catch {
      sizeCache.set(src, { width: 4, height: 5 });
    }
  }
  return sizeCache.get(src)!;
}

export async function getWorks(lang: Lang) {
  const services = await getServices(lang);
  const label = (s: (typeof services)[number]) => s.data.shortLabel ?? s.data.title;
  const bySrc = new Map<string, Work>();

  for (const s of services) {
    const category = { id: s.key, label: label(s), href: s.url };
    for (const g of s.data.gallery) {
      if (!g.src || g.inWorks === false) continue;
      const existing = bySrc.get(g.src);
      if (existing) {
        existing.categories.push(category);
      } else {
        bySrc.set(g.src, { src: g.src, alt: g.alt, ...(await size(g.src)), categories: [category] });
      }
    }
  }

  // Extra tags for the works page only (src/data/works-tags.json); a photo already in a service gallery
  // gets the tag added, other photos appear on the works page only.
  const tagLabel = new Map(extra.tags.map((t) => [t.id, t[lang]]));
  const worksHref = lang === 'sr' ? '/radovi/' : '/en/work/';
  for (const item of extra.items) {
    const cats = item.tags.filter((id) => tagLabel.has(id)).map((id) => ({ id, label: tagLabel.get(id)!, href: worksHref }));
    const existing = bySrc.get(item.src);
    if (existing) existing.categories.push(...cats);
    else bySrc.set(item.src, { src: item.src, alt: item[lang], ...(await size(item.src)), categories: cats });
  }

  const works = [...bySrc.values()];
  const all = [
    ...services.map((s) => ({ id: s.key, label: label(s) })),
    ...extra.tags.map((t) => ({ id: t.id, label: t[lang] })),
  ];
  const categories = all
    .map((c) => ({ ...c, count: works.filter((w) => w.categories.some((x) => x.id === c.id)).length }))
    .filter((c) => c.count > 0);

  return { works, categories };
}
