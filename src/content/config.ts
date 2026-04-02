import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    status: z.string(),
    year: z.string(),
    featured: z.boolean().default(false),
    externalUrl: z.string().optional(),
    repoUrl: z.string().optional(),
    order: z.number().default(99)
  })
});

const lab = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    motivation: z.string(),
    concept: z.string(),
    route: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(99)
  })
});

export const collections = {
  projects,
  lab
};
