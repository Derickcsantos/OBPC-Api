import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CrudController } from '../controllers/crud.controller.js';
import { createEventoInscricaoPublicSchema } from '../dtos/eventos-inscricoes.dto.js';
import { createEventoSchema, updateEventoSchema } from '../dtos/eventos.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { AppError } from '../utils/app-error.js';
import { parseWithSchema } from '../utils/validation.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { registerCrudRoutes } from './crud-route.factory.js';

const eventoIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const eventosRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'eventos',
    idField: 'evento_id',
    createSchema: createEventoSchema,
    updateSchema: updateEventoSchema,
  });

  registerCrudRoutes(app, '/eventos', controller);

  app.post('/eventos/:id/inscricoes', async (request, reply) => {
    const { id } = parseWithSchema(eventoIdParamSchema, request.params);
    const payload = parseWithSchema(createEventoInscricaoPublicSchema, request.body);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('inscrever_evento', {
      p_evento_id: id,
      p_nome: payload.nome,
      p_email: payload.email,
      p_telefone: payload.telefone,
    });

    if (error) {
      const message = error.message.includes('Evento lotado') ? 'Evento lotado' : 'Erro ao realizar inscricao';
      throw new AppError(error.message.includes('Evento lotado') ? 409 : 500, message, error);
    }

    reply.status(201).send({ data });
  });
};
