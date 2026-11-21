// Local API server for development: `npm run api` (reads SERPAPI_KEY from server/.env).
// The Angular dev server proxies /api here. In production the same handlers run
// as Cloudflare Pages Functions (functions/api/*).

import { createServer } from 'node:http';
import { search, storeLink } from './serpapi.mjs';

const PORT = Number(process.env.PORT) || 3001;
const API_KEY = process.env.SERPAPI_KEY || '';
const ROUTES = { '/api/search': search, '/api/store-link': storeLink };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const handler = req.method === 'GET' && ROUTES[url.pathname];
  const { status, body } = handler ? await handler(url, API_KEY) : { status: 404, body: { error: 'Not found' } };
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}).listen(PORT, () => {
  console.log(`FashionFinder API on http://localhost:${PORT}${API_KEY ? '' : '  (SERPAPI_KEY not set)'}`);
});
