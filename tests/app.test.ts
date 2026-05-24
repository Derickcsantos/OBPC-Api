import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { BibleServiceContract, CrudServiceContract } from '../src/types/crud.types.js';
import { FakeCrudService } from './helpers/fake-crud.service.js';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.BIBLE_API_KEY = 'test-bible-key';

const bibleStub: BibleServiceContract = {
  getTestaments: async () => [{ id: 1, name: 'Antigo Testamento' }],
  getVersions: async () => [{ id: 1, name: 'ACF' }],
  getBooks: async () => [{ id: 1, name: 'Gênesis' }],
  getChapters: async () => [{ chapter_id: 1 }],
  getBookVerses: async () => [{ verse_id: 1, text: 'No princípio...' }],
  getVerses: async () => ({ verses: [{ verse_id: 1, text: 'No princípio...' }] }),
  searchExactWords: async () => ({ verses: [{ verse_id: 1, text: 'Deus criou' }] }),
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
      },
      bibleService: bibleStub,
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
});
