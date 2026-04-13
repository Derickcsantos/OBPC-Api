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

  reply.status(500).send({
    message: 'Erro interno do servidor',
  });
};
