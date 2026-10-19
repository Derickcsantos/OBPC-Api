import { FastifyReply, FastifyRequest } from 'fastify';
import { planoEstudoDiaParamSchema, planoEstudoParamSchema, planoEstudoTextosQuerySchema } from '../dtos/planos-estudo.dto.js';
import { StudyPlanServiceContract } from '../types/crud.types.js';
import { parseWithSchema } from '../utils/validation.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/app-error.js';

export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanServiceContract) {}

  listPlans = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = await this.studyPlanService.listPlans();
    reply.send({ data });
  };

  getPlan = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { plano } = parseWithSchema(planoEstudoParamSchema, request.params);
    const data = await this.studyPlanService.getPlan(plano);
    reply.send({ data });
  };

  getPlanDay = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { plano, dia } = parseWithSchema(planoEstudoDiaParamSchema, request.params);
    const data = await this.studyPlanService.getPlanDay(plano, dia);
    reply.send({ data });
  };

  getPlanDayTexts = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { plano, dia } = parseWithSchema(planoEstudoDiaParamSchema, request.params);
    const query = parseWithSchema(planoEstudoTextosQuerySchema, request.query);
    const data = await this.studyPlanService.getPlanDayTexts(plano, dia, query.version ?? query.versao);
    reply.send({ data });
  };


  listCompletedDays = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);
    const { plano } = parseWithSchema(planoEstudoParamSchema, request.params);
    reply.send({ data: await this.studyPlanService.listCompletedDays(request.authUser!.usuario_id, plano) });
  };

  setDayCompleted = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);
    const { plano, dia } = parseWithSchema(planoEstudoDiaParamSchema, request.params);
    const body = request.body as { concluido?: boolean };
    if (typeof body?.concluido !== 'boolean') throw new AppError(400, 'Informe se o dia está concluído.');
    reply.send({ data: await this.studyPlanService.setDayCompleted(request.authUser!.usuario_id, plano, dia, body.concluido) });
  };
}
