// After `astro build`:
//  - PUBLIC_COMING_SOON=true → install the coming soon gate (gate.php + .htaccess rules)
//  - otherwise → remove the coming soon page from the output
import { copyFileSync, appendFileSync, rmSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const on = process.env.PUBLIC_COMING_SOON === 'true';

if (on) {
  copyFileSync(new URL('../server/gate.php', import.meta.url), new URL('gate.php', dist));
  appendFileSync(
    new URL('.htaccess', dist),
    `
# --- Coming soon gate (PUBLIC_COMING_SOON=true) ---
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
