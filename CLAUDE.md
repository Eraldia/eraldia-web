# CLAUDE.md

Guía para Claude al trabajar en este repositorio. Última revisión: julio 2026.

## Qué es este proyecto

Web de **Eraldia** (eraldia.com), consultoría de **estrategia de IA para
empresas españolas**, operada por una sola persona (Gorka Alapont, autónomo, con
base en Bilbao). Sitio estático construido con **Astro**. La web es la pieza
central del embudo de captación de clientes: todo cambio debe servir a ese
objetivo.

- **Tagline:** *El sistema operativo de IA de tu empresa.*
- **Nombre:** de *eraldatu* ("transformar" en euskera) + IA; se lee "era / al día".
- **Posicionamiento:** el anti-humo. Estrategia con los pies en el suelo,
  alcance cerrado por escrito, resultados medibles, lenguaje llano. La persona
  que vende es la que ejecuta.

## Modelo de negocio (resumen)

Detalle completo en [`docs/MODELO-DE-NEGOCIO.md`](docs/MODELO-DE-NEGOCIO.md)
(pivote estratégico de julio 2026 descrito en su §0).

- **Cliente objetivo principal (desde julio 2026):** mediana empresa española
  de **50–500 empleados** con presión por adoptar IA pero sin estrategia ni
  gobierno (pilotos sueltos, *shadow AI*, herramientas dispersas). España
  primero.
- **Concepto bandera:** el **sistema operativo de IA (AI OS)** — el conjunto de
  estrategia y gobierno, datos y conocimiento, procesos y automatización, y
  personas y adopción que hace que la IA funcione en toda la empresa. Toda la
  web cuelga de esta idea.
- **Escalera de servicios principal (sin precios públicos; propuesta cerrada
  por escrito, nunca por horas):**
  1. Conversación estratégica — gratis, 30 min (cualifica).
  2. Diagnóstico de madurez en IA (`/servicios/diagnostico-madurez-ia/`).
  3. Diseño del sistema operativo de IA (`/servicios/sistema-operativo-ia/`) —
     el servicio central.
  4. Acompañamiento estratégico (`/servicios/acompanamiento-estrategico/`) —
     dirección de IA externa, mensual, sin permanencia (la meta: recurrente).
- **Línea secundaria (pymes y despachos):** la oferta original sigue viva en
  `/para-pymes/` — landings de asesorías/abogados/climatización, casos de
  `/casos/`, y la escalera de automatización con precios 2026 (diagnóstico
  desde 490 €, proyectos 1.900–4.500 €, acompañamiento 390–900 €/mes).
- **Principios:** herramientas a nombre del cliente; alcance firmado por
  escrito; fases con final definido (nada de transformaciones eternas); sin
  SaaS hasta tener ~10 clientes de servicios.
