// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import { ROUTES, slugsFromContent } from './src/i18n/routes.ts';
import { satteri } from '@astrojs/markdown-satteri';
import externalLinks from './src/lib/external-links.mjs';

// Set per environment in the deploy workflow (repo variable SITE_URL); fallback for local builds.
const site = process.env.SITE_URL || 'https://krojacka.upnestly.com';

// Pairs of Serbian / English paths, so the sitemap can list both language versions of each page (hreflang).
const readdir = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []);
const read = (f) => fs.readFileSync(f, 'utf8');
const pairs = [
  ...Object.values(ROUTES),
  ...Object.values(slugsFromContent('src/content/services', readdir, read))
    .filter((s) => s.sr && s.en)
    .map((s) => ({ sr: `${ROUTES.services.sr}${s.sr}/`, en: `${ROUTES.services.en}${s.en}/` })),
  ...Object.values(slugsFromContent('src/content/legal', readdir, read))
    .filter((s) => s.sr && s.en)
    .map((s) => ({ sr: `/${s.sr}/`, en: `/en/${s.en}/` })),
];
const alternates = new Map();
for (const p of pairs) {
  const links = [
    { lang: 'sr-Latn', url: new URL(p.sr, site).href },
    { lang: 'en', url: new URL(p.en, site).href },
    { lang: 'x-default', url: new URL(p.sr, site).href },
  ];
  alternates.set(new URL(p.sr, site).href, links);
  alternates.set(new URL(p.en, site).href, links);
}

export default defineConfig({
  site,
  trailingSlash: 'always',
  markdown: {
    // External links in Markdown content open in a new tab
    processor: satteri({ hastPlugins: [externalLinks({ site })] }),
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/uskoro/'),
      serialize: (item) => {
        const links = alternates.get(item.url);
        return links ? { ...item, links } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
