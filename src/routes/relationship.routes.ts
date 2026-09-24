import { FastifyInstance } from 'fastify';
import { RelationshipController } from '../controllers/relationship.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { RelationshipServiceContract } from '../types/relationship.types.js';

export const relationshipRoutes = (app: FastifyInstance, service: RelationshipServiceContract): void => {
  const controller = new RelationshipController(service);

  app.post('/oracoes/:id/orado', { preHandler: requireAuth }, controller.markPrayerAsPrayed);
  app.post('/ministerios/:id/interesse', { preHandler: requireAuth }, controller.addMinistryInterest);
  app.delete('/ministerios/:id/interesse', { preHandler: requireAuth }, controller.removeMinistryInterest);
  app.get('/ministerios/:id/interessados', { preHandler: requireAuth }, controller.listMinistryInterestedUsers);
  app.get('/usuarios/me/ministerios-interesse', { preHandler: requireAuth }, controller.listMyMinistryInterests);
};