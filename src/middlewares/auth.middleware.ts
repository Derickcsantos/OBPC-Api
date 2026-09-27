import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { verifyApiToken } from '../services/google-token.service.js';
import { AuthUser } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';
import { SupabaseClient } from '@supabase/supabase-js';

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
    role: claims.role ?? 'user',
  };
};

export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!request.headers.authorization) return;
  await requireAuth(request, reply);
};

export const requireAdmin = (client: SupabaseClient) => async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await requireAuth(request, reply);
  const { data, error } = await client
    .from('usuarios')
    .select('role')
    .eq('usuario_id', request.authUser!.usuario_id)
    .maybeSingle();
  if (error) throw new AppError(500, 'Erro ao validar permissao administrativa.', error);
  if (data?.role !== 'admin') throw new AppError(403, 'Acesso restrito a administradores.');
  request.authUser!.role = 'admin';
};
