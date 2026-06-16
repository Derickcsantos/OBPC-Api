import { dashboardHtml } from './frontend/dashboard.js';
import { bibleApiExamples } from './docs/bible-api-examples.js';
import { eventsApiExamples } from './docs/events-api-examples.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_STORAGE_BUCKET?: string;
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
    fields: [
      'nome_evento',
      'descricao_evento',
      'data_evento',
      'link_evento',
      'url_capa',
      'numero_vagas',
      'endereco_evento',
      'hora_inicio',
      'observacao_evento',
      'responsavel_nome',
      'responsavel_telefone',
    ],
  },
  eventos_imagens: {
    table: 'eventos_imagens',
    idField: 'imagem_id',
    fields: ['evento_id', 'url_imagem', 'ordem'],
  },
  eventos_inscricoes: {
    table: 'eventos_inscricoes',
    idField: 'inscricao_id',
    fields: ['evento_id', 'nome', 'email', 'telefone', 'status'],
  },
  noticias: {
    table: 'noticias',
    idField: 'noticia_id',
    fields: ['nome_noticia', 'mensagem_noticia', 'data_noticia', 'url_capa', 'observacao_noticia'],
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
const defaultLimit = 100;
const defaultBucket = 'imagens';
const storageBucketCache = new Set<string>();

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

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const safeFileName = (fileName: string): string =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const base64ToBytes = (value: string): Uint8Array => {
  const clean = value.includes(',') ? value.split(',').pop() ?? '' : value;
  return Uint8Array.from(atob(clean), (char) => char.charCodeAt(0));
};

const randomId = (): string => crypto.randomUUID();

const getStorageBucket = (env: Env): string => env.SUPABASE_STORAGE_BUCKET ?? defaultBucket;

const storageHeaders = (env: Env, contentType = 'application/json'): HeadersInit => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': contentType,
});

const publicStorageUrl = (env: Env, bucket: string, key: string): string =>
  `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodeObjectKey(key)}`;

const ensurePublicBucket = async (env: Env, bucket: string): Promise<Response | null> => {
  if (storageBucketCache.has(bucket)) {
    return null;
  }

  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const getBucket = await fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    headers: storageHeaders(env),
  });

  if (getBucket.ok) {
    const bucketData = await getBucket.json() as { public?: boolean };

    if (bucketData.public) {
      storageBucketCache.add(bucket);
      return null;
    }

    const updateBucket = await fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
      method: 'PUT',
      headers: storageHeaders(env),
      body: JSON.stringify({
        public: true,
        allowed_mime_types: ['image/*'],
        file_size_limit: 10485760,
      }),
    });

    if (!updateBucket.ok) {
      return response({ message: 'Erro ao tornar bucket publico no Supabase Storage', details: await updateBucket.text() }, { status: 500 });
    }

    storageBucketCache.add(bucket);
    return null;
  }

  if (getBucket.status !== 404) {
    return response({ message: 'Erro ao validar bucket no Supabase Storage', details: await getBucket.text() }, { status: 500 });
  }

  const createBucket = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: storageHeaders(env),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      allowed_mime_types: ['image/*'],
      file_size_limit: 10485760,
    }),
  });

  if (!createBucket.ok && createBucket.status !== 409) {
    return response({ message: 'Erro ao criar bucket publico no Supabase Storage', details: await createBucket.text() }, { status: 500 });
  }

  storageBucketCache.add(bucket);
  return null;
};

const uploadImage = async (
  env: Env,
  input: { fileName: string; contentType?: string; base64: string; folder?: string },
): Promise<{ key: string; url: string } | Response> => {
  const bucket = getStorageBucket(env);
  const bucketError = await ensurePublicBucket(env, bucket);
  if (bucketError) return bucketError;

  const bytes = base64ToBytes(input.base64);
  const folder = input.folder?.replace(/^\/+|\/+$/g, '') || 'uploads';
  const contentType = input.contentType ?? 'application/octet-stream';
  const extension = contentType === 'image/webp' ? 'webp' : safeFileName(input.fileName).split('.').pop();
  const fileName = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'imagem';
  const key = `${folder}/${randomId()}-${fileName}.${extension || 'webp'}`;
  const uploadUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${bucket}/${encodeObjectKey(key)}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...storageHeaders(env, contentType),
      'Cache-Control': '31536000',
      'x-upsert': 'false',
    },
    body: toArrayBuffer(bytes),
  });

  if (!uploadResponse.ok) {
    return response({ message: 'Erro ao enviar imagem para o Supabase Storage', details: await uploadResponse.text() }, { status: 500 });
  }

  return {
    key,
    url: publicStorageUrl(env, bucket, key),
  };
};

