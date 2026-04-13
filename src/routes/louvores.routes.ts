import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createLouvorSchema, updateLouvorSchema } from '../dtos/louvores.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const louvoresRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'louvores',
    idField: 'louvor_id',
    createSchema: createLouvorSchema,
    updateSchema: updateLouvorSchema,
  });

  registerCrudRoutes(app, '/louvores', controller);
};
