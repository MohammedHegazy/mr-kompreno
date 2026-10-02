# MR.KOMPRENO Digital Menu

E-Menu for MR.KOMPRENO: a responsive, bilingual English/Arabic Nuxt application with RTL support, a filterable product menu, and locally bundled Iconify icons.

## Requirements

- Node.js 24.11+ or 22.19+
- npm

## Setup

```bash
npm install
npm run dev
```

The development server is available at `http://localhost:3000`.

## Build

```bash
npm run build
npm run preview
```

To generate a static site, run `npm run generate`.

## Deploy

`netlify.toml` pins the static build for Netlify:

- Build command: `npm run generate`
- Publish directory: `.output/public`
- Node version: 22 (also pinned by `.nvmrc` and `engines`)

Nuxt 4 requires Node `^20.19.0 || >=22.12.0`; an older Node on the build image makes `nuxt build` exit with code 2.

Settings chosen in the Netlify UI override `netlify.toml`, so set the build command and publish directory in the site settings if they differ.

## Project structure

- `app/pages/index.vue` composes the menu page.
- `app/components/` contains the page sections and reusable UI, including `BrandLoader` and the optional `BrandMotionBackground` component.
- `app/data/menu.ts` contains products, categories, navigation, translations, and social links.
- `public/` contains the menu and brand images served by the app.

Arabic is the default locale. Locale-aware copy and RTL direction are managed by `app/composables/useLocale.ts` and `app/data/menu.ts`.

## Brand loader

`app/components/BrandLoader.vue` renders a full-screen preloader on the first visit of a session. Progress is driven by the real load of the logo and hero image, capped by a minimum and maximum duration, then released with a split-curtain reveal.

- Returning visitors in the same session skip it: the inline head script in `nuxt.config.ts` sets `data-loader="off"` on `<html>` before first paint.
- The `[data-brand-loader]` display gate means the page is never covered when JavaScript is unavailable.
- The loader respects `prefers-reduced-motion` and can be dismissed early with `Escape`.
- Remove the `sessionStorage` flag or clear site data to preview it again.

Icons use Nuxt Icon with local Iconify collections. Add an icon in a Vue template with `<Icon name="lucide:icon-name" />`; add dynamic icon names to `icon.clientBundle.icons` in `nuxt.config.ts`.
