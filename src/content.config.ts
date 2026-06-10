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

export const collections = { blog, servicios, sectores };
