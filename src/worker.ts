import { dashboardHtml } from './frontend/dashboard.js';
import { bibleApiExamples } from './docs/bible-api-examples.js';
import { eventsApiExamples } from './docs/events-api-examples.js';
import { studyPlansApiDocumentation } from './docs/study-plans-api-documentation.js';
import { signApiToken, verifyGoogleIdToken } from './services/google-token.service.js';
import { AppError } from './utils/app-error.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_STORAGE_BUCKET?: string;
  BACKEND_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_IDS?: string;
  GOOGLE_SECRET_KEY?: string;
  AUTH_JWT_SECRET?: string;
  AUTH_JWT_EXPIRES_IN_SECONDS?: string;
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
  fotos_ministerios: {
    table: 'fotos_ministerios',
    idField: 'foto_ministerio_id',
    fields: ['ministerio_id', 'url_imagem', 'ordem'],
  },
  pessoas: {
    table: 'pessoas',
    idField: 'pessoa_id',
    fields: ['url_imagem', 'nome', 'cargo', 'sobre', 'telefone', 'email'],
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
const storageBucket = 'imagens';
const maxImageSizeBytes = 10 * 1024 * 1024;
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
  const clean = (value.includes(',') ? value.split(',').pop() ?? '' : value).replace(/\s/g, '');
  return Uint8Array.from(atob(clean), (char) => char.charCodeAt(0));
};

const randomId = (): string => crypto.randomUUID();

const getStorageBucket = (_env: Env): string => storageBucket;

const sanitizeStorageFolder = (value?: string): string => {
  const segments = (value || 'uploads')
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => safeFileName(segment))
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  return segments.length > 0 ? segments.join('/') : 'uploads';
};

const imageExtensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const bytesToAscii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...bytes.slice(start, end));

const hasImageSignature = (bytes: Uint8Array, contentType: string): boolean => {
  if (contentType === 'image/png') {
    return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  }
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === 'image/webp') {
    return bytes.length >= 12 && bytesToAscii(bytes, 0, 4) === 'RIFF' && bytesToAscii(bytes, 8, 12) === 'WEBP';
  }
  if (contentType === 'image/gif') {
    const signature = bytesToAscii(bytes, 0, 6);
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  return false;
};

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

  const dataUrlMatch = input.base64?.match(/^data:([^;,]+);base64,(.+)$/s);
  const contentType = input.contentType ?? dataUrlMatch?.[1]?.toLowerCase();
  const extension = contentType ? imageExtensionByType[contentType] : undefined;
  if (!input.fileName || !input.base64 || !contentType || !extension) {
    return response({ message: 'Envie uma imagem PNG, JPEG, WebP ou GIF valida' }, { status: 400 });
  }
  if (dataUrlMatch && dataUrlMatch[1].toLowerCase() !== contentType) {
    return response({ message: 'O tipo da imagem nao corresponde ao conteudo enviado' }, { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(input.base64);
  } catch {
    return response({ message: 'Imagem base64 invalida' }, { status: 400 });
  }
  if (bytes.length === 0 || bytes.length > maxImageSizeBytes || !hasImageSignature(bytes, contentType)) {
    return response({ message: 'Imagem invalida ou maior que 10 MB' }, { status: 400 });
  }

  const folder = sanitizeStorageFolder(input.folder);
  const fileName = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'imagem';
  const key = `${folder}/${randomId()}-${fileName}.${extension}`;
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

const removeStorageObjects = async (env: Env, keys: string[]): Promise<void> => {
  const bucket = getStorageBucket(env);

  await Promise.all(keys.map(async (key) => {
    await fetch(
      `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${bucket}/${encodeObjectKey(key)}`,
      {
        method: 'DELETE',
        headers: storageHeaders(env),
      },
    );
  }));
};

const storageKeyFromPublicUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const marker = `/storage/v1/object/public/${storageBucket}/`;
  const index = value.indexOf(marker);
  if (index < 0) return null;

  try {
    return value
      .slice(index + marker.length)
      .split('?')[0]
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  } catch {
    return null;
  }
};

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
  fotos: Array.isArray(record.fotos)
    ? record.fotos.map((image) => normalizeStorageUrls(env, request, image as Record<string, unknown>))
    : record.fotos,
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

const parseResponseBody = (text: string): unknown => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const supabaseRestUrl = (env: Env, path: string): string | Response => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return response({
      message: 'Supabase nao configurado no Worker',
      details: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos secrets/vars do Cloudflare Worker.',
    }, { status: 500 });
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(env.SUPABASE_URL);
  } catch {
    return response({
      message: 'SUPABASE_URL invalida no Worker',
      details: 'Use a URL completa do projeto Supabase, por exemplo https://<project-ref>.supabase.co.',
    }, { status: 500 });
  }

  if (!baseUrl.hostname.endsWith('.supabase.co')) {
    return response({
      message: 'SUPABASE_URL parece incorreta',
      details: {
        hostname: baseUrl.hostname,
        expected: 'https://<project-ref>.supabase.co',
      },
    }, { status: 500 });
  }

  return `${baseUrl.origin}/rest/v1/${path}`;
};

