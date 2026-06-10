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

export const collections = { blog, servicios };
