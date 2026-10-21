import { FastifyInstance } from 'fastify';
import { appleLoginSchema, googleLoginSchema } from '../dtos/auth.dto.js';
import { AuthServiceContract } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const authRoutes = (app: FastifyInstance, service: AuthServiceContract): void => {
  app.post('/auth/google', async (request, reply) => {
    const parsed = googleLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Erro de validacao', parsed.error.flatten());
    }

    const result = await service.loginWithGoogle(parsed.data.id_token);
    return reply.status(200).send(result);
  });
  app.post('/auth/apple', async (request, reply) => {
    const parsed = appleLoginSchema.safeParse(request.body);
    if (!parsed.success) throw new AppError(400, 'Erro de validacao', parsed.error.flatten());
    return reply.status(200).send(await service.loginWithApple(parsed.data.id_token, parsed.data.nonce));
  });
  app.post('/auth/google/deletion-session', async (request, reply) => {
    const parsed = googleLoginSchema.safeParse(request.body);
    if (!parsed.success) throw new AppError(400, 'Erro de validacao', parsed.error.flatten());
    return reply.status(200).send(await service.createDeletionSession(parsed.data.id_token));
  });
  app.delete('/usuarios/me', { preHandler: requireAuth }, async (request, reply) => {
    await service.deleteAccount(request.authUser!.usuario_id);
    return reply.status(204).send();
  });
};
