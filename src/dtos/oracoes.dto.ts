import { z } from 'zod';

const oracaoStatusSchema = z.enum(['em andamento', 'finalizado', 'concluído']);

const oracaoCreateBaseSchema = z.object({
  nome_pedido: z.string().min(1),
  descricao_pedido: z.string().min(1),
  mostrar_grupo: z.boolean().optional().default(true),
  aceita_ligacao: z.boolean().optional().default(true),
  status: oracaoStatusSchema.optional().default('em andamento'),
});

const oracaoUpdateBaseSchema = z.object({
  nome_pedido: z.string().min(1).optional(),
  descricao_pedido: z.string().min(1).optional(),
  mostrar_grupo: z.boolean().optional(),
  aceita_ligacao: z.boolean().optional(),
  status: oracaoStatusSchema.optional(),
});

export const createOracaoSchema = oracaoCreateBaseSchema;
export const updateOracaoSchema = oracaoUpdateBaseSchema.refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
