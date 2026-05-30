import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createEventoImagemSchema, updateEventoImagemSchema } from '../dtos/eventos-imagens.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const eventosImagensRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'eventos_imagens',
    idField: 'imagem_id',
    createSchema: createEventoImagemSchema,
    updateSchema: updateEventoImagemSchema,
  });

  registerCrudRoutes(app, '/eventos-imagens', controller);
  registerCrudRoutes(app, '/eventos_imagens', controller);
};
