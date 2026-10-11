// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Set per environment in the deploy workflow (repo variable SITE_URL); fallback for local builds.
  site: process.env.SITE_URL || 'https://krojacka.upnestly.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/admin/') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
