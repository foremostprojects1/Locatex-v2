# Homelengo — React

React port of the Homelengo real-estate HTML template. Every page, style and
interaction of the static site was migrated; the original markup remains the
source of truth for the visual design.

## Commands

```bash
npm install       # install dependencies
npm run dev       # development server (http://localhost:5173)
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run lint      # oxlint
```

Copy `.env.example` to `.env` and fill in the values before running the app if
you need the maps or the mail handlers (see below).

## Structure

```
public/
  images/, fonts/        assets of the original template, paths unchanged
src/
  components/
    common/              PropertyCard, NiceSelect, RangeSliderWidget, GoTop,
                         Lightbox, PropertyMap, DashboardChart, SearchPopup, …
    forms/               ContactForm, CommentForm, PasswordField, MediaUploader
    layout/              Header, MainNav, MobileMenu, Footer, SubscribeForm,
                         DashboardSidebar
    modals/              LoginModal, RegisterModal
    sections/            PartnerSection (shared by six pages)
  constants/             navigation menus, per-page layout metadata
  data/                  listing and map data extracted from the markup
  hooks/                 useSwipers, useWowAnimations, useCounters,
                         useBodyClass, useLegacyWidgets, useSearchPopup
  layouts/               MainLayout, DashboardLayout
  pages/                 one module per route
  services/              api, contactService, subscribeService, googleMaps
  styles/                theme stylesheets (bootstrap, animate, styles.css)
tools/                   one-off migration scripts (see below)
```

## Configuration

| Variable | Used by | Effect when empty |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | `services/googleMaps.js` | map areas show a notice instead of a map |
| `VITE_API_BASE_URL` | `services/api.js` | contact/newsletter requests go to the current origin |

The template shipped with a hard-coded Google Maps key in every page; it now
comes from the environment.

## Third-party libraries

| Library | Why |
| --- | --- |
| `react-router-dom` | routing for the 32 pages of the template |
| `bootstrap` (JS only) | tabs, accordions, dropdowns and modals already use `data-bs-*` attributes |
| `swiper` 8.4.5 | same carousel version the template used |
| `chart.js` | dashboard line chart |

jQuery, jQuery UI, noUiSlider, wow.js, countTo, fancybox, lazysizes,
nice-select and jQuery Validate were dropped; their behaviour is reimplemented
with React state (see `hooks/` and `components/`).

## Migration tooling

`tools/` holds the scripts that produced `src/pages` from the original HTML:

```bash
node tools/generate.js      # HTML -> JSX page modules + extracted data
node tools/postprocess.mjs  # swap the remaining widgets for React components
npx prettier --write "src/**/*.{js,jsx}"
```

They expect the legacy template at
`../homelengohtml-10/homelengohtml-10/homelengo-package/homelengo`. The React
sources are the source of truth from now on — re-running the generator
overwrites `src/pages`.
