import { z } from 'zod';

const eventoImagemBaseSchema = z.object({
  evento_id: z.string().uuid(),
  url_imagem: z.string().url(),
  ordem: z.coerce.number().int().nonnegative().optional(),
});

export const createEventoImagemSchema = eventoImagemBaseSchema;
export const updateEventoImagemSchema = eventoImagemBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualizacao.',
});
