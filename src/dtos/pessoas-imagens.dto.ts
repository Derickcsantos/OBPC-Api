import { z } from 'zod';

const pessoaImagemBaseSchema = z.object({
  pessoa_id: z.string().uuid(),
  url_imagem: z.string().url(),
  ordem: z.coerce.number().int().nonnegative().optional(),
});

export const createPessoaImagemSchema = pessoaImagemBaseSchema;
export const updatePessoaImagemSchema = pessoaImagemBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualizacao.',
});
