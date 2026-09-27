import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const errorHandler = (
  error: FastifyError | AppError | ZodError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      message: error.message,
      details: error.details ?? null,
    });
    return;
  }

  if (error instanceof ZodError) {
    reply.status(400).send({
      message: 'Erro de validação',
      details: error.flatten(),
    });
    return;
  }

  if ('statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600) {
    reply.status(error.statusCode).send({
      message: error.statusCode === 413 ? 'O arquivo deve ter no maximo 8 MB' : error.message,
    });
    return;
  }

  reply.status(500).send({
    message: 'Erro interno do servidor',
  });
};
