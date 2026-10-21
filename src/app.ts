import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { getSupabaseClient } from './lib/supabase.js';
import { SupabaseCrudService } from './services/crud.service.js';
import { BibleService } from './services/bible.service.js';
import { StudyPlanService } from './services/study-plan.service.js';
import { BibleServiceContract, CrudServiceContract, ResourceName, StudyPlanServiceContract } from './types/crud.types.js';
import { registerRoutes } from './routes/index.js';
import { dashboardHtml } from './frontend/dashboard.js';
import { AuthServiceContract } from './types/auth.types.js';
import { AuthService } from './services/auth.service.js';
import { env } from './config/env.js';
import { RelationshipServiceContract } from './types/relationship.types.js';
import { SupabaseRelationshipService } from './services/relationship.service.js';
import { AdminService } from './services/admin.service.js';
import { UserContentService } from './services/user-content.service.js';
import { AdminServiceContract, UserContentServiceContract } from './types/user-content.types.js';
import { accountDeletionPage, privacyPolicyPage, termsOfUsePage } from './legal/pages.js';

const resourceMap: Record<ResourceName, { table: string; idField: string }> = {
  ministerios: { table: 'ministerios', idField: 'ministerio_id' },
  usuarios: { table: 'usuarios', idField: 'usuario_id' },
  eventos: { table: 'eventos', idField: 'evento_id' },
  noticias: { table: 'noticias', idField: 'noticia_id' },
  louvores: { table: 'louvores', idField: 'louvor_id' },
  mensagens: { table: 'mensagens', idField: 'mensagem_id' },
  oracoes: { table: 'oracoes', idField: 'oracao_id' },
  pessoas: { table: 'pessoas', idField: 'pessoa_id' },
  pessoas_imagens: { table: 'pessoas_imagens', idField: 'pessoa_imagem_id' },
  fotos_ministerios: { table: 'fotos_ministerios', idField: 'foto_ministerio_id' },
  eventos_imagens: { table: 'eventos_imagens', idField: 'imagem_id' },
  eventos_inscricoes: { table: 'eventos_inscricoes', idField: 'inscricao_id' },
};

export interface AppDependencies {
  crudServices?: Partial<Record<ResourceName, CrudServiceContract>>;
  bibleService?: BibleServiceContract;
  studyPlanService?: StudyPlanServiceContract;
  authService?: AuthServiceContract;
  relationshipService?: RelationshipServiceContract;
  userContentService?: UserContentServiceContract;
  adminService?: AdminServiceContract;
}

export const createApp = async (dependencies?: AppDependencies): Promise<FastifyInstance> => {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://www.googleapis.com'],
        frameSrc: ['https://accounts.google.com'],
      },
    },
  });
  await app.register(sensible);
  await app.register(multipart, {
    limits: { files: 1, fields: 1, fileSize: 8 * 1024 * 1024 },
  });

  app.get('/', async (_request, reply) => {
    reply.type('text/html; charset=utf-8').send(dashboardHtml);
  });
  const sendLegalPage = (page: string) => (_request: unknown, reply: { type: (value: string) => { send: (body: string) => void } }): void => {
    reply.type('text/html; charset=utf-8').send(page);
  };
  app.get('/privacy-policy', sendLegalPage(privacyPolicyPage()));
  app.get('/terms-of-use', sendLegalPage(termsOfUsePage()));
  app.get('/delete-account', sendLegalPage(accountDeletionPage(env.GOOGLE_CLIENT_ID ?? env.GOOGLE_CLIENT_IDS[0] ?? '')));

  const supabase = getSupabaseClient();

  const defaultCrudServices = Object.entries(resourceMap).reduce<Record<ResourceName, CrudServiceContract>>(
    (acc, [resource, conf]) => {
      acc[resource as ResourceName] = new SupabaseCrudService(supabase, conf.table, conf.idField);
      return acc;
    },
    {} as Record<ResourceName, CrudServiceContract>,
  );

  const services = {
    crudServices: {
      ...defaultCrudServices,
      ...(dependencies?.crudServices ?? {}),
    },
    bibleService: dependencies?.bibleService ?? new BibleService(supabase),
    studyPlanService: dependencies?.studyPlanService ?? new StudyPlanService(supabase),
    authService: dependencies?.authService ?? new AuthService(supabase, {
      googleClientIds: env.GOOGLE_CLIENT_IDS,
      jwtSecret: env.AUTH_JWT_SECRET,
      jwtExpiresIn: env.AUTH_JWT_EXPIRES_IN_SECONDS,
      issuer: env.BACKEND_URL ?? 'books-api',
    }),
    relationshipService: dependencies?.relationshipService ?? new SupabaseRelationshipService(supabase),
    userContentService: dependencies?.userContentService ?? new UserContentService(supabase),
    adminService: dependencies?.adminService ?? new AdminService(supabase),
  };

  await app.register(
    async (instance) => {
      await registerRoutes(instance, { services });
    },
    { prefix: '/api' },
  );

  app.addHook('onResponse', async (request, reply) => {
    const actorId = request.authUser?.usuario_id;
    if (!actorId || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || request.url === '/api/usuarios/me') return;
    const path = request.url.split('?')[0];
    const category = path.split('/').filter(Boolean)[1] ?? 'app';
    try {
      await supabase.from('audit_logs').insert({ actor_id: actorId, category, action: `${request.method} ${path}`, status_code: reply.statusCode });
    } catch (error) {
      request.log.warn({ error }, 'Falha ao registrar auditoria');
    }
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.setErrorHandler(errorHandler);

  return app;
};
