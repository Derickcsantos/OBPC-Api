import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createFotoMinisterioSchema, updateFotoMinisterioSchema } from '../dtos/fotos-ministerios.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const fotosMinisteriosRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'fotos_ministerios',
    idField: 'foto_ministerio_id',
    createSchema: createFotoMinisterioSchema,
    updateSchema: updateFotoMinisterioSchema,
  });

  registerCrudRoutes(app, '/fotos-ministerios', controller);
  registerCrudRoutes(app, '/fotos_ministerios', controller);
};
