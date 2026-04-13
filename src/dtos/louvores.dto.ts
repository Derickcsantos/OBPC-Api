import { z } from 'zod';

const louvorBaseSchema = z.object({
  nome_louvor: z.string().min(1),
  url_louvor: z.string().url(),
  observacao_louvor: z.string().nullable().optional(),
});

export const createLouvorSchema = louvorBaseSchema;
export const updateLouvorSchema = louvorBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
