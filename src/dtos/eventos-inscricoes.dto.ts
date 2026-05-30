import { z } from 'zod';

const eventoInscricaoBaseSchema = z.object({
  evento_id: z.string().uuid(),
  nome: z.string().min(1),
  email: z.string().email(),
  telefone: z.string().min(8).max(20),
  status: z.enum(['inscrito', 'cancelado']).optional().default('inscrito'),
});

export const createEventoInscricaoSchema = eventoInscricaoBaseSchema;
export const updateEventoInscricaoSchema = eventoInscricaoBaseSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Informe ao menos um campo para atualizacao.',
});

export const createEventoInscricaoPublicSchema = eventoInscricaoBaseSchema.omit({ evento_id: true, status: true });
