import { FastifyInstance } from 'fastify';
import { bibliaRoutes } from './biblia.routes.js';
import { eventosImagensRoutes } from './eventos-imagens.routes.js';
import { eventosInscricoesRoutes } from './eventos-inscricoes.routes.js';
import { eventosRoutes } from './eventos.routes.js';
import { louvoresRoutes } from './louvores.routes.js';
import { mensagensRoutes } from './mensagens.routes.js';
import { ministeriosRoutes } from './ministerios.routes.js';
import { fotosMinisteriosRoutes } from './fotos-ministerios.routes.js';
import { pessoasRoutes } from './pessoas.routes.js';
import { oracoesRoutes } from './oracoes.routes.js';
import { noticiasRoutes } from './noticias.routes.js';
import { uploadsRoutes } from './uploads.routes.js';
import { planosEstudoRoutes } from './planos-estudo.routes.js';
import { BibleServiceContract, CrudServiceContract, ResourceName, StudyPlanServiceContract } from '../types/crud.types.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { authRoutes } from './auth.routes.js';
import { AuthServiceContract } from '../types/auth.types.js';
import { relationshipRoutes } from './relationship.routes.js';
import { RelationshipServiceContract } from '../types/relationship.types.js';
import { AdminServiceContract, UserContentServiceContract } from '../types/user-content.types.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { userContentRoutes } from './user-content.routes.js';

interface RouteServices {
  crudServices: Record<ResourceName, CrudServiceContract>;
  bibleService: BibleServiceContract;
  studyPlanService: StudyPlanServiceContract;
  authService: AuthServiceContract;
  relationshipService: RelationshipServiceContract;
  userContentService: UserContentServiceContract;
  adminService: AdminServiceContract;
}

export const registerRoutes = async (
  app: FastifyInstance,
  opts?: {
    prefix?: string;
    services: RouteServices;
  },
): Promise<void> => {
  if (!opts?.services) {
    throw new Error('Services não fornecidos para registerRoutes');
  }

  const adminOnlyResources = new Set([
    'ministerios', 'fotos-ministerios', 'fotos_ministerios', 'pessoas', 'eventos',
    'eventos-imagens', 'eventos_imagens', 'eventos-inscricoes', 'eventos_inscricoes',
    'noticias', 'louvores', 'mensagens', 'oracoes', 'uploads',
  ]);
  app.addHook('preHandler', async (request, reply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
    const path = request.url.split('?')[0].replace(/^\/api\//, '');
    const segments = path.split('/');
    if (!adminOnlyResources.has(segments[0])) return;
    if (segments[0] === 'eventos' && segments.length > 2 && segments[2] === 'inscricoes') return;
    if (segments[0] === 'oracoes' && segments.length > 2 && segments[2] === 'orado') return;
    await requireAuth(request, reply);
    if (!await opts.services.adminService.isAdmin(request.authUser!.usuario_id)) {
      throw app.httpErrors.forbidden('Acesso restrito a administradores.');
    }
  });

  ministeriosRoutes(app, opts.services.crudServices.ministerios);
  fotosMinisteriosRoutes(app, opts.services.crudServices.fotos_ministerios);
  pessoasRoutes(app, opts.services.crudServices.pessoas);
  authRoutes(app, opts.services.authService);
  eventosRoutes(app, opts.services.crudServices.eventos);
  eventosImagensRoutes(app, opts.services.crudServices.eventos_imagens);
  eventosInscricoesRoutes(app, opts.services.crudServices.eventos_inscricoes);
  noticiasRoutes(app, opts.services.crudServices.noticias);
  louvoresRoutes(app, opts.services.crudServices.louvores);
  mensagensRoutes(app, opts.services.crudServices.mensagens);
  oracoesRoutes(app, opts.services.crudServices.oracoes, opts.services.userContentService);
  relationshipRoutes(app, opts.services.relationshipService);
  userContentRoutes(app, opts.services.userContentService, opts.services.adminService);
  bibliaRoutes(app, opts.services.bibleService);
  planosEstudoRoutes(app, opts.services.studyPlanService);
  uploadsRoutes(app, getSupabaseClient(), opts.services.adminService);
};
