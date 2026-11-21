// Cloudflare Pages Function: GET /api/store-link?token=…&store=…
import { pagesFunction, storeLink } from '../../server/serpapi.mjs';

export const onRequestGet = pagesFunction(storeLink);
