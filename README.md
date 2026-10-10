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
  data/info.json            # name, address, phone, hours, Instagram, form endpoint
  data/process.json         # 4 process steps (homepage + every service page)
  content/
    services/*.md           # one file per service → /usluge/<file-name>/
                            # variant: featured = fashion brand development (dark layout)
    testimonials.json       # client testimonials; featured: true → homepage
    legal/*.md              # /privatnost/, /kolacici/
  content.config.ts         # collection schemas
  components/
    sections/               # homepage sections (Hero, Services, Process, Brand, Story, …)
    Header, Footer, Logo, Icon (Font Awesome SVG), Placeholder, SectionHeading, BackToTop
  layouts/Base.astro        # <head>, LocalBusiness JSON-LD, reveal-on-scroll script
  pages/
    index.astro
    usluge/[slug].astro     # shared template for all service pages (+ Service JSON-LD)
    [legal].astro
public/
  admin/                    # Sveltia CMS config
  uploads/                  # CMS media
  logo.png
```

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
