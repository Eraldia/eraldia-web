import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

// Site y base configurables por entorno: GitHub Pages sirve el repo renombrado
// (eraldia-web) en una subcarpeta, así que el workflow define ASTRO_SITE y
// ASTRO_BASE. En local y en Cloudflare Pages (eraldia.com) aplican los defaults.
const site = process.env.ASTRO_SITE ?? 'https://eraldia.com';
const base = process.env.ASTRO_BASE ?? '/';
const prefix = base.replace(/\/$/, '');

// Los enlaces internos escritos en el Markdown (p. ej. /servicios/...) no pasan
// por el helper url(); este plugin los prefija con la base al renderizar.
function rehypeBaseLinks() {
  return (tree) => {
    if (!prefix) return;
    const walk = (node) => {
      if (node.type === 'element' && node.properties) {
        for (const attr of ['href', 'src']) {
          const value = node.properties[attr];
          if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
            node.properties[attr] = prefix + value;
          }
        }
      }
      (node.children ?? []).forEach(walk);
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',

  integrations: [
    sitemap(),
  ],

  markdown: {
    rehypePlugins: [rehypeBaseLinks],
  },

  output: "hybrid",
  adapter: cloudflare()
});