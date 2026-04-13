import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createEventoSchema, updateEventoSchema } from '../dtos/eventos.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const eventosRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'eventos',
    idField: 'evento_id',
    createSchema: createEventoSchema,
    updateSchema: updateEventoSchema,
  });

  registerCrudRoutes(app, '/eventos', controller);
};
