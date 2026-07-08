import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { BibleServiceContract, CrudServiceContract, StudyPlanServiceContract } from '../src/types/crud.types.js';
import { FakeCrudService } from './helpers/fake-crud.service.js';
import { AuthServiceContract } from '../src/types/auth.types.js';

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
  searchExactWords: async () => ({ verses: [{ verse_id: 1, text: 'Deus criou' }] }),
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
    },
  }),
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
    });

    await app.ready();
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
    const response = await request(app.server).post('/api/ministerios').send({
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

    expect(response.statusCode).toBe(400);
  });

  it('deve retornar versões da bíblia', async () => {
    const response = await request(app.server).get('/api/biblia/versions');
    expect(response.statusCode).toBe(200);
    expect(response.body.data[0].name).toBe('ACF');
  });

  it('deve autenticar com um id_token do Google', async () => {
    const response = await request(app.server).post('/api/auth/google').send({
      id_token: 'google-id-token',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.access_token).toBe('api-jwt');
    expect(response.body.user.email_usuario).toBe('usuario@example.com');
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
    const response = await request(app.server).post('/api/oracoes').send({
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

  it('deve criar pessoa', async () => {
    const response = await request(app.server).post('/api/pessoas').send({
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
    const response = await request(app.server).post('/api/fotos-ministerios').send({
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
