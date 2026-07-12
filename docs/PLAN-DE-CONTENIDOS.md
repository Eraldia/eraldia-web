# Plan de contenidos SEO + GEO — Eraldia

> Objetivo (desde julio 2026): posicionar a Gorka Alapont / Eraldia como **el
> consultor de referencia en estrategia de IA para medianas empresas españolas**,
> siendo la fuente que define la categoría **"sistema operativo de IA" (AI OS)**
> en español, tanto en buscadores clásicos (SEO) como en motores generativos
> —ChatGPT, Perplexity, Gemini, AI Overviews de Google— (GEO). La capa pyme/local
> (Bilbao, País Vasco, Andalucía) se mantiene como segunda línea.

---

## 1. Estrategia en cuatro capas

| Capa | Qué es | Cómo se gana |
|------|--------|--------------|
| **Categoría propia (AI OS)** | Que "sistema operativo de IA" en español lleve a Eraldia; ser la respuesta a "estrategia de IA para empresas", "gobierno de la IA", "madurez en IA" | Cluster de contenido estratégico profundo alrededor de `/servicios/sistema-operativo-ia/`, definiciones citables, marcos propios (las cuatro capas), constancia |
| **SEO local** | Aparecer cuando alguien busca "consultor IA Bilbao", "automatización pymes Sevilla"… | Landing pages locales + Google Business Profile + schema LocalBusiness + menciones en medios/directorios locales |
| **Autoridad temática** | Ser la web que mejor responde a "IA para pymes" en español (línea secundaria) | Clusters de contenido por sector y por problema, interlinking, profundidad real (precios, plazos, ejemplos) |
| **GEO** | Ser la fuente que citan ChatGPT/Perplexity al responder "¿qué es un AI OS?" o "¿cuánto cuesta automatizar X?" | Respuestas directas al inicio de cada post, datos concretos con fecha, FAQs con schema, entidad de autor consistente, `llms.txt`, robots.txt abierto a crawlers de IA |

**Principio rector:** en "estrategia de IA para medianas empresas" en español la
competencia real es escasa (mucho humo corporativo, poca concreción), y en
"sistema operativo de IA" la categoría está por definir: quien la escriba
primero y mejor, la posee. No hace falta volumen masivo: hacen falta **pocas
piezas muy buenas, muy concretas y con marcos propios**, publicadas con
constancia. En la capa local sigue valiendo lo de siempre: piezas muy locales
con poca competencia.

---

## 2. Pilares de contenido (clusters)

1. **Estrategia / AI OS (primario desde julio 2026)** — qué es el sistema
   operativo de IA y sus cuatro capas (estrategia y gobierno, datos y
   conocimiento, procesos y automatización, personas y adopción); madurez en
   IA y cómo medirla; *shadow AI*; por qué fracasan los pilotos; gobierno y
   política de uso; hoja de ruta por trimestres; dirección de IA externa.
   Público: dirección general y comités de dirección de empresas de 50–500
   empleados. Todo enlaza a `/servicios/sistema-operativo-ia/` y al
   [diagnóstico de madurez](/servicios/diagnostico-madurez-ia/).
2. **Local / geográfico** — Bilbao, Bizkaia, Euskadi, Sevilla, Málaga, Andalucía.
   Convierte por intención ("busco a alguien cerca"). Línea pyme.
3. **Sectorial (línea pyme)** — asesorías/gestorías y despachos de abogados
   (landings profundas en `/ia-para-asesorias/` y `/ia-para-abogados/`).
   Clínicas, hostelería y gimnasios secundarios.
4. **Problema → solución** — "respondo igual 30 veces al día", "cada
   departamento usa ChatGPT por su cuenta", "tenemos pilotos que no despegan".
   Es como busca el cliente real, en ambas líneas.
5. **Dinero y decisión** — precios y plazos (línea pyme), ayudas y subvenciones,
   cómo elegir consultor, cuándo contratar un director de IA. **El cluster más
   citado por los motores generativos**: los LLMs adoran contenido con cifras y
   rangos claros. Ojo: la línea estratégica no publica precios; sus piezas de
   decisión hablan de criterios, no de tarifas.
6. **Confianza / entidad** — quién es Gorka, casos reales, metodología. Alimenta
   el knowledge graph y la verificabilidad que exigen los motores de IA.

---

## 3. Páginas locales (no blog: páginas permanentes)

Crear una sección de páginas evergreen, enlazadas desde el footer y desde cada
post con ángulo local. No son "doorway pages": cada una debe tener contenido
genuinamente local (sectores típicos de la zona, ayudas regionales, forma de
trabajar en remoto/presencial).

