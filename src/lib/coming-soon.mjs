// ONE switch for the coming soon gate — applies to local builds, `npm run dev` and GitHub deploys.
//   true  = site closed: coming soon page + preview password, crawlers blocked
//   false = site live
// The env variable PUBLIC_COMING_SOON=true|false (GitHub: repo variable COMING_SOON) overrides it.
import { createHash } from 'node:crypto';

const DEFAULT = true;

const env = (process.env.PUBLIC_COMING_SOON || '').trim();
export const COMING_SOON = env === 'true' ? true : env === 'false' ? false : DEFAULT;

const COOKIE = 'kr_preview';
// sha256 of the preview password, for the local dev server only (the server uses gate.php)
const DEV_PASSWORD_SHA256 = '0f031ed730075e37e10dde7d4f71ecbb2ab310993429005a4960706c7aa3a30b';

/** Vite plugin: the same gate on `npm run dev` */
export function comingSoonDev() {
  return {
    name: 'coming-soon-dev',
    configureServer(server) {
      if (!COMING_SOON) return;
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const path = url.pathname;

        if (req.method === 'POST' && path === '/gate.php') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const form = new URLSearchParams(body);
            const ok = createHash('sha256').update(form.get('password') || '').digest('hex') === DEV_PASSWORD_SHA256;
            let target = form.get('next') || '/';
            if (!/^\/(?!\/)/.test(target) || target.startsWith('/gate.php')) target = '/';
            if (ok) {
              res.writeHead(303, { 'Set-Cookie': `${COOKIE}=ok; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`, Location: target });
            } else {
              res.writeHead(303, { Location: `/uskoro/?greska=1&next=${encodeURIComponent(target)}` });
            }
            res.end();
          });
          return;
        }

        const authorised = (req.headers.cookie || '').split(/;\s*/).includes(`${COOKIE}=ok`);
        const isAsset = /^\/(@|_astro\/|node_modules\/|src\/|__|uskoro\/|favicon\.png|logo\.png|robots\.txt|uploads\/)/.test(path) || /\.\w+$/.test(path);
        if (authorised || isAsset) return next();

        req.url = '/uskoro/' + (path !== '/' ? `?next=${encodeURIComponent(path)}` : '');
        next();
      });
    },
  };
}
