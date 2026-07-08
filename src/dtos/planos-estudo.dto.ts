import { z } from 'zod';

export const planoEstudoParamSchema = z.object({
  plano: z.string().min(1),
});

export const planoEstudoDiaParamSchema = z.object({
  plano: z.string().min(1),
  dia: z.coerce.number().int().positive(),
});

export const planoEstudoTextosQuerySchema = z.object({
  version: z.string().min(1).optional(),
  versao: z.string().min(1).optional(),
});