const encodeObjectKey = (key: string): string => key.split('/').map(encodeURIComponent).join('/');

const toProxyUrl = (env: Env, request: Request, value: unknown): unknown => {
  if (typeof value !== 'string' || value.includes('/storage/v1/object/public/')) {
    return value;
  }

  return value;
};

const normalizeStorageUrls = (env: Env, request: Request, record: Record<string, unknown>): Record<string, unknown> => ({
  ...record,
  url_capa: toProxyUrl(env, request, record.url_capa),
  url_imagem: toProxyUrl(env, request, record.url_imagem),
  imagens: Array.isArray(record.imagens)
    ? record.imagens.map((image) => normalizeStorageUrls(env, request, image as Record<string, unknown>))
    : record.imagens,
});

const getObject = async (env: Env, key: string): Promise<Response> => {
  const bucket = getStorageBucket(env);
  const objectResponse = await fetch(publicStorageUrl(env, bucket, key.replace(/^\/+/, '')));

  if (!objectResponse.ok) {
    return response({ message: 'Erro ao buscar arquivo no Supabase Storage' }, { status: objectResponse.status });
  }

  return new Response(objectResponse.body, {
    headers: {
      'Content-Type': objectResponse.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': objectResponse.headers.get('cache-control') ?? 'public, max-age=3600',
    },
  });
};

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

const parseContentRangeTotal = (value: string | null, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const total = value.split('/')[1];
  const parsed = Number(total);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const supabaseFetchWithCount = async (
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<{ data: Record<string, unknown>[]; total: number } | Response> => {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...restHeaders(env),
      Prefer: 'count=exact',
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>[]) : [];

  if (!res.ok) {
    return response({ message: 'Erro ao acessar Supabase', details: data }, { status: res.status });
  }

  return {
    data,
    total: parseContentRangeTotal(res.headers.get('content-range'), data.length),
  };
};

const parseBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return body && typeof body === 'object' ? body : {};
};

const onlyAllowedFields = (payload: Record<string, unknown>, fields: string[]): Record<string, unknown> =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => fields.includes(key) && value !== ''));

const attachEventImages = async (
  env: Env,
  resourceName: string,
  items: Record<string, unknown>[],
): Promise<Record<string, unknown>[] | Response> => {
  if (resourceName !== 'eventos' || items.length === 0) {
    return items;
  }

  const eventIds = items.map((item) => encodeURIComponent(String(item.evento_id))).filter(Boolean).join(',');
  if (!eventIds) {
    return items.map((item) => ({ ...item, imagens: [] }));
  }

  const images = await supabaseFetch(
    env,
    `eventos_imagens?select=*&evento_id=in.(${eventIds})&order=ordem.asc,created_at.asc`,
  );
  if (images instanceof Response) return images;

  const imagesByEvent = (images as Record<string, unknown>[]).reduce<Record<string, Record<string, unknown>[]>>((acc, image) => {
    const eventId = String(image.evento_id);
    acc[eventId] = acc[eventId] ?? [];
    acc[eventId].push(image);
    return acc;
  }, {});

  return items.map((item) => ({
    ...item,
    imagens: imagesByEvent[String(item.evento_id)] ?? [],
  }));
};

