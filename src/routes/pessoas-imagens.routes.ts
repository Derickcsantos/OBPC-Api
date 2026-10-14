import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';
import { createPessoaImagemSchema, updatePessoaImagemSchema } from '../dtos/pessoas-imagens.dto.js';
import { CrudServiceContract } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

export const pessoasImagensRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'pessoas_imagens',
    idField: 'pessoa_imagem_id',
    createSchema: createPessoaImagemSchema,
    updateSchema: updatePessoaImagemSchema,
  });

  registerCrudRoutes(app, '/pessoas-imagens', controller);
  registerCrudRoutes(app, '/pessoas_imagens', controller);
};
