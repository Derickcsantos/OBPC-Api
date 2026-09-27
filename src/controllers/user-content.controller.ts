import { FastifyReply, FastifyRequest } from 'fastify';
import { annotationSchema, highlightQuerySchema, highlightSchema, paginationSchema, roleSchema } from '../dtos/user-content.dto.js';
import { idParamSchema } from '../dtos/common.dto.js';
import { AdminServiceContract, UserContentServiceContract } from '../types/user-content.types.js';
import { AppError } from '../utils/app-error.js';
import { parseWithSchema } from '../utils/validation.js';

const userId = (request: FastifyRequest): string => {
  if (!request.authUser?.usuario_id) throw new AppError(401, 'Usuario nao autenticado.');
  return request.authUser.usuario_id;
};

export class UserContentController {
  constructor(private readonly service: UserContentServiceContract) {}
  listMyPrayers = async (req: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.listMyPrayers(userId(req), parseWithSchema(paginationSchema, req.query)));
  listUserPrayers = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = parseWithSchema(idParamSchema, req.params);
    reply.send(await this.service.listUserPrayerStatus(id, userId(req), parseWithSchema(paginationSchema, req.query)));
  };
  listAdminPrayers = async (req: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.listAdminPrayers(userId(req), parseWithSchema(paginationSchema, req.query)));
  listAnnotations = async (req: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.listAnnotations(userId(req), parseWithSchema(paginationSchema, req.query)));
  getAnnotation = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.getAnnotation(userId(req), parseWithSchema(idParamSchema, req.params).id) });
  createAnnotation = async (req: FastifyRequest, reply: FastifyReply) => reply.status(201).send({ data: await this.service.createAnnotation(userId(req), parseWithSchema(annotationSchema, req.body)) });
  updateAnnotation = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.updateAnnotation(userId(req), parseWithSchema(idParamSchema, req.params).id, parseWithSchema(annotationSchema, req.body)) });
  deleteAnnotation = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.deleteAnnotation(userId(req), parseWithSchema(idParamSchema, req.params).id) });
  listHighlights = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = parseWithSchema(highlightQuerySchema, req.query);
    reply.send(await this.service.listHighlights(userId(req), query as unknown as Record<string, string>, query));
  };
  upsertHighlight = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.upsertHighlight(userId(req), parseWithSchema(highlightSchema, req.body)) });
  deleteHighlight = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.deleteHighlight(userId(req), parseWithSchema(idParamSchema, req.params).id) });
}

export class AdminController {
  constructor(private readonly service: AdminServiceContract) {}
  listUsers = async (req: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.listUsers(parseWithSchema(paginationSchema, req.query)));
  getUser = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.getUser(parseWithSchema(idParamSchema, req.params).id) });
  updateRole = async (req: FastifyRequest, reply: FastifyReply) => reply.send({ data: await this.service.updateUserRole(userId(req), parseWithSchema(idParamSchema, req.params).id, parseWithSchema(roleSchema, req.body).role) });
}
