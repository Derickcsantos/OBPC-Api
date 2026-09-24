import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { verifyApiToken } from '../services/google-token.service.js';
import { AuthUser } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

export const requireAuth = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    throw new AppError(401, 'Token de acesso obrigatorio.');
  }

  const claims = await verifyApiToken(token, env.AUTH_JWT_SECRET, env.BACKEND_URL ?? 'books-api');
  request.authUser = {
    usuario_id: claims.sub,
    nome_usuario: '',
    email_usuario: claims.email ?? '',
    auth_provider: claims.provider,
  };
};