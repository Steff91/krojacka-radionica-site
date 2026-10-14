// After `astro build`:
//  - COMING_SOON (src/lib/coming-soon.mjs) → install the coming soon gate (gate.php + .htaccess rules)
//  - responsive image copies in /uploads/_w/
//  - otherwise → remove the coming soon page from the output
import { copyFileSync, appendFileSync, rmSync } from 'node:fs';
import { COMING_SOON } from '../src/lib/coming-soon.mjs';
import { WIDTHS } from '../src/lib/responsive-widths.mjs';
import { readdirSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const dist = new URL('../dist/', import.meta.url);
const on = COMING_SOON;

// Responsive copies of /uploads images (see src/lib/responsive.ts)
const uploads = new URL('uploads/', dist);
const out = new URL('_w/', uploads);
mkdirSync(out, { recursive: true });
let made = 0;
for (const f of readdirSync(uploads)) {
  if (!/\.(webp|jpe?g|png)$/i.test(f)) continue;
  const input = new URL(f, uploads).pathname;
  const { width = 0 } = await sharp(input).metadata();
  for (const w of WIDTHS.filter((w) => w < width - 60)) {
    await sharp(input).resize({ width: w }).webp({ quality: 78 }).toFile(new URL(`${f.replace(/\.\w+$/, '')}-${w}.webp`, out).pathname);
    made++;
  }
}
console.log(`[postbuild] ${made} responsive image copies`);

if (on) {
  copyFileSync(new URL('../server/gate.php', import.meta.url), new URL('gate.php', dist));
  appendFileSync(
    new URL('.htaccess', dist),
    `
# --- Coming soon gate (src/lib/coming-soon.mjs) ---
# Pages go through gate.php: coming soon page, or the real page after the preview password.
<IfModule mod_headers.c>
  Header always set X-Robots-Tag "noindex, nofollow"
</IfModule>
<IfModule mod_rewrite.c>
  RewriteCond %{REQUEST_URI} !^/(gate\\.php|robots\\.txt|_astro/|uploads/|api/send\\.php)
  RewriteCond %{REQUEST_URI} !\\.(png|jpe?g|webp|svg|ico|woff2?|css|js)$
  RewriteRule ^ /gate.php [L]
</IfModule>
`,
  );
  console.log('[postbuild] coming soon gate ON');
} else {
  rmSync(new URL('uskoro/', dist), { recursive: true, force: true });
}
