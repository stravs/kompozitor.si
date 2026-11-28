import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per article; the file name is the URL slug (/clanki/<slug>/).
const clanki = defineCollection({
  loader: glob({ base: './src/content/clanki', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Drafts show in `npm run dev` only, never in the build.
    draft: z.boolean().default(false),
  }),
});

export const collections = { clanki };
