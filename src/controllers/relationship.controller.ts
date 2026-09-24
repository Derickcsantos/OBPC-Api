import { FastifyReply, FastifyRequest } from 'fastify';
import { idParamSchema } from '../dtos/common.dto.js';
import { parseWithSchema } from '../utils/validation.js';
import { RelationshipServiceContract } from '../types/relationship.types.js';
import { AppError } from '../utils/app-error.js';

export class RelationshipController {
  constructor(private readonly service: RelationshipServiceContract) {}

  private userId(request: FastifyRequest): string {
    const userId = request.authUser?.usuario_id;
    if (!userId) throw new AppError(401, 'Usuário não autenticado.');
    return userId;
  }

  markPrayerAsPrayed = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const data = await this.service.markPrayerAsPrayed(this.userId(request), id);
    reply.status(201).send({ data });
  };

  addMinistryInterest = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const data = await this.service.addMinistryInterest(this.userId(request), id);
    reply.status(201).send({ data });
  };

  removeMinistryInterest = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const data = await this.service.removeMinistryInterest(this.userId(request), id);
    reply.send({ data });
  };

  listMyMinistryInterests = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = await this.service.listMinistryInterests(this.userId(request));
    reply.send({ data });
  };

  listMinistryInterestedUsers = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const data = await this.service.listMinistryInterestedUsers(id);
    reply.send({ data });
  };
}