import { FastifyInstance } from 'fastify';
import { StudyPlanController } from '../controllers/study-plan.controller.js';
import { studyPlansApiDocumentation } from '../docs/study-plans-api-documentation.js';
import { StudyPlanServiceContract } from '../types/crud.types.js';

export const planosEstudoRoutes = (app: FastifyInstance, service: StudyPlanServiceContract): void => {
  const controller = new StudyPlanController(service);

  app.get('/planos-estudo/docs', async () => ({ data: studyPlansApiDocumentation }));
  app.get('/planos-estudo', controller.listPlans);
  app.get('/planos-estudo/:plano', controller.getPlan);
  app.get('/planos-estudo/:plano/dias/:dia', controller.getPlanDay);
  app.get('/planos-estudo/:plano/dias/:dia/textos', controller.getPlanDayTexts);
};
