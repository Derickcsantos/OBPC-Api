import { FastifyInstance } from 'fastify';
import { bibliaRoutes } from './biblia.routes.js';
import { eventosRoutes } from './eventos.routes.js';
import { louvoresRoutes } from './louvores.routes.js';
import { mensagensRoutes } from './mensagens.routes.js';
import { ministeriosRoutes } from './ministerios.routes.js';
import { oracoesRoutes } from './oracoes.routes.js';
import { noticiasRoutes } from './noticias.routes.js';
import { usuariosRoutes } from './usuarios.routes.js';
import { BibleServiceContract, CrudServiceContract, ResourceName } from '../types/crud.types.js';

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
  usuariosRoutes(app, opts.services.crudServices.usuarios);
  eventosRoutes(app, opts.services.crudServices.eventos);
  noticiasRoutes(app, opts.services.crudServices.noticias);
  louvoresRoutes(app, opts.services.crudServices.louvores);
  mensagensRoutes(app, opts.services.crudServices.mensagens);
  oracoesRoutes(app, opts.services.crudServices.oracoes);
  bibliaRoutes(app, opts.services.bibleService);
};
