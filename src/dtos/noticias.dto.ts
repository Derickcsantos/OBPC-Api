import { z } from 'zod';

const noticiaBaseSchema = z.object({
  nome_noticia: z.string().min(1),
  mensagem_noticia: z.string().min(1),
  data_noticia: z.string().min(1),
  url_capa: z.string().url().nullable().optional(),
  observacao_noticia: z.string().nullable().optional(),
});

export const createNoticiaSchema = noticiaBaseSchema;
export const updateNoticiaSchema = noticiaBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
