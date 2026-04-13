import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createOracaoSchema, updateOracaoSchema } from '../dtos/oracoes.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const oracoesRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'oracoes',
    idField: 'oracao_id',
    createSchema: createOracaoSchema,
    updateSchema: updateOracaoSchema,
  });

  registerCrudRoutes(app, '/oracoes', controller);
};
