// After `astro build`:
//  - COMING_SOON (src/lib/coming-soon.mjs) → install the coming soon gate (gate.php + .htaccess rules)
//  - otherwise → remove the coming soon page from the output
import { copyFileSync, appendFileSync, rmSync } from 'node:fs';
import { COMING_SOON } from '../src/lib/coming-soon.mjs';

const dist = new URL('../dist/', import.meta.url);
const on = COMING_SOON;

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
  RewriteCond %{REQUEST_URI} !^/(gate\\.php|robots\\.txt|favicon\\.png|logo\\.png|_astro/|api/send\\.php)
  RewriteRule ^ /gate.php [L]
</IfModule>
`,
  );
  console.log('[postbuild] coming soon gate ON');
} else {
  rmSync(new URL('uskoro/', dist), { recursive: true, force: true });
}
