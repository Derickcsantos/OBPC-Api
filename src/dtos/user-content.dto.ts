import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const prayerDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data no formato YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00-03:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Informe uma data válida.');

export const publicPrayerQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(160).optional(),
  data: prayerDateSchema.optional(),
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

export const adminUpdateUserSchema = z.object({
  nome_usuario: z.string().trim().min(1).max(150).optional(),
  email_usuario: z.string().trim().email().max(255).optional(),
  telefone_usuario: z.string().trim().min(8).max(20).nullable().optional(),
  data_nascimento: z.string().date().nullable().optional(),
  role: z.enum(['user', 'admin']).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Informe ao menos um campo.' });
