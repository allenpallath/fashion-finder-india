// SerpApi logic shared by the local Node server (server/index.mjs) and the
// Cloudflare Pages Functions (functions/api/*). Uses only web-standard APIs
// (fetch, URL), so it runs in both. Each handler returns { status, body }.

const ENDPOINT = 'https://serpapi.com/search';

// Google reports some stores by domain or with varying case; show one clean name.
const STORE_NAMES = [
  [/amazon/i, 'Amazon'],
  [/myntra/i, 'Myntra'],
  [/ajio/i, 'AJIO'],
  [/flipkart/i, 'Flipkart'],
  [/nykaa/i, 'Nykaa Fashion'],
  [/tata\s*cliq/i, 'Tata CLiQ'],
  [/meesho/i, 'Meesho'],
];

const SIZE_SUFFIX = /[\s\-–,(]+(?:xxs|xs|s|m|l|xl|xxl|xxxl|\d?xl|free\s*size|\d{2})\)?\s*$/i;

const reply = (status, body) => ({ status, body });

function storeName(source) {
  const match = STORE_NAMES.find(([pattern]) => pattern.test(source || ''));
  return match ? match[1] : source || '';
}

function compactCount(n) {
  if (!n) return '';
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k reviews` : `${n} reviews`;
}

function isHttpUrl(value) {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Same item listed once per size: same store + same image, or same title once the size is removed. */
function dedupe(products) {
  const seen = new Set();
  return products.filter((p) => {
    const title = p.productName.toLowerCase().replace(SIZE_SUFFIX, '').trim();
    const keys = [`${p.website}|${title}`, p.imageUrl && `${p.website}|${p.imageUrl}`].filter(Boolean);
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
}

/** One Google Shopping result → the app's Product shape. */
function toProduct(item, index) {
  const price = item.price || '';
  const parsed = typeof item.extracted_price === 'number' ? item.extracted_price : parseFloat(String(price).replace(/[^\d.]/g, ''));
  return {
    id: item.product_id || `${index}-${item.title || ''}`,
    productName: item.title || '',
    price,
    priceValue: Number.isFinite(parsed) ? parsed : null,
    website: storeName(item.source),
    // Google Shopping page for the item; used when the store's own link can't be found.
    productLink: item.product_link || '',
    imageUrl: item.thumbnail || item.serpapi_thumbnail || '',
    thumbnailUrl: item.serpapi_thumbnail || '',
    rating: item.rating != null ? String(item.rating) : '',
    reviewCount: compactCount(item.reviews),
    tags: (item.extensions || []).filter((t) => typeof t === 'string').slice(0, 2),
    // Token for the details request that lists stores with direct links.
    detailsToken: item.immersive_product_page_token || '',
  };
}

async function serpApi(params, apiKey) {
  const query = new URLSearchParams({ ...params, api_key: apiKey });
  const upstream = await fetch(`${ENDPOINT}?${query}`, { signal: AbortSignal.timeout(20000) });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || data.error) {
    const error = new Error(data.error || `Search provider returned ${upstream.status}.`);
    error.status = upstream.ok ? 502 : upstream.status;
    throw error;
  }
  return data;
}

const missingKey = () => reply(500, { error: 'Search is not set up: SERPAPI_KEY is missing on the server.' });

/** GET /api/search?q=… → { products } (SerpApi returns one page of ~40 items). */
export async function search(url, apiKey) {
  if (!apiKey) return missingKey();
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length > 200) return reply(400, { error: 'Search text must be 1–200 characters.' });
  try {
    const data = await serpApi({ engine: 'google_shopping', q, gl: 'in', hl: 'en', google_domain: 'google.co.in' }, apiKey);
    return reply(200, { products: dedupe((data.shopping_results || []).map(toProduct)) });
  } catch (error) {
    console.warn('Search failed:', error.message);
    return reply(error.status || 502, { error: error.status ? error.message : 'Could not reach the search provider. Please try again.' });
  }
}

// Lookups already done (link, or null when the store wasn't listed) so repeat
// clicks don't spend credits. In-memory: per server process / Cloudflare isolate.
const storeLinkCache = new Map();

/**
 * GET /api/store-link?token=…&store=Myntra → { link }
 * Looks up the stores selling a product (1 SerpApi credit) and returns the
 * direct link for the card's store only; otherwise 404 and the app falls back
 * to the Google Shopping page.
 */
export async function storeLink(url, apiKey) {
  if (!apiKey) return missingKey();
  const token = url.searchParams.get('token') || '';
  const store = url.searchParams.get('store') || '';
  if (!token || token.length > 4000) return reply(400, { error: 'Missing product token.' });

  const key = `${token}|${store}`;
  if (!storeLinkCache.has(key)) {
    try {
      const data = await serpApi({ engine: 'google_immersive_product', page_token: token }, apiKey);
      const wanted = storeName(store).toLowerCase();
      const match = (data.product_results?.stores || []).find((s) => isHttpUrl(s.link) && storeName(s.name).toLowerCase() === wanted);
      if (storeLinkCache.size > 500) storeLinkCache.clear();
      storeLinkCache.set(key, match?.link ?? null);
    } catch (error) {
      console.warn(`Store link lookup failed for "${store}": ${error.message}`);
      return reply(error.status || 502, { error: error.message });
    }
  }
  const link = storeLinkCache.get(key);
  return link ? reply(200, { link }) : reply(404, { error: `${store} not found for this product.` });
}

/** Wraps a handler as a Cloudflare Pages Function (the key comes from the SERPAPI_KEY secret). */
export const pagesFunction =
  (handler) =>
  async ({ request, env }) => {
    const { status, body } = await handler(new URL(request.url), env.SERPAPI_KEY);
    return Response.json(body, { status });
  };
