import { z } from 'zod';

const usuarioBaseSchema = z.object({
  nome_usuario: z.string().min(1),
  telefone_usuario: z.string().min(8).max(20),
  senha_usuario: z.string().min(6),
  email_usuario: z.string().email(),
  data_nascimento: z.string().min(1),
});

export const createUsuarioSchema = usuarioBaseSchema;
export const updateUsuarioSchema = usuarioBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});
