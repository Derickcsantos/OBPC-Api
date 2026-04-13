import { FastifyInstance } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';

export const registerCrudRoutes = (app: FastifyInstance, basePath: string, controller: CrudController): void => {
  app.get(basePath, controller.list);
  app.get(`${basePath}/:id`, controller.getById);
  app.post(basePath, controller.create);
  app.put(`${basePath}/:id`, controller.update);
  app.delete(`${basePath}/:id`, controller.remove);
};
