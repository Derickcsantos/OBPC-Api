import { z } from 'zod';

const eventoBaseSchema = z.object({
  nome_evento: z.string().min(1),
  descricao_evento: z.string().min(1),
  data_evento: z.string().min(1),
  link_evento: z.string().url(),
});

export const createEventoSchema = eventoBaseSchema;
export const updateEventoSchema = eventoBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
