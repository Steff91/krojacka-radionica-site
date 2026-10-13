// Language helpers. Serbian lives at the root, English under /en/ with translated slugs.
import { getCollection, type CollectionEntry } from 'astro:content';
import { ui } from './ui';
import infoBase from '../data/info.json';
import srSite from '../data/sr/site.json';
import enSite from '../data/en/site.json';
import srAbout from '../data/sr/about.json';
import enAbout from '../data/en/about.json';
import srBrand from '../data/sr/brand.json';
import enBrand from '../data/en/brand.json';
import srProcess from '../data/sr/process.json';
import enProcess from '../data/en/process.json';
import srWork from '../data/sr/work.json';
import enWork from '../data/en/work.json';

export const LANGS = ['sr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'sr';
export const HTML_LANG: Record<Lang, string> = { sr: 'sr-Latn', en: 'en' };
export type Alternates = Partial<Record<Lang, string>>;

export function getLang(url: URL): Lang {
  return url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'sr';
}

export const t = (lang: Lang) => ui[lang];

// --- Static routes ---
const ROUTES = {
  home: { sr: '/', en: '/en/' },
  services: { sr: '/usluge/', en: '/en/services/' },
  about: { sr: '/o-nama/', en: '/en/about/' },
  works: { sr: '/radovi/', en: '/en/work/' },
  contact: { sr: '/kontakt/', en: '/en/contact/' },
  booking: { sr: '/zakazite-konsultaciju/', en: '/en/book-a-consultation/' },
} satisfies Record<string, Record<Lang, string>>;
export type RouteKey = keyof typeof ROUTES;

export const route = (lang: Lang, key: RouteKey) => ROUTES[key][lang];
export const alternatesFor = (key: RouteKey): Alternates => ({ ...ROUTES[key] });
export const bookingUrl = (lang: Lang, serviceKey?: string) =>
  route(lang, 'booking') + (serviceKey ? `?usluga=${serviceKey}` : '');

// --- Data files ---
const DATA = {
  sr: { site: srSite, about: srAbout, brand: srBrand, process: srProcess, work: srWork },
  en: { site: enSite, about: enAbout, brand: enBrand, process: enProcess, work: enWork },
};
export const getData = (lang: Lang) => DATA[lang];
/** Language-neutral business info merged with localized fields (tagline, city, hours, directions). */
export const getInfo = (lang: Lang) => ({ ...infoBase, ...DATA[lang].site });

// --- Bilingual collections (files in <collection>/<lang>/<key>.md) ---
const split = (id: string) => {
  const [lang, ...rest] = id.split('/');
  return { lang: lang as Lang, key: rest.join('/') };
};

export type Service = CollectionEntry<'services'> & { key: string; slug: string; url: string; lang: Lang };

export async function getServices(lang: Lang): Promise<Service[]> {
  const entries = await getCollection('services', (e) => e.id.startsWith(`${lang}/`));
  return entries
    .map((e) => {
      const { key } = split(e.id);
      const slug = e.data.urlSlug ?? key;
      return Object.assign(e, { key, slug, lang, url: `${route(lang, 'services')}${slug}/` });
    })
    .sort((a, b) => a.data.order - b.data.order);
}

/** URL of the same service in every language that has it. */
export async function serviceAlternates(key: string): Promise<Alternates> {
  const out: Alternates = {};
  for (const l of LANGS) {
    const s = (await getServices(l)).find((x) => x.key === key);
    if (s) out[l] = s.url;
  }
  return out;
}

export type Legal = CollectionEntry<'legal'> & { key: string; slug: string; url: string; lang: Lang };

export async function getLegal(lang: Lang): Promise<Legal[]> {
  const entries = await getCollection('legal', (e) => e.id.startsWith(`${lang}/`));
  return entries.map((e) => {
    const { key } = split(e.id);
    const slug = e.data.urlSlug ?? key;
    return Object.assign(e, { key, slug, lang, url: lang === 'sr' ? `/${slug}/` : `/en/${slug}/` });
  });
}

export async function legalUrl(lang: Lang, key: string) {
  return (await getLegal(lang)).find((l) => l.key === key)?.url ?? route(lang, 'home');
}

export async function legalAlternates(key: string): Promise<Alternates> {
  const out: Alternates = {};
  for (const l of LANGS) {
    const page = (await getLegal(l)).find((x) => x.key === key);
    if (page) out[l] = page.url;
  }
  return out;
}
