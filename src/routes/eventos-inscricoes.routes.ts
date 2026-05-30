import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createEventoInscricaoSchema, updateEventoInscricaoSchema } from '../dtos/eventos-inscricoes.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const eventosInscricoesRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'eventos_inscricoes',
    idField: 'inscricao_id',
    createSchema: createEventoInscricaoSchema,
    updateSchema: updateEventoInscricaoSchema,
  });

  registerCrudRoutes(app, '/eventos-inscricoes', controller);
  registerCrudRoutes(app, '/eventos_inscricoes', controller);
};