const handleCrud = async (
  request: Request,
  env: Env,
  resourceName: string,
  id?: string,
): Promise<Response> => {
  const normalizedResourceName = resourceName.replace(/-/g, '_');
  const config = resources[normalizedResourceName];

  if (!config) {
    return response({ message: 'Rota nao encontrada' }, { status: 404 });
  }

  const select = 'select=*';

  if (request.method === 'GET' && !id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&order=created_at.desc`);
    if (data instanceof Response) return data;
    const items = await attachEventImages(env, normalizedResourceName, data as Record<string, unknown>[]);
    if (items instanceof Response) return items;
    return response({
      data: items.map((item) => sanitizeResource(normalizedResourceName, normalizeStorageUrls(env, request, item))),
    });
  }

  if (request.method === 'GET' && id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`);
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    if (!item) return response({ message: 'Registro nao encontrado' }, { status: 404 });
    const items = await attachEventImages(env, normalizedResourceName, [item]);
    if (items instanceof Response) return items;
    return response({ data: sanitizeResource(normalizedResourceName, normalizeStorageUrls(env, request, items[0])) });
  }

  if (request.method === 'POST') {
    const payload = onlyAllowedFields(await parseBody(request), config.fields);
    const data = await supabaseFetch(env, `${config.table}?${select}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return response({ message: `${normalizedResourceName} criado com sucesso`, data: sanitizeResource(normalizedResourceName, item) }, { status: 201 });
  }

  if (request.method === 'PUT' && id) {
    const payload = onlyAllowedFields(await parseBody(request), config.fields);
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return item ? response({ message: `${normalizedResourceName} atualizado com sucesso`, data: sanitizeResource(normalizedResourceName, item) }) : response({ message: 'Registro nao encontrado' }, { status: 404 });
  }

  if (request.method === 'DELETE' && id) {
    const data = await supabaseFetch(env, `${config.table}?${select}&${config.idField}=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (data instanceof Response) return data;
    const item = (data as Record<string, unknown>[])[0];
    return item ? response({ message: `${normalizedResourceName} removido com sucesso`, data: sanitizeResource(normalizedResourceName, item) }) : response({ message: 'Registro nao encontrado' }, { status: 404 });
  }

  return response({ message: 'Metodo nao permitido' }, { status: 405 });
};

const handleEventRegistration = async (request: Request, env: Env, eventId: string): Promise<Response> => {
  if (request.method !== 'POST') {
    return response({ message: 'Metodo nao permitido' }, { status: 405 });
  }

  const payload = await parseBody(request);
  const data = await supabaseFetch(env, 'rpc/inscrever_evento', {
    method: 'POST',
    body: JSON.stringify({
      p_evento_id: eventId,
      p_nome: payload.nome,
      p_email: payload.email,
      p_telefone: payload.telefone,
    }),
  });

  if (data instanceof Response) return data;

  return response({ data }, { status: 201 });
};

