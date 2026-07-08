import { FastifyReply, FastifyRequest } from 'fastify';
import { planoEstudoDiaParamSchema, planoEstudoParamSchema, planoEstudoTextosQuerySchema } from '../dtos/planos-estudo.dto.js';
import { StudyPlanServiceContract } from '../types/crud.types.js';
import { parseWithSchema } from '../utils/validation.js';

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
}
