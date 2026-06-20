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
import { usuariosRoutes } from './usuarios.routes.js';
import { uploadsRoutes } from './uploads.routes.js';
import { BibleServiceContract, CrudServiceContract, ResourceName } from '../types/crud.types.js';
import { getSupabaseClient } from '../lib/supabase.js';

interface RouteServices {
  crudServices: Record<ResourceName, CrudServiceContract>;
  bibleService: BibleServiceContract;
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

  ministeriosRoutes(app, opts.services.crudServices.ministerios);
  fotosMinisteriosRoutes(app, opts.services.crudServices.fotos_ministerios);
  pessoasRoutes(app, opts.services.crudServices.pessoas);
  usuariosRoutes(app, opts.services.crudServices.usuarios);
  eventosRoutes(app, opts.services.crudServices.eventos);
  eventosImagensRoutes(app, opts.services.crudServices.eventos_imagens);
  eventosInscricoesRoutes(app, opts.services.crudServices.eventos_inscricoes);
  noticiasRoutes(app, opts.services.crudServices.noticias);
  louvoresRoutes(app, opts.services.crudServices.louvores);
  mensagensRoutes(app, opts.services.crudServices.mensagens);
  oracoesRoutes(app, opts.services.crudServices.oracoes);
  bibliaRoutes(app, opts.services.bibleService);
  uploadsRoutes(app, getSupabaseClient());
};