const supabaseFetch = async (env: Env, path: string, init?: RequestInit): Promise<unknown> => {
  const url = supabaseRestUrl(env, path);
  if (url instanceof Response) return url;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...restHeaders(env),
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    return response({
      message: 'Erro de rede ao acessar Supabase',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }

  const text = await res.text();
  const data = parseResponseBody(text);

  if (!res.ok) {
    return response({
      message: 'Erro ao acessar Supabase',
      details: data,
      status: res.status,
    }, { status: res.status === 530 || res.status === 522 || res.status === 523 ? 502 : res.status });
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
  const url = supabaseRestUrl(env, path);
  if (url instanceof Response) return url;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...restHeaders(env),
        Prefer: 'count=exact',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    return response({
      message: 'Erro de rede ao acessar Supabase',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }

  const text = await res.text();
  const parsed = parseResponseBody(text);

  if (!res.ok) {
    return response({
      message: 'Erro ao acessar Supabase',
      details: parsed,
      status: res.status,
    }, { status: res.status === 530 || res.status === 522 || res.status === 523 ? 502 : res.status });
  }

  if (!Array.isArray(parsed)) {
    return response({
      message: 'Resposta inesperada do Supabase',
      details: parsed,
    }, { status: 502 });
  }

  return {
    data: parsed as Record<string, unknown>[],
    total: parseContentRangeTotal(res.headers.get('content-range'), parsed.length),
  };
};

const parseBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return body && typeof body === 'object' ? body : {};
};

const authUserColumns = [
  'usuario_id',
  'nome_usuario',
  'email_usuario',
  'telefone_usuario',
  'data_nascimento',
  'avatar_url',
  'auth_provider',
].join(',');

const handleGoogleLogin = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') {
    return response({ message: 'Metodo nao permitido' }, { status: 405 });
  }

  try {
    const body = await parseBody(request);
    if (typeof body.id_token !== 'string' || !body.id_token) {
      return response({ message: 'O id_token do Google e obrigatorio.' }, { status: 400 });
    }

    const googleClientIds = [
      ...(env.GOOGLE_CLIENT_IDS?.split(',') ?? []),
      env.GOOGLE_CLIENT_ID,
    ].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim());
    const jwtSecret = env.AUTH_JWT_SECRET ?? env.GOOGLE_SECRET_KEY;
    if (googleClientIds.length === 0 || !jwtSecret || jwtSecret.length < 32) {
      return response({ message: 'Autenticacao Google nao configurada no servidor.' }, { status: 500 });
    }

    const identity = await verifyGoogleIdToken(body.id_token, googleClientIds);
    const bySub = await supabaseFetch(
      env,
      `usuarios?select=${authUserColumns}&google_sub=eq.${encodeURIComponent(identity.sub)}&limit=1`,
    );
    if (bySub instanceof Response) return bySub;

    let user = (bySub as Record<string, unknown>[])[0];
    if (!user) {
      const byEmail = await supabaseFetch(
        env,
        `usuarios?select=${authUserColumns}&email_usuario=eq.${encodeURIComponent(identity.email)}&limit=1`,
      );
      if (byEmail instanceof Response) return byEmail;
      user = (byEmail as Record<string, unknown>[])[0];

      if (user) {
        const linked = await supabaseFetch(
          env,
          `usuarios?usuario_id=eq.${encodeURIComponent(String(user.usuario_id))}&select=${authUserColumns}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              google_sub: identity.sub,
              avatar_url: identity.picture ?? null,
              updated_at: new Date().toISOString(),
            }),
          },
        );
        if (linked instanceof Response) return linked;
        user = (linked as Record<string, unknown>[])[0];
      } else {
        const created = await supabaseFetch(env, `usuarios?select=${authUserColumns}`, {
          method: 'POST',
          body: JSON.stringify({
            nome_usuario: identity.name,
            email_usuario: identity.email,
            google_sub: identity.sub,
            avatar_url: identity.picture ?? null,
            auth_provider: 'google',
          }),
        });
        if (created instanceof Response) return created;
        user = (created as Record<string, unknown>[])[0];
      }
    }

    if (!user) {
      return response({ message: 'Nao foi possivel autenticar o usuario.' }, { status: 500 });
    }

    const expiresIn = Number(env.AUTH_JWT_EXPIRES_IN_SECONDS ?? 604800);
    const accessToken = await signApiToken(
      {
        sub: user.usuario_id,
        email: user.email_usuario,
        provider: 'google',
      },
      jwtSecret,
      expiresIn,
      env.BACKEND_URL ?? 'books-api',
    );

    return response({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return response({ message: error.message }, { status: error.statusCode });
    }
    return response({ message: 'Erro interno do servidor' }, { status: 500 });
  }
};

const onlyAllowedFields = (payload: Record<string, unknown>, fields: string[]): Record<string, unknown> =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => fields.includes(key) && value !== ''));

const attachRelatedImages = async (
  env: Env,
  resourceName: string,
  items: Record<string, unknown>[],
): Promise<Record<string, unknown>[] | Response> => {
  if (items.length === 0) {
    return items;
  }

  const relation = resourceName === 'eventos'
    ? { table: 'eventos_imagens', foreignKey: 'evento_id', idField: 'evento_id', outputKey: 'imagens' }
    : resourceName === 'ministerios'
      ? { table: 'fotos_ministerios', foreignKey: 'ministerio_id', idField: 'ministerio_id', outputKey: 'fotos' }
      : null;

  if (!relation) {
    return items;
  }

  const ids = items.map((item) => encodeURIComponent(String(item[relation.idField]))).filter(Boolean).join(',');
  if (!ids) {
    return items.map((item) => ({ ...item, [relation.outputKey]: [] }));
  }

  const images = await supabaseFetch(
    env,
    `${relation.table}?select=*&${relation.foreignKey}=in.(${ids})&order=ordem.asc,created_at.asc`,
  );
  if (images instanceof Response) return images;

  const imagesByRecord = (images as Record<string, unknown>[]).reduce<Record<string, Record<string, unknown>[]>>((acc, image) => {
    const recordId = String(image[relation.foreignKey]);
    acc[recordId] = acc[recordId] ?? [];
    acc[recordId].push(image);
    return acc;
  }, {});

  return items.map((item) => ({
    ...item,
    [relation.outputKey]: imagesByRecord[String(item[relation.idField])] ?? [],
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
    const items = await attachRelatedImages(env, normalizedResourceName, data as Record<string, unknown>[]);
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
    const items = await attachRelatedImages(env, normalizedResourceName, [item]);
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
    const existing = await supabaseFetch(
      env,
      `eventos?select=evento_id,url_capa&evento_id=eq.${encodeURIComponent(parts[2])}&limit=1`,
    );
    if (existing instanceof Response) return existing;
    const currentEvent = (existing as Record<string, unknown>[])[0];
    if (!currentEvent) return response({ message: 'Evento nao encontrado' }, { status: 404 });

    const body = await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string };
    const upload = await uploadImage(env, { ...body, folder: body.folder ?? `eventos/${parts[2]}/capa` });
    if (upload instanceof Response) return upload;

    const updated = await supabaseFetch(env, `eventos?select=*&evento_id=eq.${encodeURIComponent(parts[2])}`, {
      method: 'PATCH',
      body: JSON.stringify({ url_capa: upload.url }),
    });
    if (updated instanceof Response) {
      await removeStorageObjects(env, [upload.key]);
      return updated;
    }

    const previousKey = storageKeyFromPublicUrl(currentEvent.url_capa);
    if (previousKey && previousKey !== upload.key) await removeStorageObjects(env, [previousKey]);

    return response({ data: { upload, evento: (updated as Record<string, unknown>[])[0] } }, { status: 201 });
  }

  if (parts[1] === 'noticias' && parts[2] && parts[3] === 'capa') {
    const existing = await supabaseFetch(
      env,
      `noticias?select=noticia_id,url_capa&noticia_id=eq.${encodeURIComponent(parts[2])}&limit=1`,
    );
    if (existing instanceof Response) return existing;
    const currentNews = (existing as Record<string, unknown>[])[0];
    if (!currentNews) return response({ message: 'Noticia nao encontrada' }, { status: 404 });

    const body = await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string };
    const upload = await uploadImage(env, { ...body, folder: body.folder ?? `noticias/${parts[2]}/capa` });
    if (upload instanceof Response) return upload;

    const updated = await supabaseFetch(env, `noticias?select=*&noticia_id=eq.${encodeURIComponent(parts[2])}`, {
      method: 'PATCH',
      body: JSON.stringify({ url_capa: upload.url }),
    });
    if (updated instanceof Response) {
      await removeStorageObjects(env, [upload.key]);
      return updated;
    }

    const previousKey = storageKeyFromPublicUrl(currentNews.url_capa);
    if (previousKey && previousKey !== upload.key) await removeStorageObjects(env, [previousKey]);

    return response({ data: { upload, noticia: (updated as Record<string, unknown>[])[0] } }, { status: 201 });
  }

  if (parts[1] === 'eventos' && parts[2] && parts[3] === 'imagens') {
    const existing = await supabaseFetch(
      env,
      `eventos?select=evento_id&evento_id=eq.${encodeURIComponent(parts[2])}&limit=1`,
    );
    if (existing instanceof Response) return existing;
    if (!(existing as Record<string, unknown>[])[0]) {
      return response({ message: 'Evento nao encontrado' }, { status: 404 });
    }

    const body = await parseBody(request) as {
      fileName: string;
      contentType?: string;
      base64: string;
      folder?: string;
      ordem?: number;
      files?: Array<{ fileName: string; contentType?: string; base64: string; folder?: string; ordem?: number }>;
    };
    const files = Array.isArray(body.files) && body.files.length > 0 ? body.files : [body];
    const uploads: Array<{ key: string; url: string }> = [];

    for (const file of files) {
      const upload = await uploadImage(env, { ...file, folder: file.folder ?? `eventos/${parts[2]}/imagens` });
      if (upload instanceof Response) {
        await removeStorageObjects(env, uploads.map((item) => item.key));
        return upload;
      }
      uploads.push(upload);
    }

    const inserted = await supabaseFetch(env, 'eventos_imagens?select=*', {
      method: 'POST',
      body: JSON.stringify(uploads.map((upload, index) => ({
        evento_id: parts[2],
        url_imagem: upload.url,
        ordem: files[index].ordem ?? index,
      }))),
    });
    if (inserted instanceof Response) {
      await removeStorageObjects(env, uploads.map((item) => item.key));
      return inserted;
    }

    return response({ data: inserted }, { status: 201 });
  }

  if (parts[1] === 'ministerios' && parts[2] && parts[3] === 'fotos') {
    const existing = await supabaseFetch(
      env,
      `ministerios?select=ministerio_id&ministerio_id=eq.${encodeURIComponent(parts[2])}&limit=1`,
    );
    if (existing instanceof Response) return existing;
    if (!(existing as Record<string, unknown>[])[0]) {
      return response({ message: 'Ministerio nao encontrado' }, { status: 404 });
    }

    const body = await parseBody(request) as {
      fileName: string;
      contentType?: string;
      base64: string;
      folder?: string;
      ordem?: number;
      files?: Array<{ fileName: string; contentType?: string; base64: string; folder?: string; ordem?: number }>;
    };
    const files = Array.isArray(body.files) && body.files.length > 0 ? body.files : [body];
    const uploads: Array<{ key: string; url: string }> = [];

    for (const file of files) {
      const upload = await uploadImage(env, {
        ...file,
        folder: file.folder ?? `ministerios/${parts[2]}/fotos`,
      });
      if (upload instanceof Response) {
        await removeStorageObjects(env, uploads.map((item) => item.key));
        return upload;
      }
      uploads.push(upload);
    }

    const inserted = await supabaseFetch(env, 'fotos_ministerios?select=*', {
      method: 'POST',
      body: JSON.stringify(uploads.map((upload, index) => ({
        ministerio_id: parts[2],
        url_imagem: upload.url,
        ordem: files[index].ordem ?? index,
      }))),
    });
    if (inserted instanceof Response) {
      await removeStorageObjects(env, uploads.map((item) => item.key));
      return inserted;
    }

    return response({ data: inserted }, { status: 201 });
  }

  if (parts[1] === 'pessoas' && parts[2] === 'com-imagem' && !parts[3]) {
    const body = await parseBody(request) as {
      nome: string;
      cargo: string;
      sobre: string;
      telefone?: string;
      email?: string;
      imagem: { fileName: string; contentType?: string; base64: string; folder?: string };
    };
    const upload = await uploadImage(env, {
      ...body.imagem,
      folder: body.imagem?.folder ?? 'pessoas',
    });
    if (upload instanceof Response) return upload;

    const inserted = await supabaseFetch(env, 'pessoas?select=*', {
      method: 'POST',
      body: JSON.stringify({
        nome: body.nome,
        cargo: body.cargo,
        sobre: body.sobre,
        telefone: body.telefone,
        email: body.email,
        url_imagem: upload.url,
      }),
    });
    if (inserted instanceof Response) {
      await removeStorageObjects(env, [upload.key]);
      return inserted;
    }

    return response({
      message: 'pessoas criado com sucesso',
      data: (inserted as Record<string, unknown>[])[0],
    }, { status: 201 });
  }

  if (parts[1] === 'pessoas' && parts[2] && parts[3] === 'imagem') {
    const existing = await supabaseFetch(
      env,
      `pessoas?select=pessoa_id,url_imagem&pessoa_id=eq.${encodeURIComponent(parts[2])}&limit=1`,
    );
    if (existing instanceof Response) return existing;
    const currentPerson = (existing as Record<string, unknown>[])[0];
    if (!currentPerson) {
      return response({ message: 'Pessoa nao encontrada' }, { status: 404 });
    }

    const body = await parseBody(request) as { fileName: string; contentType?: string; base64: string; folder?: string };
    const upload = await uploadImage(env, {
      ...body,
      folder: body.folder ?? `pessoas/${parts[2]}`,
    });
    if (upload instanceof Response) return upload;

    const updated = await supabaseFetch(
      env,
      `pessoas?select=*&pessoa_id=eq.${encodeURIComponent(parts[2])}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ url_imagem: upload.url }),
      },
    );
    if (updated instanceof Response) {
      await removeStorageObjects(env, [upload.key]);
      return updated;
    }

    const previousKey = storageKeyFromPublicUrl(currentPerson.url_imagem);
    if (previousKey && previousKey !== upload.key) await removeStorageObjects(env, [previousKey]);

    return response({
      data: {
        upload,
        pessoa: (updated as Record<string, unknown>[])[0],
      },
    }, { status: 201 });
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

