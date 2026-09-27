import { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { CrudController } from '../controllers/crud.controller.js';

export const registerCrudRoutes = (app: FastifyInstance, basePath: string, controller: CrudController, writeGuard?: preHandlerHookHandler, includeList = true): void => {
  if (includeList) app.get(basePath, controller.list);
  app.get(`${basePath}/:id`, controller.getById);
  const options = writeGuard ? { preHandler: writeGuard } : {};
  app.post(basePath, options, controller.create);
  app.put(`${basePath}/:id`, options, controller.update);
  app.delete(`${basePath}/:id`, options, controller.remove);
};
