// robots.txt with the sitemap location for the current SITE_URL.
// Coming soon (PUBLIC_COMING_SOON): block all crawlers.
// Staging (PUBLIC_NOINDEX) still allows crawling: pages carry <meta name="robots" content="noindex">,
// which crawlers can only see if they are allowed to fetch the page.
import type { APIRoute } from 'astro';
import { COMING_SOON } from '../lib/coming-soon.mjs';

export const GET: APIRoute = ({ site }) => {
  if (COMING_SOON) {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const sitemap = new URL('/sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