const sanitizeSearchPattern = (value: string): string => value.replace(/[,%*()]/g, ' ').trim();

const getBibleBooksSearch = async (env: Env, params: URLSearchParams): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> } | Response> => {
  const keyword = sanitizeSearchPattern(params.get('keyword') ?? params.get('q') ?? params.get('text') ?? '');
  const { page, limit, offset } = getPage(params);
  const query = new URLSearchParams({
    select: 'id,name,abbrev,testament',
    order: 'id.asc',
    limit: String(limit),
    offset: String(offset),
  });

  const testament = params.get('testament_id') ?? params.get('testament');
  if (testament) query.set('testament', `eq.${testament}`);
  if (keyword) query.set('or', `(name.ilike.*${keyword}*,abbrev.ilike.*${keyword}*)`);

  const result = await supabaseFetchWithCount(env, `books?${query.toString()}`);
  if (result instanceof Response) return result;

  return paginate(result.data, result.total, page, limit);
};

const getBibleSearch = async (env: Env, params: URLSearchParams): Promise<Response> => {
  const scope = params.get('scope') ?? 'all';

  if (scope === 'books') {
    const books = await getBibleBooksSearch(env, params);
    return books instanceof Response ? books : response({
      ...books,
      meta: {
        scope,
        keyword: params.get('keyword') ?? params.get('q') ?? params.get('text'),
        version: params.get('version') ?? defaultVersion,
      },
    });
  }

  const versesResponse = await getVerses(env, params);
  if (scope === 'verses') return versesResponse;

  const books = await getBibleBooksSearch(env, params);
  if (books instanceof Response) return books;

  const verses = await versesResponse.json() as Record<string, unknown>;
  return response({
    ...verses,
    books: books.data,
    books_pagination: books.pagination,
    meta: {
      scope,
      keyword: params.get('keyword') ?? params.get('q') ?? params.get('text'),
      version: params.get('version') ?? defaultVersion,
    },
  });
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

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);

