import { z } from 'zod';

const ministerioBaseSchema = z.object({
  nome_ministerio: z.string().min(1),
  descricao_ministerio: z.string().min(1),
  url_ministerio: z.string().url(),
});

export const createMinisterioSchema = ministerioBaseSchema;
export const updateMinisterioSchema = ministerioBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
