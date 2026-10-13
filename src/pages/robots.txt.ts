// robots.txt with the sitemap location for the current SITE_URL.
// Staging (PUBLIC_NOINDEX) still allows crawling: pages carry <meta name="robots" content="noindex">,
// which crawlers can only see if they are allowed to fetch the page.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