const getStudyPlan = async (env: Env, plan: string): Promise<Record<string, unknown> | Response> => {
  const query = new URLSearchParams({
    select: 'plano_estudo_id,titulo,slug,descricao,tipo,duracao_dias,ativo,metadata,created_at,updated_at',
    limit: '1',
  });
  query.set(isUuid(plan) ? 'plano_estudo_id' : 'slug', `eq.${plan}`);

  const data = await supabaseFetch(env, `planos_estudo?${query.toString()}`);
  if (data instanceof Response) return data;

  const item = (data as Record<string, unknown>[])[0];
  return item ?? response({ message: 'Plano de estudo nao encontrado' }, { status: 404 });
};

const getStudyPlanDays = async (env: Env, planId: unknown): Promise<Record<string, unknown>[] | Response> => {
  const query = new URLSearchParams({
    select: 'plano_estudo_dia_id,plano_estudo_id,dia,titulo,created_at,updated_at',
    plano_estudo_id: `eq.${String(planId)}`,
    order: 'dia.asc',
  });

  const data = await supabaseFetch(env, `planos_estudo_dias?${query.toString()}`);
  if (data instanceof Response) return data;
  return data as Record<string, unknown>[];
};

const getStudyPlanDay = async (env: Env, planId: unknown, day: string): Promise<Record<string, unknown> | Response> => {
  const query = new URLSearchParams({
    select: 'plano_estudo_dia_id,plano_estudo_id,dia,titulo,created_at,updated_at',
    plano_estudo_id: `eq.${String(planId)}`,
    dia: `eq.${day}`,
    limit: '1',
  });

  const data = await supabaseFetch(env, `planos_estudo_dias?${query.toString()}`);
  if (data instanceof Response) return data;

  const item = (data as Record<string, unknown>[])[0];
  return item ?? response({ message: 'Dia do plano de estudo nao encontrado' }, { status: 404 });
};

