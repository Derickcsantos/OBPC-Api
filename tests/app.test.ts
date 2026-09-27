import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { BibleServiceContract, CrudServiceContract, StudyPlanServiceContract } from '../src/types/crud.types.js';
import { FakeCrudService } from './helpers/fake-crud.service.js';
import { AuthServiceContract } from '../src/types/auth.types.js';
import { RelationshipServiceContract } from '../src/types/relationship.types.js';
import { signApiToken } from '../src/services/google-token.service.js';
import { env } from '../src/config/env.js';
import { AdminServiceContract, UserContentServiceContract } from '../src/types/user-content.types.js';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.BIBLE_API_KEY = 'test-bible-key';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.AUTH_JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';

const bibleStub: BibleServiceContract = {
  getTestaments: async () => [{ id: 1, name: 'Antigo Testamento' }],
  getVersions: async () => [{ id: 1, name: 'ACF' }],
  getBooks: async () => [{ id: 1, name: 'Gênesis' }],
  getChapters: async () => [{ chapter_id: 1 }],
  getChapter: async () => ({ book: 1, chapter: 1, verses: [] }),
  getBookVerses: async () => ({
    data: [{ verse_id: 1, text: 'No princípio...' }],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }),
  getVerses: async () => ({ verses: [{ verse_id: 1, text: 'No princípio...' }] }),
  compareVerses: async () => ({ data: [{ book: 1, chapter: 1, verse: 1, texts_by_version: { nvi: 'No principio...' } }] }),
  searchExactWords: async (params) => (params.scope === 'books'
    ? {
        data: [{ id: 1, name: 'Genesis', abbrev: 'gn', testament: 1 }],
        pagination: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        meta: {
          scope: 'books',
          keyword: params.keyword,
          version: params.version,
        },
      }
    : { verses: [{ verse_id: 1, text: 'Deus criou' }] }),
};

const authStub: AuthServiceContract = {
  loginWithGoogle: async () => ({
    access_token: 'api-jwt',
    token_type: 'Bearer',
    expires_in: 604800,
    user: {
      usuario_id: '11111111-1111-4111-8111-111111111111',
      nome_usuario: 'Usuario Google',
      email_usuario: 'usuario@example.com',
      auth_provider: 'google',
      role: 'user',
    },
  }),
};

let markedByUser: string | undefined;
const relationshipStub: RelationshipServiceContract = {
  markPrayerAsPrayed: async (userId, prayerId) => {
    markedByUser = userId;
    return { usuario_id: userId, oracao_id: prayerId, orado: true };
  },
  unmarkPrayerAsPrayed: async (userId, prayerId) => ({ usuario_id: userId, oracao_id: prayerId, orado: false }),
  addMinistryInterest: async (userId, ministryId) => ({ usuario_id: userId, ministerio_id: ministryId }),
  removeMinistryInterest: async (userId, ministryId) => ({ usuario_id: userId, ministerio_id: ministryId, removido: true }),
  listMinistryInterests: async () => [],
  listMinistryInterestedUsers: async () => [],
};

const adminStub: AdminServiceContract = {
  isAdmin: async (id) => id === '99999999-9999-4999-8999-999999999999',
  listUsers: async () => ({ data: [], pagination: {} }),
  getUser: async (id) => ({ usuario_id: id, role: 'user' }),
  updateUserRole: async (_actorId, id, role) => ({ usuario_id: id, role }),
};

