// Collects every real photo (with src) from all service galleries for the works page (/radovi/, /en/work/).
// A photo used by several services appears once, tagged with all of their categories.
// Category ids are the language-neutral service keys (file names), so filter anchors match in both languages.
import { getServices, type Lang } from '../i18n';
import sharp from 'sharp'; // installed with Astro
import path from 'node:path';

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
      if (!g.src) continue;
      const existing = bySrc.get(g.src);
      if (existing) {
        existing.categories.push(category);
      } else {
        bySrc.set(g.src, { src: g.src, alt: g.alt, ...(await size(g.src)), categories: [category] });
      }
    }
  }

  const works = [...bySrc.values()];
  const categories = services
    .map((s) => ({
      id: s.key,
      label: label(s),
      count: works.filter((w) => w.categories.some((c) => c.id === s.key)).length,
    }))
    .filter((c) => c.count > 0);

  return { works, categories };
}