const handleUploadRoutes = async (request: Request, env: Env, parts: string[]): Promise<Response | null> => {
  if (request.method === 'GET' && parts[1] === 'uploads' && parts[2] === 'object') {
    const key = decodeURIComponent(parts.slice(3).join('/'));
    return key ? getObject(env, key) : response({ message: 'Informe a chave do arquivo' }, { status: 400 });
  }

  if (request.method !== 'POST') {
    return null;
  }

  if (parts[1] === 'uploads') {
    const upload = await uploadImage(env, await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string });
    if (upload instanceof Response) return upload;
    return response({ data: upload }, { status: 201 });
  }

  if (parts[1] === 'eventos' && parts[2] && parts[3] === 'capa') {
    const body = await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string };
    const upload = await uploadImage(env, { ...body, folder: body.folder ?? `eventos/${parts[2]}/capa` });
    if (upload instanceof Response) return upload;

    const updated = await supabaseFetch(env, `eventos?select=*&evento_id=eq.${encodeURIComponent(parts[2])}`, {
      method: 'PATCH',
      body: JSON.stringify({ url_capa: upload.url }),
    });
    if (updated instanceof Response) return updated;

    return response({ data: { upload, evento: (updated as Record<string, unknown>[])[0] } }, { status: 201 });
  }

  if (parts[1] === 'noticias' && parts[2] && parts[3] === 'capa') {
    const body = await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string };
    const upload = await uploadImage(env, { ...body, folder: body.folder ?? `noticias/${parts[2]}/capa` });
    if (upload instanceof Response) return upload;

    const updated = await supabaseFetch(env, `noticias?select=*&noticia_id=eq.${encodeURIComponent(parts[2])}`, {
      method: 'PATCH',
      body: JSON.stringify({ url_capa: upload.url }),
    });
    if (updated instanceof Response) return updated;

    return response({ data: { upload, noticia: (updated as Record<string, unknown>[])[0] } }, { status: 201 });
  }

  if (parts[1] === 'eventos' && parts[2] && parts[3] === 'imagens') {
    const body = await parseBody(request) as {
      fileName: string;
      contentType?: string;
      base64: string;
      folder?: string;
      ordem?: number;
      files?: Array<{ fileName: string; contentType?: string; base64: string; folder?: string; ordem?: number }>;
    };
    const files = Array.isArray(body.files) && body.files.length > 0 ? body.files : [body];
    const rows = [];

    for (const [index, file] of files.entries()) {
      const upload = await uploadImage(env, { ...file, folder: file.folder ?? `eventos/${parts[2]}/imagens` });
      if (upload instanceof Response) return upload;

      rows.push({
        evento_id: parts[2],
        url_imagem: upload.url,
        ordem: file.ordem ?? index,
      });
    }

    const inserted = await supabaseFetch(env, 'eventos_imagens?select=*', {
      method: 'POST',
      body: JSON.stringify(rows),
    });
    if (inserted instanceof Response) return inserted;

    return response({ data: inserted }, { status: 201 });
  }

  return null;
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

const getBibleVersions = async (env: Env): Promise<Response> => {
  const query = new URLSearchParams({
    select: 'code,name,language,source_file,comparison_scope,total_books,total_chapters,total_verses,created_at,updated_at',
    order: 'code.asc',
  });
  const data = await supabaseFetch(env, `bible_versions?${query.toString()}`);
  if (data instanceof Response) return data;
  return response({
    data: (data as Record<string, unknown>[]).map((version) => ({
      id: version.code,
      ...version,
    })),
  });
};

const getChapters = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const { page, limit, offset } = getPage(params);
  const includeFullText = params.get('include_text') === 'true' || params.get('include_text') === '1' || params.get('include_verses') === 'true' || params.get('include_verses') === '1';
  const query = new URLSearchParams({
    select: includeFullText
      ? 'version,comparison_scope,testament,book,book_name,book_abbrev,chapter,verses,chapter_text'
      : 'version,comparison_scope,testament,book,book_name,book_abbrev,chapter',
    version: `eq.${params.get('version') ?? defaultVersion}`,
    order: 'book.asc,chapter.asc',
    limit: String(limit),
    offset: String(offset),
  });

  if (params.get('book_id')) query.set('book', `eq.${params.get('book_id')}`);

  const result = await supabaseFetchWithCount(env, `chapter_texts?${query.toString()}`);
  if (result instanceof Response) return result;

  const rows = includeFullText ? result.data.map(sanitizeChapter) : result.data;
  return response(paginate(rows, result.total, page, limit));
};

const sanitizeChapter = (chapter: Record<string, unknown>): Record<string, unknown> => ({
  ...chapter,
  chapter_text: typeof chapter.chapter_text === 'string' ? decodeHtmlEntities(chapter.chapter_text) : chapter.chapter_text,
  verses: Array.isArray(chapter.verses)
    ? chapter.verses.map((verse) => sanitizeVerse(verse as Record<string, unknown>))
    : chapter.verses,
});

const getChapter = async (env: Env, bookId: string, chapter: string, params: URLSearchParams): Promise<Response> => {
  const query = new URLSearchParams({
    select: 'version,comparison_scope,testament,book,book_name,book_abbrev,chapter,verses,chapter_text',
    version: `eq.${params.get('version') ?? defaultVersion}`,
    book: `eq.${bookId}`,
    chapter: `eq.${chapter}`,
    limit: '1',
  });

  const data = await supabaseFetch(env, `chapter_texts?${query.toString()}`);
  if (data instanceof Response) return data;
  const item = (data as Record<string, unknown>[])[0];

  return item
    ? response({ data: sanitizeChapter(item) })
    : response({ message: 'Capitulo da Biblia nao encontrado' }, { status: 404 });
};

