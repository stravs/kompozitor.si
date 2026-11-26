import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// https://astro.build/config
export default defineConfig({
  // One small stylesheet: inline it so first paint doesn't wait on a second request.
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()]
  }
});