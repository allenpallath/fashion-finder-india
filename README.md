# FashionFinder India

One search across Indian fashion stores. Fill in what you're looking for and the app
shows real listings from Myntra, AJIO, Flipkart, Amazon, Nykaa Fashion and every other
store Google Shopping indexes.

## How it works

- The Angular app builds queries from the form and calls its backend at `/api/search`.
- The backend logic (`server/serpapi.mjs`, no packages) calls the
  [SerpApi](https://serpapi.com) Google Shopping API (India). The key stays on the server.
  It runs as a local Node server in development and as Cloudflare Pages Functions in production.
- "View product" calls `/api/store-link` (1 credit, cached) to get the store's own page,
  falling back to the Google Shopping page.
- The free SerpApi plan has 250 searches a month.

## Run locally

1. `npm install`
2. Copy `server/.env.example` to `server/.env` and set `SERPAPI_KEY`.
3. `npm run api` (backend on port 3001)
4. `npm start` (app on port 4200; `/api` is proxied to the backend by `proxy.conf.json`)

## Project structure

```
src/app/
  shared/        Reusable building blocks
    cta-button.component.ts    <button appCta icon size busy> main pill button
    icon-button.component.ts   <button appIconButton icon size> round white button
    icon.component.ts          <app-icon name size> inline SVG icons
    field.component.ts         <app-field label error> label + control + error
    segmented.component.ts     <app-segmented [options] [(value)]> pick-one toggle (Women | Men)
    listbox.ts                 Arrow/Home/End keyboard helper for dropdowns
    liquid-glass.directive.ts  Glass refraction (Chromium)
  pages/         Routes: home (/), results (/results), wishlist (/wishlist)
  components/    Form controls (glass-select, suggest-input, price-range), search-form,
                 product-card, product-list, bottom-bar, wishlist-link, loader, toast, background
  services/      fashion-search (state as signals, last search kept in sessionStorage),
                 search-query (pure query/filter logic), wishlist (localStorage), store-link, toast
  models/        Product and form types and option lists
src/styles.css   Theme + shared glass classes (lg-panel, lg-bubble, lg-cta, lg-menu, …)
server/          serpapi.mjs (shared API logic), index.mjs (local Node server)
functions/api/   Cloudflare Pages Functions: search.js, store-link.js
```

The results and wishlist pages are lazy-loaded routes (`app.routes.ts`).

## Hosting (Cloudflare Pages)

The site and its `/api` functions deploy together to Cloudflare Pages from GitHub Actions
(`.github/workflows/deploy.yml`) on every push to `main`.

One-time setup:
1. Cloudflare → **Workers & Pages → Create → Pages → Direct Upload**, project name
   `fashion-finder-india` (must match `name` in `wrangler.toml`). Upload any placeholder
   folder to create it, or let the first workflow run create it.
2. In the project: **Settings → Variables and Secrets** → add `SERPAPI_KEY` as a **Secret**
   (Production).
3. Create an API token (**My Profile → API Tokens**) with **Account → Cloudflare Pages → Edit**.
4. In the GitHub repo: **Settings → Secrets and variables → Actions** → add
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
5. Push to `main`. The app is live at `https://fashion-finder-india.pages.dev`.
