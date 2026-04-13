import { FastifyReply, FastifyRequest } from 'fastify';
import { parseWithSchema } from '../utils/validation.js';
import { idParamSchema } from '../dtos/common.dto.js';
import { CrudControllerConfig, CrudServiceContract, EntityRecord } from '../types/crud.types.js';

export class CrudController {
  constructor(
    private readonly service: CrudServiceContract,
    private readonly config: CrudControllerConfig,
  ) {}

  private sanitize(payload: EntityRecord): EntityRecord {
    if (!this.config.sanitizeOutput) {
      return payload;
    }

    return this.config.sanitizeOutput(payload);
  }

  list = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const items = await this.service.list();
    reply.send({
      data: items.map((item) => this.sanitize(item)),
    });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const item = await this.service.getById(id);
    reply.send({ data: this.sanitize(item) });
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const payload = parseWithSchema(this.config.createSchema, request.body) as EntityRecord;
    const dataToCreate = this.config.transformCreate ? await this.config.transformCreate(payload) : payload;
    const created = await this.service.create(dataToCreate);

    reply.status(201).send({
      message: `${this.config.resource} criado com sucesso`,
      data: this.sanitize(created),
    });
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const payload = parseWithSchema(this.config.updateSchema, request.body) as EntityRecord;
    const dataToUpdate = this.config.transformUpdate ? await this.config.transformUpdate(payload) : payload;
    const updated = await this.service.update(id, dataToUpdate);

    reply.send({
      message: `${this.config.resource} atualizado com sucesso`,
      data: this.sanitize(updated),
    });
  };

  remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = parseWithSchema(idParamSchema, request.params);
    const removed = await this.service.remove(id);

    reply.send({
      message: `${this.config.resource} removido com sucesso`,
      data: this.sanitize(removed),
    });
  };
}