const getStudyPlanReadings = async (env: Env, dayId: unknown): Promise<Record<string, unknown>[] | Response> => {
  const query = new URLSearchParams({
    select: 'plano_estudo_leitura_id,plano_estudo_dia_id,ordem,book_id,chapter,verse_start,verse_end,versao,versiculo_inicio_id,versiculo_fim_id,created_at,updated_at',
    plano_estudo_dia_id: `eq.${String(dayId)}`,
    order: 'ordem.asc',
  });

  const data = await supabaseFetch(env, `planos_estudo_leituras?${query.toString()}`);
  if (data instanceof Response) return data;
  return data as Record<string, unknown>[];
};

const enrichStudyPlanReading = async (
  env: Env,
  reading: Record<string, unknown>,
  versionOverride?: string,
): Promise<Record<string, unknown> | Response> => {
  const originalVersion = String(reading.versao ?? 'ara');
  const version = versionOverride ?? originalVersion;
  const bookId = String(reading.book_id);
  const chapter = String(reading.chapter);
  const verseStart = String(reading.verse_start ?? 1);
  const verseEnd = reading.verse_end ? String(reading.verse_end) : '';

  const query = new URLSearchParams({
    select: 'id,version,testament,book,book_name,book_abbrev,chapter,verse,text,global_order',
    version: `eq.${version}`,
    book: `eq.${bookId}`,
    chapter: `eq.${chapter}`,
    verse: `gte.${verseStart}`,
    order: 'verse.asc',
  });
  if (verseEnd) query.append('verse', `lte.${verseEnd}`);

  const data = await supabaseFetch(env, `verses_normalized?${query.toString()}`);
  if (data instanceof Response) return data;

  const verses = (data as Record<string, unknown>[]).map(sanitizeVerse);
  const first = verses[0];
  const referenceRange = verseEnd ? `:${verseStart}-${verseEnd}` : '';

  return {
    ...reading,
    versao: version,
    versao_original: originalVersion,
    referencia: first ? `${first.book_name} ${chapter}${referenceRange}` : `${bookId} ${chapter}${referenceRange}`,
    texto: {
      version,
      testament: first?.testament ?? null,
      book: Number(bookId),
      book_name: first?.book_name ?? null,
      book_abbrev: first?.book_abbrev ?? null,
      chapter: Number(chapter),
      verse_start: Number(verseStart),
      verse_end: verseEnd ? Number(verseEnd) : null,
      verses,
      chapter_text: verses.map((verse) => verse.text).filter(Boolean).join('\n'),
    },
  };
};

