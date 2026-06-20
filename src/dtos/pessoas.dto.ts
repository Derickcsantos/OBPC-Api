import { z } from 'zod';
import { uploadImageSchema } from './upload.dto.js';

const optionalText = z.string().trim().min(1).optional().or(z.literal(''));

const pessoaBaseSchema = z.object({
  url_imagem: z.string().url().optional(),
  nome: z.string().trim().min(1).max(150),
  cargo: z.string().trim().min(1).max(150),
  sobre: z.string().trim().min(1),
  telefone: optionalText,
  email: z.string().trim().email().optional().or(z.literal('')),
});

export const createPessoaSchema = pessoaBaseSchema;
export const createPessoaComImagemSchema = pessoaBaseSchema.omit({ url_imagem: true }).extend({
  imagem: uploadImageSchema,
});
export const updatePessoaSchema = pessoaBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualizacao.',
});
