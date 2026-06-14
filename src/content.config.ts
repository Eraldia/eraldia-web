import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    author: z.string().optional(),
    og_image: z.string().optional(),
  }),
});

const servicios = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    weight: z.number().optional().default(99),
    icon: z.string().optional(),
  }),
});

const sectores = defineCollection({
  type: 'content',
  schema: z.object({
    // Título de la ficha y H1 de la landing
    title: z.string(),
    // Etiqueta corta del sector (badge de la tarjeta)
    badge: z.string(),
    // Texto de la tarjeta y entradilla de la landing
    description: z.string(),
    // Meta description para SEO (si se omite, se usa `description`)
    metaDescription: z.string().optional(),
    // Imagen de la tarjeta (opcional: sin ella se muestra un marcador de marca)
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Viñetas de automatizaciones en la tarjeta
    bullets: z.array(z.string()).default([]),
    // KPIs / resultados destacados
    kpis: z.array(z.string()).default([]),
    // Orden (menor = primero). También fija la prioridad estratégica.
    weight: z.number().default(99),
    // Sector prioritario (tier 1): se resalta en la rejilla
    featured: z.boolean().default(false),
    // Preguntas frecuentes (se vuelcan también a schema FAQPage)
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

// Landings locales permanentes (SEO local + GEO): una por ciudad/zona.
// El slug del fichero (p. ej. `bilbao.md`) genera la ruta /consultor-ia-bilbao/.
const lugares = defineCollection({
  type: 'content',
  schema: z.object({
    // H1 de la landing (p. ej. "Consultor de IA para pymes en Bilbao")
    title: z.string(),
    // Ciudad y región, para el schema ProfessionalService/areaServed
    ciudad: z.string(),
    region: z.string(),
    // Meta description para SEO
    metaDescription: z.string(),
    // Respuesta directa (GEO): 2-3 frases al inicio
    intro: z.string(),
    // Orden en listados (menor = primero)
    weight: z.number().default(99),
    // Coordenadas para el schema (opcional)
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
    // Sectores fuertes de la zona
    sectores: z.array(z.object({ title: z.string(), desc: z.string() })).default([]),
    // Ayudas/subvenciones de la zona (citadas de forma genérica; verificar convocatoria)
    ayudas: z.array(z.object({ name: z.string(), desc: z.string() })).default([]),
    // Localidades/comarcas cercanas, para relevancia local
    cercanas: z.array(z.string()).default([]),
    // Frase citable (GEO)
    citable: z.string().optional(),
    // Preguntas frecuentes (se vuelcan a schema FAQPage)
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

export const collections = { blog, servicios, sectores, lugares };
