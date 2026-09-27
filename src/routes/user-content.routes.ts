import { FastifyInstance } from 'fastify';
import { AdminController, UserContentController } from '../controllers/user-content.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { AdminServiceContract, UserContentServiceContract } from '../types/user-content.types.js';

export const userContentRoutes = (app: FastifyInstance, content: UserContentServiceContract, admin: AdminServiceContract): void => {
  const controller = new UserContentController(content);
  const adminController = new AdminController(admin);
  const requireAdmin = async (request: Parameters<typeof requireAuth>[0], reply: Parameters<typeof requireAuth>[1]) => {
    await requireAuth(request, reply);
    if (!await admin.isAdmin(request.authUser!.usuario_id)) throw app.httpErrors.forbidden('Acesso restrito a administradores.');
  };

  app.get('/usuarios/me/oracoes-oradas', { preHandler: requireAuth }, controller.listMyPrayers);
  app.get('/usuarios/me/anotacoes', { preHandler: requireAuth }, controller.listAnnotations);
  app.post('/usuarios/me/anotacoes', { preHandler: requireAuth }, controller.createAnnotation);
  app.get('/usuarios/me/anotacoes/:id', { preHandler: requireAuth }, controller.getAnnotation);
  app.put('/usuarios/me/anotacoes/:id', { preHandler: requireAuth }, controller.updateAnnotation);
  app.delete('/usuarios/me/anotacoes/:id', { preHandler: requireAuth }, controller.deleteAnnotation);
  app.get('/usuarios/me/destaques', { preHandler: requireAuth }, controller.listHighlights);
  app.put('/usuarios/me/destaques', { preHandler: requireAuth }, controller.upsertHighlight);
  app.delete('/usuarios/me/destaques/:id', { preHandler: requireAuth }, controller.deleteHighlight);
  app.get('/admin/oracoes', { preHandler: requireAdmin }, controller.listAdminPrayers);
  app.get('/admin/usuarios', { preHandler: requireAdmin }, adminController.listUsers);
  app.get('/admin/usuarios/:id', { preHandler: requireAdmin }, adminController.getUser);
  app.patch('/admin/usuarios/:id/role', { preHandler: requireAdmin }, adminController.updateRole);
  app.get('/admin/usuarios/:id/oracoes', { preHandler: requireAdmin }, controller.listUserPrayers);
};
