import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const verseSchema = z.object({
  version: z.string().trim().min(1).max(20).transform((v) => v.toLowerCase()),
  book: z.number().int().positive(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
});

export const annotationSchema = z.object({
  titulo: z.string().trim().max(200).nullable().optional(),
  conteudo: z.string().trim().min(1).max(20000),
  versiculos: z.array(verseSchema).min(1).max(200),
});

export const highlightSchema = verseSchema.extend({
  estilo: z.enum(['background', 'underline']),
  cor: z.enum(['yellow', 'green', 'blue', 'pink', 'purple']),
});

export const highlightQuerySchema = paginationSchema.extend({
  version: z.string().trim().min(1).max(20).optional(),
  book: z.coerce.number().int().positive().optional(),
  chapter: z.coerce.number().int().positive().optional(),
});

export const roleSchema = z.object({ role: z.enum(['user', 'admin']) });
