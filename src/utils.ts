// Base del despliegue: '/' en producción (eraldia.com) y '/eraldia-web' en
// GitHub Pages (el repo se sirve en una subcarpeta). Ver ASTRO_BASE en
// .github/workflows/deploy.yml y astro.config.mjs.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefija una ruta interna absoluta con la base del despliegue. */
export const url = (path: string): string => `${BASE}${path}`;
