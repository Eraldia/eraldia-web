# Publicar eraldia.com — guía paso a paso

La web es un sitio estático (Astro), así que el hosting es gratis o casi. Recomendación: **Cloudflare Pages** (gratis, CDN global, SSL automático y el dominio en el mismo sitio). Hostinger funciona, pero pagarías por algo que aquí es gratis.

> **Estado actual (provisional):** la web se sirve en GitHub Pages en
> `https://sailwave-ai.github.io/eraldia-web/` (subcarpeta, porque el repo se
> renombró a `eraldia-web`). El workflow compila con las variables de entorno
> `ASTRO_SITE` y `ASTRO_BASE` para que los enlaces y el CSS funcionen en esa
> subcarpeta. Todo esto desaparece al pasar a Cloudflare Pages con dominio propio.

## Paso 0 — Comprar el dominio

1. Verifica disponibilidad de `eraldia.com` y `eraldia.es` en [Cloudflare Registrar](https://domains.cloudflare.com) (vende a precio de coste) o Namecheap.
2. Compra al menos el `.com`; el `.es` es barato y evita que te lo quite un tercero.
3. Si lo compras fuera de Cloudflare, apunta los nameservers a Cloudflare (plan Free) para usar Pages y Email Routing.

## Paso 1 — Desplegar en Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Autoriza GitHub y elige el repositorio `Sailwave-AI/eraldia-web`.
3. Configuración de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Tendrás el sitio en `https://<proyecto>.pages.dev` en un minuto.
5. **Custom domain:** en el proyecto de Pages → Custom domains → añade `eraldia.com` (y `www.eraldia.com`). Cloudflare crea los DNS y el SSL solo.
6. Cuando el dominio funcione, edita `.github/workflows/deploy.yml` y elimina el bloque `env` (`ASTRO_SITE`/`ASTRO_BASE`) del paso de build — o borra el workflow entero si dejas de usar GitHub Pages, que es lo razonable una vez estés en Cloudflare.

## Paso 2 — Correo profesional (gratis)

Cloudflare → tu dominio → **Email → Email Routing**:
1. Crea la dirección `hola@eraldia.com` → reenvía a `alapontgorka@gmail.com`.
2. Para **enviar** como `hola@eraldia.com` desde Gmail: Ajustes de Gmail → Cuentas → "Enviar como" (usa los datos SMTP de Gmail con tu cuenta).
3. Actualiza `CONTACT_EMAIL` en `src/consts.ts`.

## Paso 3 — Formulario de leads (Formspree)

1. Cuenta gratis en [formspree.io](https://formspree.io) (50 envíos/mes de sobra para empezar).
2. Crea un formulario apuntando a tu correo y copia su ID (p. ej. `xqkrgyzb`).
3. Pégalo en `src/consts.ts` → `export const FORMSPREE_ID = "xqkrgyzb"`.
4. Haz commit: el formulario de la portada se activa solo (mientras esté vacío, la web muestra un botón de correo como alternativa).
5. En Formspree, activa la notificación por email y prueba un envío real.

## Paso 4 — Analítica (sin cookies, sin banner)

Cloudflare → **Web Analytics** (gratis, sin cookies, no requiere banner RGPD): crea el sitio, copia el snippet JS y pégalo en `src/layouts/BaseLayout.astro` antes de `</head>`. Alternativa de pago: Plausible (9 €/mes).

## Paso 5 — Checklist legal mínimo (España)

Antes de captar leads en serio:
- [ ] Página de **aviso legal** (datos de autónomo: nombre, NIF, dirección).
- [ ] Página de **política de privacidad** (qué haces con los datos del formulario: responder, base legal, derechos ARCO).
- [ ] El formulario ya avisa del uso de los datos; enlázalo a la política cuando exista.

## Alternativa: Hostinger

Si prefieres Hostinger (ya pagando hosting): compila en local con `npm run build` y sube la carpeta `dist/` por el File Manager o FTP a `public_html/`. Desventajas: no hay deploy automático desde GitHub y pagas por algo gratuito en Cloudflare. Solo tiene sentido si ya usas Hostinger para otra cosa.

## Desarrollo en local

```bash
npm install       # instalar dependencias
npm run dev       # servidor local con recarga en vivo (http://localhost:4321)
npm run build     # genera ./dist
npm run preview   # previsualizar el build local
```
