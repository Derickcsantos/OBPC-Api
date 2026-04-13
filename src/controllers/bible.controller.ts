import { FastifyReply, FastifyRequest } from 'fastify';
import {
  bibleBooksQuerySchema,
  bibleChaptersQuerySchema,
  bibleSearchQuerySchema,
  bibleVersesQuerySchema,
} from '../dtos/biblia.dto.js';
import { parseWithSchema } from '../utils/validation.js';
import { BibleServiceContract } from '../types/crud.types.js';

export class BibleController {
  constructor(private readonly bibleService: BibleServiceContract) {}

  getVersions = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = await this.bibleService.getVersions();
    reply.send({ data });
  };

  getBooks = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleBooksQuerySchema, request.query);
    const data = await this.bibleService.getBooks(query.version_id);
    reply.send({ data });
  };

  getChapters = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleChaptersQuerySchema, request.query);
    const data = await this.bibleService.getChapters(query.version_id, query.book_id);
    reply.send({ data });
  };

  getVerses = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleVersesQuerySchema, request.query);

    const payload = Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});

    const data = await this.bibleService.getVerses(payload);
    reply.send({ data });
  };

  searchExactWords = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleSearchQuerySchema, request.query);

    const payload = Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});

    const data = await this.bibleService.searchExactWords(payload);
    reply.send({ data });
  };
}
