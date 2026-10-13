// Markdown plugin: links in Markdown content (legal pages, blog, CMS text) that point to another site
// open in a new tab. Written for Astro 7's Markdown processor (Sätteri hast plugin API).
export default function externalLinks({ site } = {}) {
  const own = site ? new URL(site).host : '';
  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = String(node.properties?.href ?? '');
        if (!/^https?:\/\//i.test(href) || new URL(href).host === own) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  };
}
