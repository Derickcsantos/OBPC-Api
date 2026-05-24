import { dashboardHtml } from './frontend/dashboard.js';
import { bibleApiExamples } from './docs/bible-api-examples.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ResourceConfig {
  table: string;
  idField: string;
  fields: string[];
}

const resources: Record<string, ResourceConfig> = {
  ministerios: {
    table: 'ministerios',
    idField: 'ministerio_id',
    fields: ['nome_ministerio', 'descricao_ministerio', 'url_ministerio'],
  },
  usuarios: {
    table: 'usuarios',
    idField: 'usuario_id',
    fields: ['nome_usuario', 'telefone_usuario', 'senha_usuario', 'email_usuario', 'data_nascimento'],
  },
  eventos: {
    table: 'eventos',
    idField: 'evento_id',
    fields: ['nome_evento', 'descricao_evento', 'data_evento', 'link_evento'],
  },
  noticias: {
    table: 'noticias',
    idField: 'noticia_id',
    fields: ['nome_noticia', 'mensagem_noticia', 'data_noticia', 'observacao_noticia'],
  },
  louvores: {
    table: 'louvores',
    idField: 'louvor_id',
    fields: ['nome_louvor', 'url_louvor', 'observacao_louvor'],
  },
  mensagens: {
    table: 'mensagens',
    idField: 'mensagem_id',
    fields: ['nome_mensagem', 'texto_mensagem'],
  },
  oracoes: {
    table: 'oracoes',
    idField: 'oracao_id',
    fields: ['nome_pedido', 'descricao_pedido', 'mostrar_grupo', 'aceita_ligacao', 'status'],
  },
};

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const defaultVersion = 'nvi';
const defaultLimit = 50;

const response = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {}),
    },
  });

const html = (body: string): Response =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&quot;?/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;?/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const sanitizeVerse = (verse: Record<string, unknown>): Record<string, unknown> => ({
  ...verse,
  text: typeof verse.text === 'string' ? decodeHtmlEntities(verse.text) : verse.text,
});

const getPage = (params: URLSearchParams): { page: number; limit: number; offset: number } => {
  const page = Math.max(Number(params.get('page') ?? 1), 1);
  const limit = Math.min(Math.max(Number(params.get('limit') ?? defaultLimit), 1), 100);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const paginate = <T>(data: T[], total: number, page: number, limit: number): { data: T[]; pagination: Record<string, unknown> } => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const sanitizeResource = (resource: string, item: Record<string, unknown>): Record<string, unknown> => {
  if (resource !== 'usuarios') {
    return item;
  }

  const { senha_usuario, ...rest } = item;
  void senha_usuario;
  return rest;
};

const restHeaders = (env: Env): HeadersInit => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

const supabaseFetch = async (env: Env, path: string, init?: RequestInit): Promise<unknown> => {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...restHeaders(env),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    return response({ message: 'Erro ao acessar Supabase', details: data }, { status: res.status });
  }

  return data;
};

const parseBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return body && typeof body === 'object' ? body : {};
};

const onlyAllowedFields = (payload: Record<string, unknown>, fields: string[]): Record<string, unknown> =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => fields.includes(key) && value !== ''));

