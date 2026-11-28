import { getCollection } from 'astro:content';

/** Published articles, newest first. Drafts are included only in dev. */
export async function getArticles() {
  const articles = await getCollection('clanki', ({ data }) => import.meta.env.DEV || !data.draft);
  return articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const formatDate = (date: Date) => new Intl.DateTimeFormat('sl-SI', { dateStyle: 'long' }).format(date);
