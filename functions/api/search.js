// Cloudflare Pages Function: GET /api/search?q=…
import { pagesFunction, search } from '../../server/serpapi.mjs';

export const onRequestGet = pagesFunction(search);