- **Embudo:** LinkedIn + boca a boca + blog SEO → web (formulario "¿Dónde está
  tu empresa?") → conversación gratuita → diagnóstico → diseño del AI OS →
  acompañamiento. Respuesta a todo lead en <24 h laborables (la web lo promete).
- Al crear contenido nuevo, **prioriza el ángulo estratégico para medianas
  empresas** (madurez, gobierno, adopción, AI OS); el contenido pyme sigue
  siendo válido como capa secundaria.

## Estrategia web (SEO + GEO)

Detalle en [`docs/PLAN-DE-CONTENIDOS.md`](docs/PLAN-DE-CONTENIDOS.md). Tres capas:

1. **SEO local** — foco geográfico en **Bilbao / País Vasco y Andalucía**
   (Sevilla, Málaga): landings locales permanentes, Google Business Profile,
   schema `LocalBusiness`/`ProfessionalService` con `areaServed`.
2. **Autoridad temática** — ser la web que mejor responde a "IA para pymes" en
   español: clusters por sector, por problema, y de dinero/decisión (precios,
   plazos, ayudas), con interlinking y profundidad real.
3. **GEO** (motores generativos: ChatGPT, Perplexity, Gemini, AI Overviews) —
   ser la fuente citada: respuesta directa al inicio de cada post, cifras con
   fecha, FAQs con schema `FAQPage`, autor visible y consistente, `llms.txt`,
   robots.txt abierto a crawlers de IA.

**Principio rector:** poca competencia local → no hace falta volumen masivo,
sino pocas piezas muy buenas, muy concretas y muy locales, con constancia.

### Pipeline de contenidos

Detalle en [`docs/PIPELINE-CONTENIDOS.md`](docs/PIPELINE-CONTENIDOS.md).

- Cadencia: **1 post cada 3 días**, publicado automáticamente por
  `.github/workflows/publish-content.yml` + `tools/publish-next.mjs` (sin IA en
  producción).
- La cola vive en `content-queue/posts/` (`NN-slug.md` + `NN-slug.linkedin.md`);
  el prefijo numérico marca el orden y el script pone la fecha al publicar.
- La generación se hace por lotes en sesiones de Claude; cuando queden ≤2
  piezas, un issue `rellenar-cola` lo avisa.
- Cada post sigue la **plantilla GEO** (§6 del plan): respuesta directa en las
  2–3 primeras frases, cifras con año, FAQs al final, listas/tablas, autor con
  enlace a `/sobre-mi`, una frase citable, y al menos un enlace a una landing
  local y a un servicio.

## Reglas de contenido (obligatorias)

- **Nunca inventar clientes ni casos.** Si no hay caso real publicable, no se
  escribe la pieza de caso (anonimizado o piloto propio, indicándolo).
- **No prometer porcentajes de ahorro** sin casos reales detrás.
- **Sin estereotipos regionales** (gastronomía, folclore): la localización se
  hace con sectores, ayudas y cercanía real.
- **Euskera: solo unas palabras** donde aporte (un saludo, la etimología de
  *eraldia*), nunca párrafos.
- **Cifras y precios siempre con año** ("precios de 2026"). Las piezas de
  precios y ayudas se actualizan cada 6 meses (`dateModified`).
- **Ayudas/subvenciones:** verificar la convocatoria vigente antes de redactar,
  o citarlas de forma genérica con enlace a la fuente.
- Todo el contenido público va en castellano, en el tono de la marca: llano,
  concreto, sin humo.

## Reglas de ingeniería

- **Cambios quirúrgicos.** El diff debe ser tan pequeño como permita la tarea:
  no tocar código fuera de lo pedido, no reformatear de paso, mantener el
  estilo existente.
- **Simplicidad ante todo.** Escribir el mínimo código que resuelve el
  problema actual, no el que cubriría hipotéticos casos futuros. Sin
  abstracciones, manejo de errores ni configuración que no tengan una
  necesidad real ya presente.
- **Verificar, no asumir.** Al arreglar un bug, reproducirlo primero y
  comprobar que el cambio lo soluciona (test, build, o prueba manual en
  `npm run dev`/`npm run build`) antes de darlo por cerrado.
- **Depurar la causa, no el síntoma.** Ante un fallo, leer el error completo
  y entender por qué ocurre antes de cambiar nada; no envolver el problema en
  comprobaciones que lo oculten.

## Identidad visual «Tierra Nocturna»

Terracota `#B95536` + ámbar `#D69A2C` + salvia `#8FA277` sobre tierra (negro
cálido `#15120E` en secciones oscuras, crema `#F8F2E5` en claras). Tipografías:
Fraunces itálica (títulos) + Inter (texto) + JetBrains Mono (código). Los tokens
viven en `src/styles/_variables.scss`.

## Desarrollo

```bash
npm install       # instalar dependencias
npm run dev       # servidor local (http://localhost:4321)
npm run build     # build de producción en ./dist
npm run preview   # previsualizar el build
```

### Estructura

- `src/pages/` — páginas Astro (index, servicios, casos, sobre-mi, blog, tags,
  categorias, 404, atom.xml)
- `src/content/` — colecciones Markdown: `blog/`, `servicios/`, `sectores/`
- `src/layouts/BaseLayout.astro` — head SEO, header, footer
- `src/consts.ts` — constantes globales (título, tagline, email, Formspree ID,
  LinkedIn)
- `src/styles/` — SCSS (identidad visual en `_variables.scss`)
- `content-queue/posts/` — cola editorial pendiente de publicar
- `tools/publish-next.mjs` — script de publicación (Node sin dependencias)
- `docs/` — modelo de negocio, plan y pipeline de contenidos, guía de publicación

### Despliegue

Provisional: GitHub Pages en cada push a `main` (subcarpeta `/eraldia-web/`,
con `ASTRO_SITE`/`ASTRO_BASE` en el workflow). Plan de producción: Cloudflare
Pages con `eraldia.com` — pasos en [`docs/PUBLICACION.md`](docs/PUBLICACION.md).

### TODOs de configuración (en `src/consts.ts`)

- `FORMSPREE_ID` — vacío; el formulario de leads no está activo aún.
- `CONTACT_EMAIL` — cambiar a `hola@eraldia.com` cuando el correo del dominio
  esté activo.
- `LINKEDIN_URL` — vacío; necesario para el footer y para el NAP consistente.
