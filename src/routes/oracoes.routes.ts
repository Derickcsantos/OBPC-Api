import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createOracaoSchema, updateOracaoSchema } from '../dtos/oracoes.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';
import { UserContentServiceContract } from '../types/user-content.types.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { paginationSchema } from '../dtos/user-content.dto.js';
import { parseWithSchema } from '../utils/validation.js';

export const oracoesRoutes = (app: FastifyInstance, service: CrudServiceContract, content: UserContentServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'oracoes',
    idField: 'oracao_id',
    createSchema: createOracaoSchema,
    updateSchema: updateOracaoSchema,
  });

  app.get('/oracoes', { preHandler: optionalAuth }, async (request, reply) => {
    reply.send(await content.listPublicPrayers(request.authUser?.usuario_id, parseWithSchema(paginationSchema, request.query)));
  });
  registerCrudRoutes(app, '/oracoes', controller, undefined, false);
};
