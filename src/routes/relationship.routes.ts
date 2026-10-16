import { FastifyInstance } from 'fastify';
import { RelationshipController } from '../controllers/relationship.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { RelationshipServiceContract } from '../types/relationship.types.js';
import { AdminServiceContract } from '../types/user-content.types.js';

export const relationshipRoutes = (app: FastifyInstance, service: RelationshipServiceContract, admin: AdminServiceContract): void => {
  const controller = new RelationshipController(service);
  const requireAdmin = async (request: Parameters<typeof requireAuth>[0], reply: Parameters<typeof requireAuth>[1]) => {
    await requireAuth(request, reply);
    if (!await admin.isAdmin(request.authUser!.usuario_id)) throw app.httpErrors.forbidden('Acesso restrito a administradores.');
  };

  app.post('/oracoes/:id/orado', { preHandler: requireAuth }, controller.markPrayerAsPrayed);
  app.delete('/oracoes/:id/orado', { preHandler: requireAuth }, controller.unmarkPrayerAsPrayed);
  app.post('/ministerios/:id/interesse', { preHandler: requireAuth }, controller.addMinistryInterest);
  app.delete('/ministerios/:id/interesse', { preHandler: requireAuth }, controller.removeMinistryInterest);
  app.get('/ministerios/:id/interessados', { preHandler: requireAdmin }, controller.listMinistryInterestedUsers);
  app.get('/usuarios/me/ministerios-interesse', { preHandler: requireAuth }, controller.listMyMinistryInterests);
};
