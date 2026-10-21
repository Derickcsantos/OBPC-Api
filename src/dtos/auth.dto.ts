import { z } from 'zod';

export const googleLoginSchema = z.object({
  id_token: z.string().min(1, 'O id_token do Google e obrigatorio.'),
});
export const appleLoginSchema = z.object({
  id_token: z.string().min(1, 'O id_token da Apple e obrigatorio.'),
  nonce: z.string().min(1, 'O nonce da Apple e obrigatorio.'),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
