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

## Project structure

- `app/pages/index.vue` composes the menu page.
- `app/components/` contains the page sections and reusable UI, including the optional `BrandMotionBackground` component.
- `app/data/menu.ts` contains products, categories, navigation, translations, and social links.
- `public/` contains the menu and brand images served by the app.

Arabic is the default locale. Locale-aware copy and RTL direction are managed by `app/composables/useLocale.ts` and `app/data/menu.ts`.

Icons use Nuxt Icon with local Iconify collections. Add an icon in a Vue template with `<Icon name="lucide:icon-name" />`; add dynamic icon names to `icon.clientBundle.icons` in `nuxt.config.ts`.