const userContentStub: UserContentServiceContract = {
  listPublicPrayers: async (userId) => ({
    data: [{ oracao_id: '33333333-3333-4333-8333-333333333333', ...(userId ? { orado_por_mim: true } : {}) }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  }),
  listMyPrayers: async () => ({ data: [], pagination: {} }),
  listUserPrayerStatus: async () => ({ data: [], pagination: {} }),
  listAdminPrayers: async () => ({ data: [], pagination: {} }),
  listAnnotations: async () => ({ data: [], pagination: {} }),
  getAnnotation: async (_userId, id) => ({ anotacao_id: id }),
  createAnnotation: async (userId, input) => ({ usuario_id: userId, ...input }),
  updateAnnotation: async (userId, id, input) => ({ usuario_id: userId, anotacao_id: id, ...input }),
  deleteAnnotation: async (_userId, id) => ({ anotacao_id: id }),
  listHighlights: async () => ({ data: [], pagination: {} }),
  upsertHighlight: async (userId, input) => ({ usuario_id: userId, ...input }),
  deleteHighlight: async (_userId, id) => ({ destaque_id: id }),
};

const studyPlanStub: StudyPlanServiceContract = {
  listPlans: async () => [
    {
      plano_estudo_id: '22222222-2222-4222-8222-222222222222',
      titulo: 'Plano de leitura da Biblia em 1 ano',
      slug: 'plano-leitura-biblia-1-ano',
      duracao_dias: 365,
      quantidade_dias: 365,
    },
  ],
  getPlan: async () => ({
    plano_estudo_id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Plano de leitura da Biblia em 1 ano',
    slug: 'plano-leitura-biblia-1-ano',
    quantidade_dias: 365,
    dias: [{ dia: 1, titulo: 'Dia 1' }],
  }),
  getPlanDay: async () => ({
    dia: {
      dia: 1,
      quantidade_leituras: 1,
      leituras: [{ ordem: 1, book_id: 1, chapter: 1 }],
    },
  }),
  getPlanDayTexts: async () => ({
    dia: {
      dia: 1,
      quantidade_leituras: 1,
      leituras: [{ ordem: 1, referencia: 'Genesis 1', texto: { chapter_text: 'No principio...' } }],
    },
  }),
};

describe('API', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    const { createApp } = await import('../src/app.js');
    const fakeService = new FakeCrudService() as CrudServiceContract;

    app = await createApp({
      crudServices: {
        ministerios: fakeService,
        usuarios: fakeService,
        eventos: fakeService,
        noticias: fakeService,
        louvores: fakeService,
        mensagens: fakeService,
        oracoes: fakeService,
        pessoas: fakeService,
        fotos_ministerios: fakeService,
        eventos_imagens: fakeService,
        eventos_inscricoes: fakeService,
      },
      bibleService: bibleStub,
      studyPlanService: studyPlanStub,
      authService: authStub,
      relationshipService: relationshipStub,
      adminService: adminStub,
      userContentService: userContentStub,
    });

    await app.ready();
    adminToken = await signApiToken(
      { sub: '99999999-9999-4999-8999-999999999999', email: 'admin@example.com', provider: 'google', role: 'admin' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve responder health check', async () => {
    const response = await request(app.server).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('deve criar ministério', async () => {
    const response = await request(app.server).post('/api/ministerios').set('Authorization', `Bearer ${adminToken}`).send({
      nome_ministerio: 'Jovens',
      descricao_ministerio: 'Ministério de jovens',
      url_ministerio: 'https://igreja.com/jovens',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.nome_ministerio).toBe('Jovens');
  });

  it('deve validar usuário com email inválido', async () => {
    const response = await request(app.server).post('/api/usuarios').send({
      nome_usuario: 'Teste',
      telefone_usuario: '11999999999',
      senha_usuario: '123456',
      email_usuario: 'email-invalido',
      data_nascimento: '1990-01-01',
    });

    expect(response.statusCode).toBe(404);
  });

  it('deve retornar versões da bíblia', async () => {
    const response = await request(app.server).get('/api/biblia/versions');
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].name).toBe('ACF');
  });

  it('deve buscar livro da biblia pelo nome', async () => {
    const response = await request(app.server).get('/api/biblia/search?keyword=genesis&scope=books');
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].name).toBe('Genesis');
    expect(response.body.meta.scope).toBe('books');
  });

  it('deve autenticar com um id_token do Google', async () => {
    const response = await request(app.server).post('/api/auth/google').send({
      id_token: 'google-id-token',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.access_token).toBe('api-jwt');
    expect(response.body.user.email_usuario).toBe('usuario@example.com');
    expect(response.body.user.role).toBe('user');
  });

  it('deve rejeitar login Google sem id_token', async () => {
    const response = await request(app.server).post('/api/auth/google').send({});
    expect(response.statusCode).toBe(400);
  });

  it('deve retornar versos de um livro sem erro interno', async () => {
    const response = await request(app.server).get('/api/biblia/books/3/verses?page=1&limit=10');
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].text).toBe('No princípio...');
  });

  it('deve criar oração', async () => {
    const response = await request(app.server).post('/api/oracoes').set('Authorization', `Bearer ${adminToken}`).send({
      nome_pedido: 'Saúde',
      descricao_pedido: 'Pedido de oração pela saúde da família',
      mostrar_grupo: true,
      aceita_ligacao: true,
      status: 'em andamento',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.nome_pedido).toBe('Saúde');
    expect(response.body.data.status).toBe('em andamento');
  });

  it('deve exigir autenticação para marcar oração como feita', async () => {
    const response = await request(app.server)
      .post('/api/oracoes/33333333-3333-4333-8333-333333333333/orado');

    expect(response.statusCode).toBe(401);
  });

  it('deve usar o usuário do JWT ao marcar oração como feita', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const token = await signApiToken(
      { sub: userId, email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET,
      600,
      env.BACKEND_URL ?? 'books-api',
    );

    const response = await request(app.server)
      .post('/api/oracoes/33333333-3333-4333-8333-333333333333/orado')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(201);
    expect(markedByUser).toBe(userId);
  });

  it('deve impedir usuario comum de criar conteudo administrativo', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google', role: 'user' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).post('/api/oracoes').set('Authorization', `Bearer ${token}`).send({
      nome_pedido: 'Teste', descricao_pedido: 'Teste de permissao',
    });
    expect(response.statusCode).toBe(403);
  });

  it('deve desmarcar oracao de forma idempotente com orado false', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server)
      .delete('/api/oracoes/33333333-3333-4333-8333-333333333333/orado')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data.orado).toBe(false);
  });

  it('deve negar upload administrativo para usuario comum', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).post('/api/admin/uploads')
      .set('Authorization', `Bearer ${token}`)
      .field('context', 'eventos')
      .attach('file', Buffer.from('not-an-image'), 'arquivo.png');
    expect(response.statusCode).toBe(403);
  });

  it('deve validar o conteudo real do upload administrativo', async () => {
    const response = await request(app.server).post('/api/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('context', 'eventos')
      .attach('file', Buffer.from('<html>nao e imagem</html>'), 'arquivo.png');
    expect(response.statusCode).toBe(400);
  });

  it('deve rejeitar upload administrativo maior que 8 MB', async () => {
    const response = await request(app.server).post('/api/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('context', 'eventos')
      .attach('file', Buffer.alloc((8 * 1024 * 1024) + 1, 1), 'grande.jpg');
    expect(response.statusCode).toBe(413);
  });

  it('deve listar somente as oracoes do usuario autenticado', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).get('/api/usuarios/me/oracoes-oradas').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('deve incluir orado_por_mim na lista publica autenticada', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).get('/api/oracoes?page=1&limit=20').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].orado_por_mim).toBe(true);
    expect(response.body.pagination.totalPages).toBe(1);
  });

  it('deve isolar anotacoes usando sempre o usuario do JWT', async () => {
    const first = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'um@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const second = await signApiToken(
      { sub: '22222222-2222-4222-8222-222222222222', email: 'dois@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const body = { conteudo: 'Privada', versiculos: [{ version: 'nvi', book: 1, chapter: 1, verse: 1 }] };
    const firstResponse = await request(app.server).post('/api/usuarios/me/anotacoes').set('Authorization', `Bearer ${first}`).send({ ...body, usuario_id: 'forjado' });
    const secondResponse = await request(app.server).post('/api/usuarios/me/anotacoes').set('Authorization', `Bearer ${second}`).send({ ...body, usuario_id: 'forjado' });
    expect(firstResponse.body.data.usuario_id).toBe('11111111-1111-4111-8111-111111111111');
    expect(secondResponse.body.data.usuario_id).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('deve aceitar anotacao vinculada a varios versiculos', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).post('/api/usuarios/me/anotacoes').set('Authorization', `Bearer ${token}`).send({
      conteudo: 'Minha anotacao',
      versiculos: [
        { version: 'nvi', book: 1, chapter: 1, verse: 1 },
        { version: 'nvi', book: 1, chapter: 1, verse: 3 },
      ],
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.data.versiculos).toHaveLength(2);
  });

  it('deve rejeitar cor de destaque fora da paleta', async () => {
    const token = await signApiToken(
      { sub: '11111111-1111-4111-8111-111111111111', email: 'usuario@example.com', provider: 'google' },
      env.AUTH_JWT_SECRET, 600, env.BACKEND_URL ?? 'books-api',
    );
    const response = await request(app.server).put('/api/usuarios/me/destaques').set('Authorization', `Bearer ${token}`).send({
      version: 'nvi', book: 1, chapter: 1, verse: 1, estilo: 'background', cor: 'orange',
    });
    expect(response.statusCode).toBe(400);
  });

  it('deve criar pessoa', async () => {
    const response = await request(app.server).post('/api/pessoas').set('Authorization', `Bearer ${adminToken}`).send({
      nome: 'Maria Silva',
      cargo: 'Lider',
      sobre: 'Responsavel pelo ministerio.',
      telefone: '11999999999',
      email: 'maria@example.com',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.nome).toBe('Maria Silva');
  });

  it('deve criar registro de foto de ministerio', async () => {
    const response = await request(app.server).post('/api/fotos-ministerios').set('Authorization', `Bearer ${adminToken}`).send({
      ministerio_id: '11111111-1111-4111-8111-111111111111',
      url_imagem: 'https://example.com/foto.webp',
      ordem: 0,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.url_imagem).toBe('https://example.com/foto.webp');
  });

  it('deve listar planos de estudo', async () => {
    const response = await request(app.server).get('/api/planos-estudo');
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].slug).toBe('plano-leitura-biblia-1-ano');
    expect(response.body.data[0].quantidade_dias).toBe(365);
  });

  it('deve retornar textos do dia do plano de estudo', async () => {
    const response = await request(app.server).get('/api/planos-estudo/plano-leitura-biblia-1-ano/dias/1/textos');
    expect(response.statusCode).toBe(200);
    expect(response.body.data.dia.leituras[0].texto.chapter_text).toBe('No principio...');
  });
});
