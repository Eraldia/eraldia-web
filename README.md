# Eraldia — web

Web de **Eraldia**, consultoría de transformación digital e IA para pymes. *Pon tu pyme al día con la IA.*

Construida con [Astro](https://astro.build/), generador de sitios estáticos.

## Documentación

- [`docs/MODELO-DE-NEGOCIO.md`](docs/MODELO-DE-NEGOCIO.md) — posicionamiento, servicios, precios, embudo de captación y plan de 90 días.
- [`docs/PUBLICACION.md`](docs/PUBLICACION.md) — cómo comprar el dominio, desplegar en Cloudflare Pages, activar el correo y el formulario de leads.

## Desarrollo en local

```bash
npm install       # instalar dependencias
npm run dev       # servidor local con recarga en vivo (http://localhost:4321)
npm run build     # build de producción en ./dist
npm run preview   # previsualizar el build local
```

## Estructura

- `src/content/blog/` — artículos del blog en Markdown (front matter YAML)
- `src/content/servicios/` — páginas de servicios en Markdown (front matter YAML)
- `src/pages/` — páginas Astro (index, servicios, casos, sobre-mi, blog, tags, categorias, 404)
- `src/layouts/BaseLayout.astro` — layout base con head SEO, header, footer y script reveal
- `src/styles/` — estilos SCSS (la identidad visual vive en `src/styles/_variables.scss`)
- `public/` — recursos estáticos (imágenes: logo, favicon, og-image, hero, services, use-cases)
- `src/consts.ts` — constantes globales (título, tagline, email de contacto, Formspree ID, LinkedIn)
- `.github/workflows/` — CI/CD con Node 20 y Astro

## Configuración pendiente (TODOs)

En `src/consts.ts`:
- `FORMSPREE_ID` — ID del formulario de Formspree para activar la captación de leads.
- `CONTACT_EMAIL` — cambiar a `hola@eraldia.com` cuando el correo del dominio esté activo.
- `LINKEDIN_URL` — URL del perfil de LinkedIn para el footer.

## Despliegue

Mientras no haya dominio propio: GitHub Actions despliega a GitHub Pages en cada push a `main`, en **https://sailwave-ai.github.io/eraldia-web/** (subcarpeta, porque el repo se llama `eraldia-web`). El workflow define `ASTRO_SITE` y `ASTRO_BASE` para que enlaces y assets funcionen en esa subcarpeta; en local y en producción la base es `/`.

El plan de producción es Cloudflare Pages con el dominio `eraldia.com` — pasos en [`docs/PUBLICACION.md`](docs/PUBLICACION.md).
