import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createPessoaSchema, updatePessoaSchema } from '../dtos/pessoas.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const pessoasRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'pessoas',
    idField: 'pessoa_id',
    createSchema: createPessoaSchema,
    updateSchema: updatePessoaSchema,
  });

  registerCrudRoutes(app, '/pessoas', controller);
};
