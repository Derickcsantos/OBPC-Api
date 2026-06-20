import { z } from 'zod';

const fotoMinisterioBaseSchema = z.object({
  ministerio_id: z.string().uuid(),
  url_imagem: z.string().url(),
  ordem: z.coerce.number().int().nonnegative().optional(),
});

export const createFotoMinisterioSchema = fotoMinisterioBaseSchema;
export const updateFotoMinisterioSchema = fotoMinisterioBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualizacao.',
});