const getVerses = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const keyword = params.get('keyword') ?? params.get('q') ?? params.get('text');
  const { page, limit, offset } = getPage(params);
  const query = new URLSearchParams({
    select: 'id,version,testament,book,book_name,book_abbrev,chapter,verse,text,global_order',
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

  const result = await supabaseFetchWithCount(env, `verses_normalized?${query.toString()}`);
  if (result instanceof Response) return result;

  const rows = result.data.map(sanitizeVerse);
  const total = result.total;

  return response(paginate(rows, total, page, limit));
};

const getVerseComparisons = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const versions = params.get('versions')?.split(',').map((version) => version.trim().toLowerCase()).filter(Boolean);
  const { page, limit, offset } = getPage(params);
  const query = new URLSearchParams({
    select: 'testament,book,book_name,book_abbrev,chapter,verse,texts_by_version',
    order: 'book.asc,chapter.asc,verse.asc',
    limit: String(limit),
    offset: String(offset),
  });

  if (params.get('book_id')) query.set('book', `eq.${params.get('book_id')}`);
  if (params.get('chapter_id')) query.set('chapter', `eq.${params.get('chapter_id')}`);
  if (params.get('verse')) query.set('verse', `eq.${params.get('verse')}`);
  if (params.get('verse_start')) query.set('verse', `gte.${params.get('verse_start')}`);
  if (params.get('verse_end')) query.append('verse', `lte.${params.get('verse_end')}`);

  const result = await supabaseFetchWithCount(env, `verses_comparisons?${query.toString()}`);
  if (result instanceof Response) return result;

  const rows = result.data.map((row) => {
    const texts = row.texts_by_version as Record<string, unknown> | undefined;
    return {
      ...row,
      texts_by_version: Object.fromEntries(
        Object.entries(texts ?? {})
          .filter(([version]) => !versions || versions.includes(version))
          .map(([version, text]) => [version, typeof text === 'string' ? decodeHtmlEntities(text) : text]),
      ),
    };
  });

  return response(paginate(rows, result.total, page, limit));
};

const handleBible = async (env: Env, pathname: string, params: URLSearchParams): Promise<Response> => {
  if (pathname === '/api/biblia/examples') return response({ data: bibleApiExamples });
  if (pathname === '/api/biblia/testaments') return getBible(env, 'testaments', params);
  const chapterMatch = pathname.match(/^\/api\/biblia\/books\/(\d+)\/chapters\/(\d+)$/);
  if (chapterMatch) return getChapter(env, chapterMatch[1], chapterMatch[2], params);
  const bookVersesMatch = pathname.match(/^\/api\/biblia\/books\/(\d+)\/verses$/);
  if (bookVersesMatch) {
    params.set('book_id', bookVersesMatch[1]);
    return getVerses(env, params);
  }
  if (pathname === '/api/biblia/books') return getBible(env, 'books', params);
  if (pathname === '/api/biblia/chapters') return getChapters(env, params);
  if (pathname === '/api/biblia/compare') return getVerseComparisons(env, params);
  if (pathname === '/api/biblia/verses' || pathname === '/api/biblia/search') return getVerses(env, params);
  if (pathname === '/api/biblia/versions') return getBibleVersions(env);

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
    if (url.pathname === '/api/eventos/examples') return response({ data: eventsApiExamples });
    const uploadResponse = await handleUploadRoutes(request, env, parts);
    if (uploadResponse) return uploadResponse;
    if (parts[0] === 'api' && parts[1] === 'eventos' && parts[2] && parts[3] === 'inscricoes') {
      return handleEventRegistration(request, env, parts[2]);
    }
    if (parts[0] === 'api' && parts[1]) return handleCrud(request, env, parts[1], parts[2]);

    return response({ message: 'Rota nao encontrada' }, { status: 404 });
  },
};
