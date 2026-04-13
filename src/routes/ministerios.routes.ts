import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createMinisterioSchema, updateMinisterioSchema } from '../dtos/ministerios.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const ministeriosRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'ministerios',
    idField: 'ministerio_id',
    createSchema: createMinisterioSchema,
    updateSchema: updateMinisterioSchema,
  });

  registerCrudRoutes(app, '/ministerios', controller);
};
