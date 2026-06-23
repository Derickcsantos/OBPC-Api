import { FastifyInstance } from 'fastify';
import { googleLoginSchema } from '../dtos/auth.dto.js';
import { AuthServiceContract } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';

export const authRoutes = (app: FastifyInstance, service: AuthServiceContract): void => {
  app.post('/auth/google', async (request, reply) => {
    const parsed = googleLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Erro de validacao', parsed.error.flatten());
    }

    const result = await service.loginWithGoogle(parsed.data.id_token);
    return reply.status(200).send(result);
  });
};
