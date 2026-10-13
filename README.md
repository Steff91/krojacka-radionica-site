# krojacka-radionica-site

Website for a tailor's workshop in Belgrade. Astro + Tailwind, Sveltia CMS, deployed via GitHub Actions. Same stack as `bistromat-site`.

## Stack

- **Astro 7** (static output) + **Tailwind CSS 4** (`@tailwindcss/vite`)
- **Cormorant Garamond** (headings) + **DM Sans** (body), self-hosted via Fontsource (latin-ext included)
- **Sveltia CMS** at `/admin` (Git-based, edits commit straight to `main`)
- **GitHub Actions** → build → `rsync` to own server

Requires Node `>=22.12`.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview
```

## Structure

```
src/
  i18n/
    index.ts                # languages, routes per language, getInfo/getData/getServices/getLegal helpers
    ui.ts                   # interface copy (buttons, labels, page titles) for sr + en
  data/
    info.json               # language-neutral: name, address, phone, social links, form endpoint
    sr/ en/                 # per language: site.json (tagline, hours, directions), process, work, about, brand
  content/
    services/sr/*.md        # one file per service → /usluge/<urlSlug or file name>/
    services/en/*.md        # same file name = same service → /en/services/<urlSlug>/
                            # variant: featured = fashion brand development (BrandView layout)
    legal/sr/*.md, en/*.md  # imprint, privacy, cookies (urlSlug sets the English URL)
    blog/*.md               # Serbian only
    testimonials.json       # Google reviews, shown in the original on both languages
  content.config.ts         # collection schemas
  views/                    # page bodies shared by both languages (HomeView, ServiceView, BrandView, …)
  pages/                    # thin routes: Serbian at the root, English under pages/en/
  components/
    sections/               # homepage sections (Hero, Services, Process, Brand, Story, …)
    Header, Footer, TopBar, LangSwitch, Logo, Icon, Placeholder, SectionHeading, BackToTop, …
  layouts/Base.astro        # <head>, hreflang, LocalBusiness JSON-LD, reveal-on-scroll script
public/
  admin/                    # Sveltia CMS config (i18n: multiple_folders)
  uploads/                  # CMS media
  logo.png
```

### Languages

Serbian lives at the root, English under `/en/` with translated slugs. The language comes from the URL.
To add a page in both languages: write a view in `src/views/`, add a route under `pages/` and `pages/en/`,
and register both URLs in `ROUTES` (`src/i18n/index.ts`) so the language switch and hreflang find them.

## Design tokens

Colors are defined in `src/styles/global.css` under `@theme`:
ivory `#FDFAF6`, sand `#F0EAE0`, gold `#C9A96E`, red `#A03C3C`, sage `#8B9E8B`, ink `#2D2926`.

Buttons: `.btn` + `.btn-dark | .btn-outline | .btn-gold | .btn-red | .btn-ghost` (4px radius, 0.3s hover transition).

## Content editing

- Text in `[BRACKETS]` is placeholder content to replace.
- Images: pass `src` to `Placeholder` (or set `image` in the CMS); until then a labelled box is rendered.
- Contact form: set `info.json → formAction` to a form handler endpoint (e.g. Formspree).

## Deploy

Push to `main` runs `.github/workflows/deploy.yml`. Add repository secrets:

| Secret        | Value                                           |
|---------------|-------------------------------------------------|
| `SSH_HOST`    | server hostname / IP                            |
| `SSH_USER`    | deploy user (write access to the web root only) |
| `SSH_KEY`     | private key of a dedicated deploy key pair      |
| `REMOTE_PATH` | web root                                        |

Without `SSH_HOST` the workflow only builds (useful as a CI check).

## TODO

- [ ] Service page copy (all six + fashion brand development)
- [ ] "Naša priča" / O nama page
- [ ] Real photos (consider moving uploads to `src/assets` for Astro image optimization)
- [ ] Address, email, form handler (`formAction`) and success/error states
- [ ] SVG version of the logo
- [ ] Instagram feed (widget or static grid)
- [ ] Set production domain in `astro.config.mjs` (`site`)
