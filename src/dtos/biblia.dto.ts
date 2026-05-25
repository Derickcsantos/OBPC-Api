import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();
const bibleVersion = z.string().min(1).default('nvi');
const page = z.coerce.number().int().positive().default(1);
const limit = z.coerce.number().int().positive().max(100).default(100);

export const biblePaginationQuerySchema = z.object({
  page,
  limit,
});

export const bibleBookParamSchema = z.object({
  book_id: positiveInt,
});

export const bibleBooksQuerySchema = z.object({
  version_id: positiveInt.optional(),
  testament_id: positiveInt.optional(),
  testament: positiveInt.optional(),
});

export const bibleChaptersQuerySchema = z.object({
  version_id: positiveInt.optional(),
  book_id: positiveInt.optional(),
  page,
  limit,
});

const bibleVerseFiltersSchema = z.object({
  version: bibleVersion,
  version_id: positiveInt.optional(),
  book_id: positiveInt.optional(),
  chapter_id: positiveInt.optional(),
  verse: positiveInt.optional(),
  verse_start: positiveInt.optional(),
  verse_end: positiveInt.optional(),
  keyword: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  page,
  limit,
});

export const bibleBookVersesQuerySchema = z
  .object({
    version: bibleVersion,
    chapter_id: positiveInt.optional(),
    verse: positiveInt.optional(),
    verse_start: positiveInt.optional(),
    verse_end: positiveInt.optional(),
    keyword: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    page,
    limit,
  })
  .refine((obj) => !(obj.verse && (obj.verse_start || obj.verse_end)), {
    message: 'Use verse ou verse_start/verse_end, nao ambos.',
  })
  .refine((obj) => (obj.verse_start ? Boolean(obj.verse_end) : true), {
    message: 'verse_end e obrigatorio quando verse_start for informado.',
  });

export const bibleVersesQuerySchema = bibleVerseFiltersSchema
  .refine((obj) => !(obj.verse && (obj.verse_start || obj.verse_end)), {
    message: 'Use verse ou verse_start/verse_end, nao ambos.',
  })
  .refine((obj) => (obj.verse_start ? Boolean(obj.verse_end) : true), {
    message: 'verse_end e obrigatorio quando verse_start for informado.',
  });

export const bibleSearchQuerySchema = z
  .object({
    version: bibleVersion,
    version_id: positiveInt.optional(),
    keyword: z.string().min(1),
    book_id: positiveInt.optional(),
    chapter_id: positiveInt.optional(),
    verse_start: positiveInt.optional(),
    verse_end: positiveInt.optional(),
    page,
    limit,
  })
  .refine((obj) => (obj.verse_start ? Boolean(obj.verse_end) : true), {
    message: 'verse_end e obrigatorio quando verse_start for informado.',
  });
