import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const image = z.object({ src: z.string().optional(), alt: z.string() });

// Bilingual collections: files live in <collection>/sr/<key>.md and <collection>/en/<key>.md.
// The file name (<key>) links translations; `urlSlug` sets the URL in that language (defaults to <key>).
const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    urlSlug: z.string().optional(),
    /** Short label for the /radovi/ filter (defaults to title) */
    shortLabel: z.string().optional(),
    order: z.number(),
    excerpt: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    heroTitle: z.string(),
    heroTitleEm: z.string().optional(),
    intro: z.string(),
    image: z.string().optional(),
    imageLabel: z.string().default('Photo'),
    // "featured" = fashion brand development: dark layout, distinct CTA, not in the services grid
    variant: z.enum(['default', 'featured']).default('default'),
    // "What we make" cards
    itemsEyebrow: z.string().optional(),
    itemsTitle: z.string().optional(),
    items: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    galleryTitle: z.string().optional(),
    gallery: z.array(image.extend({ position: z.string().optional() })).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    name: z.string(),
    text: z.string(),
    rating: z.number().int().min(1).max(5).default(5),
    featured: z.boolean().default(false),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    urlSlug: z.string().optional(),
    description: z.string(),
    updated: z.string(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string().default('Saveti'),
    image: z.string().optional(),
    imageAlt: z.string().default(''),
    author: z.string().default('Slađana'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, testimonials, legal, blog };
