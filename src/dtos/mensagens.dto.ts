import { z } from 'zod';

const mensagemBaseSchema = z.object({
  nome_mensagem: z.string().min(1),
  texto_mensagem: z.string().min(1),
});

export const createMensagemSchema = mensagemBaseSchema;
export const updateMensagemSchema = mensagemBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
