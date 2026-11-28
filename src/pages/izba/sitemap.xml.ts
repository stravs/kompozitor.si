import type { APIRoute } from 'astro';
import { origin } from '../../izba';
import { getArticles } from '../../lib/clanki';

// Served as https://izba.kompozitor.si/sitemap.xml by the Worker.
export const GET = (async () => {
  const articles = await getArticles();
  const paths = ['/', ...(articles.length ? ['/clanki/', ...articles.map(({ id }) => `/clanki/${id}/`)] : [])];
  const urls = paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
}) satisfies APIRoute;
