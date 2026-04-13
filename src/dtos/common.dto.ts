import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido. Deve ser um UUID válido.'),
});