const handleStudyPlans = async (env: Env, pathname: string, params: URLSearchParams): Promise<Response> => {
  if (pathname === '/api/planos-estudo/docs') return response({ data: studyPlansApiDocumentation });

  if (pathname === '/api/planos-estudo') {
    const plans = await supabaseFetch(env, 'planos_estudo?select=plano_estudo_id,titulo,slug,descricao,tipo,duracao_dias,ativo,metadata,created_at,updated_at&ativo=eq.true&order=created_at.desc');
    if (plans instanceof Response) return plans;

    const rows = plans as Record<string, unknown>[];
    const planIds = rows.map((plan) => String(plan.plano_estudo_id));
    const days = planIds.length > 0
      ? await supabaseFetch(env, `planos_estudo_dias?select=plano_estudo_id,dia&plano_estudo_id=in.(${planIds.join(',')})`)
      : [];
    if (days instanceof Response) return days;

    const counts = (days as Record<string, unknown>[]).reduce<Record<string, number>>((acc, day) => {
      const planId = String(day.plano_estudo_id);
      acc[planId] = (acc[planId] ?? 0) + 1;
      return acc;
    }, {});

    return response({
      data: rows.map((plan) => ({
        ...plan,
        quantidade_dias: counts[String(plan.plano_estudo_id)] ?? 0,
      })),
    });
  }

  const textMatch = pathname.match(/^\/api\/planos-estudo\/([^/]+)\/dias\/(\d+)\/textos$/);
  const dayMatch = pathname.match(/^\/api\/planos-estudo\/([^/]+)\/dias\/(\d+)$/);
  const planMatch = pathname.match(/^\/api\/planos-estudo\/([^/]+)$/);

  if (textMatch || dayMatch) {
    const match = textMatch ?? dayMatch;
    if (!match) return response({ message: 'Rota nao encontrada' }, { status: 404 });

    const plan = await getStudyPlan(env, decodeURIComponent(match[1]));
    if (plan instanceof Response) return plan;
    const day = await getStudyPlanDay(env, plan.plano_estudo_id, match[2]);
    if (day instanceof Response) return day;
    const readings = await getStudyPlanReadings(env, day.plano_estudo_dia_id);
    if (readings instanceof Response) return readings;

    const version = params.get('version') ?? params.get('versao') ?? undefined;
    const finalReadings = textMatch
      ? await Promise.all(readings.map((reading) => enrichStudyPlanReading(env, reading, version)))
      : readings;
    const firstError = finalReadings.find((reading) => reading instanceof Response);
    if (firstError instanceof Response) return firstError;

    return response({
      data: {
        plano: {
          plano_estudo_id: plan.plano_estudo_id,
          titulo: plan.titulo,
          slug: plan.slug,
          tipo: plan.tipo,
          duracao_dias: plan.duracao_dias,
        },
        dia: {
          ...day,
          versao: version ?? null,
          quantidade_leituras: finalReadings.length,
          leituras: finalReadings,
        },
      },
    });
  }

  if (planMatch) {
    const plan = await getStudyPlan(env, decodeURIComponent(planMatch[1]));
    if (plan instanceof Response) return plan;
    const days = await getStudyPlanDays(env, plan.plano_estudo_id);
    if (days instanceof Response) return days;

    return response({
      data: {
        ...plan,
        quantidade_dias: days.length,
        dias: days,
      },
    });
  }

  return response({ message: 'Rota nao encontrada' }, { status: 404 });
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
  if (pathname === '/api/biblia/search') return getBibleSearch(env, params);
  if (pathname === '/api/biblia/verses') return getVerses(env, params);
  if (pathname === '/api/biblia/versions') return getBibleVersions(env);

  return response({ message: 'Rota nao encontrada' }, { status: 404 });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

      const url = new URL(request.url);
      const parts = url.pathname.split('/').filter(Boolean);

      if (url.pathname === '/') return html(dashboardHtml);
      if (url.pathname === '/health') return response({ status: 'ok' });
      if (url.pathname === '/api/auth/google') return handleGoogleLogin(request, env);
      if (url.pathname.startsWith('/api/biblia')) return handleBible(env, url.pathname, url.searchParams);
      if (url.pathname.startsWith('/api/planos-estudo')) return handleStudyPlans(env, url.pathname, url.searchParams);
      if (url.pathname === '/api/eventos/examples') return response({ data: eventsApiExamples });
      const uploadResponse = await handleUploadRoutes(request, env, parts);
      if (uploadResponse) return uploadResponse;
      if (parts[0] === 'api' && parts[1] === 'eventos' && parts[2] && parts[3] === 'inscricoes') {
        return handleEventRegistration(request, env, parts[2]);
      }
      if (parts[0] === 'api' && parts[1]) return handleCrud(request, env, parts[1], parts[2]);

      return response({ message: 'Rota nao encontrada' }, { status: 404 });
    } catch (error) {
      return response({
        message: 'Erro interno do Worker',
        details: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
      }, { status: 500 });
    }
  },
};
