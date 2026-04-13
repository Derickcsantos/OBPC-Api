import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createNoticiaSchema, updateNoticiaSchema } from '../dtos/noticias.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const noticiasRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'noticias',
    idField: 'noticia_id',
    createSchema: createNoticiaSchema,
    updateSchema: updateNoticiaSchema,
  });

  registerCrudRoutes(app, '/noticias', controller);
};
