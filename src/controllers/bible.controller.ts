import { FastifyReply, FastifyRequest } from 'fastify';
import {
  bibleBookParamSchema,
  bibleBooksQuerySchema,
  bibleChaptersQuerySchema,
  bibleSearchQuerySchema,
  bibleVersesQuerySchema,
} from '../dtos/biblia.dto.js';
import { parseWithSchema } from '../utils/validation.js';
import { BibleServiceContract } from '../types/crud.types.js';

const sortByIdAscending = <T extends Record<string, unknown>>(items: T[]): T[] =>
  [...items].sort((left, right) => {
    const leftId = left.id;
    const rightId = right.id;

    const leftNumber = typeof leftId === 'number' ? leftId : Number(leftId);
    const rightNumber = typeof rightId === 'number' ? rightId : Number(rightId);

    const leftIsNumeric = Number.isFinite(leftNumber);
    const rightIsNumeric = Number.isFinite(rightNumber);

    if (leftIsNumeric && rightIsNumeric) {
      return leftNumber - rightNumber;
    }

    return String(leftId).localeCompare(String(rightId), 'pt-BR', {
      numeric: true,
      sensitivity: 'base',
    });
  });

export class BibleController {
  constructor(private readonly bibleService: BibleServiceContract) {}

  getTestaments = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = await this.bibleService.getTestaments();
    reply.send({ data });
  };

  getVersions = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = await this.bibleService.getVersions();
    reply.send({ data });
  };

  getBooks = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleBooksQuerySchema, request.query);
    const payload = Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});

    const data = await this.bibleService.getBooks(payload);
    reply.send({ data: Array.isArray(data) ? sortByIdAscending(data) : data });
  };

  getChapters = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = parseWithSchema(bibleChaptersQuerySchema, request.query);
    const payload = Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});

    const data = await this.bibleService.getChapters(payload);
    reply.send({ data });
  };

  getBookVerses = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = parseWithSchema(bibleBookParamSchema, request.params);
    const query = parseWithSchema(bibleVersesQuerySchema.partial(), request.query);

    const payload = Object.entries({
      ...query,
      book_id: params.book_id,
    }).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});

    const data = await this.bibleService.getBookVerses(payload);
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
