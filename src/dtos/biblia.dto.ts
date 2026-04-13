import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

export const bibleBooksQuerySchema = z.object({
  version_id: positiveInt,
});

export const bibleChaptersQuerySchema = z.object({
  version_id: positiveInt,
  book_id: positiveInt,
});

export const bibleVersesQuerySchema = z
  .object({
    version_id: positiveInt,
    book_id: positiveInt,
    chapter_id: positiveInt,
    verse: positiveInt.optional(),
    verse_start: positiveInt.optional(),
    verse_end: positiveInt.optional(),
  })
  .refine((obj) => !(obj.verse && (obj.verse_start || obj.verse_end)), {
    message: 'Use verse ou verse_start/verse_end, não ambos.',
  })
  .refine((obj) => (obj.verse_start ? Boolean(obj.verse_end) : true), {
    message: 'verse_end é obrigatório quando verse_start for informado.',
  });

export const bibleSearchQuerySchema = z
  .object({
    version_id: positiveInt,
    keyword: z.string().min(1),
    book_id: positiveInt.optional(),
    chapter_id: positiveInt.optional(),
    verse_start: positiveInt.optional(),
    verse_end: positiveInt.optional(),
  })
  .refine((obj) => (obj.verse_start ? Boolean(obj.verse_end) : true), {
    message: 'verse_end é obrigatório quando verse_start for informado.',
  });
