import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createMensagemSchema, updateMensagemSchema } from '../dtos/mensagens.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const mensagensRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'mensagens',
    idField: 'mensagem_id',
    createSchema: createMensagemSchema,
    updateSchema: updateMensagemSchema,
  });

  registerCrudRoutes(app, '/mensagens', controller);
};
