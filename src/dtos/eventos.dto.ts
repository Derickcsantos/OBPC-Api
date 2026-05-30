import { z } from 'zod';

const eventoBaseSchema = z.object({
  nome_evento: z.string().min(1),
  descricao_evento: z.string().min(1),
  data_evento: z.string().min(1),
  link_evento: z.string().url(),
  url_capa: z.string().url().nullable().optional(),
  numero_vagas: z.coerce.number().int().positive().nullable().optional(),
  endereco_evento: z.string().min(1).nullable().optional(),
  hora_inicio: z.string().min(1).nullable().optional(),
  observacao_evento: z.string().nullable().optional(),
  responsavel_nome: z.string().min(1).nullable().optional(),
  responsavel_telefone: z.string().min(8).max(20).nullable().optional(),
});

export const createEventoSchema = eventoBaseSchema;
export const updateEventoSchema = eventoBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