| Página | Slug propuesto | Keyword principal |
|--------|----------------|-------------------|
| Consultor IA en Bilbao | `/consultor-ia-bilbao/` | consultor inteligencia artificial Bilbao |
| IA para pymes en el País Vasco | `/ia-pymes-pais-vasco/` | consultoría IA País Vasco / Euskadi |
| IA para pymes en Andalucía | `/ia-pymes-andalucia/` | consultor IA Andalucía |
| Consultor IA en Sevilla | `/consultor-ia-sevilla/` | automatización IA pymes Sevilla |
| Consultor IA en Málaga | `/consultor-ia-malaga/` | consultor IA Málaga |

Contenido mínimo de cada landing:
- Respuesta directa en el primer párrafo ("Eraldia es la consultora de IA para
  pymes con base en Bilbao que…").
- Sectores fuertes de la zona (Bilbao: asesorías, clínicas, comercio; Andalucía:
  hostelería, turismo, clínicas).
- Ayudas regionales aplicables (ver §5).
- 4–6 FAQs con schema `FAQPage` ("¿Trabajas en remoto?", "¿Cuánto cuesta?",
  "¿Atiendes en euskera?" en las vascas).
- CTA al diagnóstico (490 €).
- Schema `ProfessionalService` con `areaServed`.

**Toque diferencial vasco (sutil):** unas pocas palabras en euskera en las
landings de Bilbao/Euskadi — un saludo breve y la mención de que la marca viene
de *eraldatu* ("transformar"). Nada más: cercanía sin caer en tópicos.

---

## 4. Cola editorial — 1 post cada 3 días

La cadencia es **un post cada 3 días**, publicado automáticamente por el
pipeline descrito en `docs/PIPELINE-CONTENIDOS.md`: el contenido se redacta por
lotes (en una sesión de trabajo con Claude, sin coste de API) y queda en una
cola (`content-queue/`); un workflow programado publica la siguiente pieza en la
web y en LinkedIn cuando toca. Cada post sigue la plantilla GEO del §6.

Los bloques siguientes definen el **orden de publicación** (cada bloque ≈ 6
días de cadencia, no un mes):

### Bloque 1 — Cimientos locales + dinero
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 1 | Cuánto cuesta automatizar con IA en una pyme: precios reales 2026 | `cuanto-cuesta-automatizacion-ia-pyme` | Dinero | cuánto cuesta automatización IA pyme |
| 2 | Consultor de IA para tu pyme: qué hace, cuándo contratarlo y qué debe entregarte | `que-hace-consultor-ia-pyme` | Dinero/Confianza | qué hace un consultor de IA |
| — | Landings: Bilbao + País Vasco | | Local | |

### Bloque 2 — Ayudas (imán de tráfico local) + sector asesorías
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 3 | Ayudas para digitalizar tu pyme vasca con IA: Kit Digital, SPRI y programas de Bizkaia | `ayudas-ia-pymes-pais-vasco` | Local/Dinero | ayudas digitalización pymes País Vasco |
| 4 | IA en asesorías y gestorías: 4 automatizaciones que liberan horas en cada cierre | `ia-asesorias-gestorias` | Sectorial | IA para asesorías |
| — | Landings: Andalucía + Sevilla + Málaga | | Local | |

### Bloque 3 — Andalucía + sector clínicas
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 5 | IA para pymes andaluzas: por dónde empezar (y qué ayudas existen en 2026) | `ia-pymes-andaluzas-por-donde-empezar` | Local | IA pymes Andalucía |
| 6 | IA en clínicas dentales y de fisioterapia: recordatorios, citas y resúmenes sin contratar a nadie | `ia-clinicas-dentales-fisioterapia` | Sectorial | IA clínica dental |

### Bloque 4 — Hostelería (puente Bilbao↔Andalucía) + decisión
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 7 | IA en hostelería y restauración: 5 automatizaciones que funcionan igual en Bilbao y en Málaga | `ia-hosteleria-restaurantes` | Sectorial/Local | IA restaurantes hostelería |
| 8 | Cómo elegir consultor de IA (y 7 señales de humo de vendedor) | `como-elegir-consultor-ia` | Dinero/Confianza | elegir consultor IA |

### Bloque 5 — Diferenciación vasca + problema→solución
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 9 | ¿Funciona la IA en euskera? Estado real de los modelos en 2026 y qué significa para tu negocio | `ia-en-euskera-estado-2026` | Local/Confianza | IA euskera |
| 10 | "Respondo lo mismo 30 veces al día": cómo montar un asistente de respuestas en 2 semanas | `asistente-respuestas-frecuentes-pyme` | Problema | automatizar respuestas clientes |

### Bloque 6 — Casos + pieza GEO fuerte
| # | Título | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| 11 | Caso real: cómo una asesoría de Bizkaia recuperó 10 h/semana con tres automatizaciones | `caso-asesoria-bizkaia-automatizacion` | Confianza/Local | caso automatización asesoría |
| 12 | IA para pymes en 2027: qué adoptar, qué ignorar y qué precios esperar | `ia-pymes-2027-guia` | Dinero | IA pymes 2027 |

> **Nota sobre el post 11:** si aún no hay un caso de cliente publicable, usar un
> caso anonimizado o un proyecto piloto propio, indicándolo honestamente. Nunca
> inventar un cliente: la credibilidad es el activo central de la marca.

### Bloques 7–10 — Cluster estratégico / AI OS (desde julio 2026)

Primer lote del pilar estratégico, **intercalado en la cola con las piezas pyme
pendientes** (una estratégica, una pyme) para que el pivote sea visible desde
el primer día sin desperdiciar lo ya redactado:

| # | Título (orientativo) | Slug | Cluster | Keyword objetivo |
|---|--------|------|---------|------------------|
| E1 | Qué es un sistema operativo de IA y por qué tu empresa necesita uno | `que-es-sistema-operativo-ia` | Estrategia | sistema operativo de IA / AI OS |
| E2 | Cómo definir la estrategia de IA de una mediana empresa | `estrategia-ia-mediana-empresa` | Estrategia | estrategia de IA empresa |
| E3 | Shadow AI: tus empleados ya usan IA por su cuenta | `shadow-ai-empresa` | Estrategia/Problema | shadow AI empresa |
| E4 | Madurez en IA: cómo saber dónde está tu empresa | `madurez-ia-empresa` | Estrategia | madurez IA empresa |
| E5 | Por qué fracasan los pilotos de IA (y cómo evitarlo) | `por-que-fracasan-pilotos-ia` | Estrategia/Problema | pilotos de IA fracasan |
| E6 | Gobierno de la IA: la política de uso que tu empresa necesita | `gobierno-ia-politica-uso-empresa` | Estrategia | política de uso de IA empresa |
| E7 | La hoja de ruta de IA que dirección puede aprobar | `hoja-de-ruta-ia-empresa` | Estrategia/Decisión | hoja de ruta IA empresa |
| E8 | ¿Necesita tu empresa un director de IA? | `director-ia-externo` | Estrategia/Decisión | director de IA / CAIO |

### Reglas de la cola
- **Desde julio 2026 la cola intercala** piezas estratégicas (cluster 1) y
  piezas pyme/locales, empezando por una estratégica. Los lotes nuevos deben
  mantener una proporción de al menos 1:1 a favor del cluster estratégico.
- Piezas estratégicas: enlazan **al menos a un servicio de la escalera
  estratégica** (`/servicios/sistema-operativo-ia/`,
  `/servicios/diagnostico-madurez-ia/`, `/servicios/acompanamiento-estrategico/`)
  y, cuando encaje, entre sí (interlinking del cluster). **Sin precios**: la
  línea estratégica no publica tarifas; los CTA llevan a la conversación
  gratuita (`/#contacto`).
- Piezas pyme/locales: llevan **al menos un enlace a una landing local** y a un
  servicio de la línea pyme, como hasta ahora.
- Posts geográficos alternan Euskadi ↔ Andalucía para que ambos mercados crezcan
  en paralelo.
- Las piezas de precios (1, 12) y ayudas (3, 5) se **actualizan cada 6 meses**
  cambiando `dateModified`: son las que más citan los motores generativos y las
  que más caducan.
- Cuando la cola baje de ~3 piezas, se redacta un nuevo lote en una sesión de
  trabajo (ver `docs/PIPELINE-CONTENIDOS.md` §Rellenar la cola).
- Sin tópicos regionales (gastronomía, folclore): la localización se hace con
  sectores, ayudas y cercanía real, no con clichés.

---

## 5. Ángulos locales: materia prima para los posts

**Verificar convocatorias y cuantías antes de publicar cada pieza** (cambian cada año).

- **España (ambas zonas):** Kit Digital / Kit Consulting (Red.es) — Eraldia puede
  explicar cómo aprovecharlos aunque no sea agente digitalizador; eso ya es
  contenido que nadie hace bien.
- **País Vasco:** programas de SPRI (Grupo SPRI, Gobierno Vasco) para
  digitalización de pymes; BEAZ (Diputación de Bizkaia); Cámara de Comercio de
  Bilbao; asociaciones como CEBEK. Medios para menciones: El Correo, Deia,
  Estrategia Empresarial, Spri.eus.
- **Andalucía:** Andalucía Emprende, agencia TRADE/IDEA, Cámaras de Comercio de
  Sevilla y Málaga, Málaga TechPark como contexto de ecosistema. Medios: Diario
  Sur, Diario de Sevilla, Málaga Hoy.
- **Euskera como diferencial:** existen modelos de lenguaje en euskera (proyecto
  Latxa, HiTZ/EHU); ser de los pocos que escriben sobre "IA + euskera + negocio"
  da una autoridad local que ningún competidor nacional tendrá.

---

## 6. Plantilla GEO de cada post

Los motores generativos citan contenido que pueden **extraer y atribuir**. Cada
post debe cumplir:

1. **Respuesta directa en las 2–3 primeras frases** (formato "featured snippet"):
   la pregunta del título queda respondida antes del primer H2.
2. **Cifras con fecha**: "entre 1.900 € y 4.500 € (precios de 2026)", "2–4
   semanas". Los rangos concretos son lo más citado; el humo no se cita.
3. **Bloque de FAQs al final** (3–5 preguntas) con schema `FAQPage`.
4. **Listas y tablas** para todo lo enumerable (los LLMs las extraen limpiamente).
5. **Autor visible**: "Por Gorka Alapont, consultor de estrategia de IA" (en
   piezas pyme puede ser "consultor de IA para pymes en Bilbao") + enlace a
   `/sobre-mi`.
6. **Fecha de publicación y de actualización visibles** y en el schema.
7. **Una frase citable** por post, pensada para ser repetida tal cual:
   p. ej. "Una pyme no necesita un plan de transformación digital; necesita tres
   automatizaciones bien elegidas."

---

## 7. Acciones técnicas (una sola vez)

| Acción | Detalle |
|--------|---------|
| **JSON-LD global** | `ProfessionalService` (Eraldia, `areaServed`: Bilbao, País Vasco, Andalucía, España) + `Person` (Gorka Alapont, `jobTitle`, `sameAs` → LinkedIn) en `BaseLayout.astro`. Hoy solo hay microdata parcial. |
| **JSON-LD por tipo** | `Article` en posts, `FAQPage` en landings y posts con FAQs, `Service` en `/servicios/*`. |
| **robots.txt** | Crear en `public/` permitiendo explícitamente `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` (sin acceso de crawlers de IA no hay GEO). |
| **llms.txt** | Crear `public/llms.txt`: qué es Eraldia, servicios con precios, zonas, contacto, enlaces a las mejores piezas. |
| **Google Business Profile** | Alta en Bilbao, categoría "Consultor", servicios y zona de servicio incluyendo Andalucía. Imprescindible para el map pack de "consultor ia bilbao". |
| **NAP consistente** | Mismo nombre/zona/email en web, GBP, LinkedIn y directorios. Completar el `LINKEDIN_URL` vacío en `src/consts.ts` y la bio de `/sobre-mi` con la historia Bilbao/Andalucía. |
| **OG images** | Plantilla de imagen para posts (hoy `og_image` va vacío). |

---

## 8. Distribución (cada post)

1. **LinkedIn (automático)**: cada pieza de la cola incluye su versión nativa
   para LinkedIn (no solo el enlace); el pipeline la publica el mismo día que el
   post. Ver `docs/PIPELINE-CONTENIDOS.md` §LinkedIn.
2. **Reutilización local**: ofrecer las piezas de ayudas/subvenciones a
   newsletters de asociaciones empresariales (CEBEK, Cámaras) como colaboración —
   genera los enlaces y menciones locales que alimentan SEO y GEO a la vez.
3. **Newsletter propia** (cuando haya ~10 posts): mensual, reutilizando contenido.

---

## 9. Medición

| KPI | Herramienta | Objetivo a 6 meses |
|-----|-------------|--------------------|
| Impresiones/clics de keywords estratégicas ("sistema operativo de IA", "estrategia IA empresa", "madurez IA") | Google Search Console | Top 10 nacional en ≥2 de ellas |
| Impresiones/clics de keywords locales ("consultor ia bilbao", "ia pymes andalucía") | Google Search Console | Top 3 en Bilbao; top 10 en Andalucía |
| Citas en motores de IA | Test manual mensual: preguntar a ChatGPT/Perplexity "¿qué es un sistema operativo de IA?" y "consultor de estrategia de IA en España" y variantes | Aparecer mencionado en ≥1 motor |
| Leads desde blog/landings | Formulario con campo "¿cómo nos has conocido?" | 2–3 diagnósticos atribuibles a contenido |
| Posts publicados | Cola + workflow programado | 1 post cada 3 días sin intervención manual |

---

## 10. Orden de ejecución recomendado

1. Acciones técnicas del §7 (1–2 días de trabajo, multiplican todo lo demás).
2. Activar el pipeline de publicación (`docs/PIPELINE-CONTENIDOS.md`): la cola
   inicial ya está redactada en `content-queue/`.
3. Landings de Bilbao y País Vasco.
4. Rellenar la cola por lotes cuando baje de ~3 piezas.