const handleCrud = async (
  request: Request,
  env: Env,
  resourceName: string,
  id?: string,
): Promise<Response> => {
  const config = resources[resourceName];

  if (!config) {
    return response({ message: 'Rota nao encontrada' }, { status: 404 });
  }

  const select = 'select=*';

  if (request.method === 'GET' && !id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&order=created_at.desc`);
    if (data instanceof Response) return data;
    return response({ data: (data as Record<string, unknown>[]).map((item) => sanitizeResource(resourceName, item)) });
  }

  if (request.method === 'GET' && id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`);
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return item ? response({ data: sanitizeResource(resourceName, item) }) : response({ message: 'Registro nao encontrado' }, { status: 404 });
  }

  if (request.method === 'POST') {
    const payload = onlyAllowedFields(await parseBody(request), config.fields);
    const data = await supabaseFetch(env, `${config.table}?${select}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return response({ message: `${resourceName} criado com sucesso`, data: sanitizeResource(resourceName, item) }, { status: 201 });
  }

  if (request.method === 'PUT' && id) {
    const payload = onlyAllowedFields(await parseBody(request), config.fields);
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return item ? response({ message: `${resourceName} atualizado com sucesso`, data: sanitizeResource(resourceName, item) }) : response({ message: 'Registro nao encontrado' }, { status: 404 });
  }

  if (request.method === 'DELETE' && id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return item ? response({ message: `${resourceName} removido com sucesso`, data: sanitizeResource(resourceName, item) }) : response({ message: 'Registro nao encontrado' }, { status: 404 });
  }

  return response({ message: 'Metodo nao permitido' }, { status: 405 });
};

const getBible = async (env: Env, table: string, params: URLSearchParams): Promise<Response> => {
  const query = new URLSearchParams({ select: '*' });

  if (table === 'books') {
    query.set('order', 'id.asc');
    const testament = params.get('testament_id') ?? params.get('testament');
    if (testament) query.set('testament', `eq.${testament}`);
  }

  if (table === 'testaments') {
    query.set('order', 'id.asc');
  }

  const data = await supabaseFetch(env, `${table}?${query.toString()}`);
  if (data instanceof Response) return data;
  return response({ data });
};

const getChapters = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const { page, limit, offset } = getPage(params);
  const query = new URLSearchParams({
    select: 'version,testament,book,chapter',
    version: `eq.${params.get('version') ?? defaultVersion}`,
    order: 'book.asc,chapter.asc',
  });

  if (params.get('book_id')) query.set('book', `eq.${params.get('book_id')}`);

  const data = await supabaseFetch(env, `verses?${query.toString()}`);
  if (data instanceof Response) return data;

  const chapters = new Map<string, Record<string, unknown>>();
  for (const row of data as Record<string, unknown>[]) {
    chapters.set(`${row.version}:${row.book}:${row.chapter}`, row);
  }

  const allChapters = [...chapters.values()];
  return response(paginate(allChapters.slice(offset, offset + limit), allChapters.length, page, limit));
};

const getVerses = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const keyword = params.get('keyword') ?? params.get('q') ?? params.get('text');
  const { page, limit, offset } = getPage(params);
  const query = new URLSearchParams({
    select: '*',
    version: `eq.${params.get('version') ?? defaultVersion}`,
    order: 'book.asc,chapter.asc,verse.asc',
    limit: String(limit),
    offset: String(offset),
  });

  if (params.get('book_id')) query.set('book', `eq.${params.get('book_id')}`);
  if (params.get('chapter_id')) query.set('chapter', `eq.${params.get('chapter_id')}`);
  if (params.get('verse')) query.set('verse', `eq.${params.get('verse')}`);
  if (params.get('verse_start')) query.set('verse', `gte.${params.get('verse_start')}`);
  if (params.get('verse_end')) query.append('verse', `lte.${params.get('verse_end')}`);
  if (keyword) query.set('text', `ilike.*${keyword}*`);

  const countQuery = new URLSearchParams(query);
  countQuery.set('select', 'id');
  countQuery.delete('limit');
  countQuery.delete('offset');

  const countData = await supabaseFetch(env, `verses?${countQuery.toString()}`);
  if (countData instanceof Response) return countData;

  const data = await supabaseFetch(env, `verses?${query.toString()}`);
  if (data instanceof Response) return data;

  const rows = (data as Record<string, unknown>[]).map(sanitizeVerse);
  const total = (countData as Record<string, unknown>[]).length;

  return response(paginate(rows, total, page, limit));
};

const handleBible = async (env: Env, pathname: string, params: URLSearchParams): Promise<Response> => {
  if (pathname === '/api/biblia/examples') return response({ data: bibleApiExamples });
  if (pathname === '/api/biblia/testaments') return getBible(env, 'testaments', params);
  const bookVersesMatch = pathname.match(/^\/api\/biblia\/books\/(\d+)\/verses$/);
  if (bookVersesMatch) {
    params.set('book_id', bookVersesMatch[1]);
    return getVerses(env, params);
  }
  if (pathname === '/api/biblia/books') return getBible(env, 'books', params);
  if (pathname === '/api/biblia/chapters') return getChapters(env, params);
  if (pathname === '/api/biblia/verses' || pathname === '/api/biblia/search') return getVerses(env, params);
  if (pathname === '/api/biblia/versions') return response({ data: [{ id: 'nvi', name: 'NVI' }] });

  return response({ message: 'Rota nao encontrada' }, { status: 404 });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/') return html(dashboardHtml);
    if (url.pathname === '/health') return response({ status: 'ok' });
    if (url.pathname.startsWith('/api/biblia')) return handleBible(env, url.pathname, url.searchParams);
    if (parts[0] === 'api' && parts[1]) return handleCrud(request, env, parts[1], parts[2]);

    return response({ message: 'Rota nao encontrada' }, { status: 404 });
  },
};
