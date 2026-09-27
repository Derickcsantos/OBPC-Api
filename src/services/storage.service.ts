import { randomUUID } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase.js';
import { AppError } from '../utils/app-error.js';

export interface UploadImageInput {
  fileName: string;
  contentType: string;
  base64: string;
  folder?: string;
}

export interface UploadImageResult {
  key: string;
  url: string;
}

export type AdminUploadContext = 'ministerios' | 'eventos' | 'noticias' | 'mensagens' | 'louvores';

const bucketName = 'imagens';
const maxFileSizeBytes = 10 * 1024 * 1024;
const extensionByContentType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const bucketCache = new Set<string>();

const safeFileName = (fileName: string): string =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const sanitizeFolder = (value?: string): string => {
  const segments = (value || 'uploads')
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => safeFileName(segment))
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  return segments.length > 0 ? segments.join('/') : 'uploads';
};

const matchesImageSignature = (bytes: Uint8Array, contentType: string): boolean => {
  if (contentType === 'image/png') {
    return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  }

  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (contentType === 'image/webp') {
    return bytes.length >= 12
      && Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF'
      && Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP';
  }

  if (contentType === 'image/gif') {
    const signature = Buffer.from(bytes.subarray(0, 6)).toString('ascii');
    return signature === 'GIF87a' || signature === 'GIF89a';
  }

  return false;
};

const detectImageType = (bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp'] as const) {
    if (matchesImageSignature(bytes, type)) return type;
  }
  return null;
};

const stripJpegMetadata = (bytes: Uint8Array): Uint8Array => {
  const output: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new AppError(400, 'JPEG invalido');
    const marker = bytes[offset + 1];
    if (marker === 0xda) {
      output.push(bytes.subarray(offset));
      return Uint8Array.from(Buffer.concat(output.map((part) => Buffer.from(part))));
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) throw new AppError(400, 'JPEG invalido');
    if (!(marker >= 0xe1 && marker <= 0xef) && marker !== 0xfe) {
      output.push(bytes.subarray(offset, offset + 2 + length));
    }
    offset += 2 + length;
  }
  throw new AppError(400, 'JPEG invalido');
};

const stripPngMetadata = (bytes: Uint8Array): Uint8Array => {
  const output: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  const allowed = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);
  while (offset + 12 <= bytes.length) {
    const length = (bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
    const end = offset + 12 + length;
    if (end > bytes.length) throw new AppError(400, 'PNG invalido');
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString('ascii');
    if (allowed.has(type)) output.push(bytes.subarray(offset, end));
    offset = end;
    if (type === 'IEND') break;
  }
  return Uint8Array.from(Buffer.concat(output.map((part) => Buffer.from(part))));
};

const stripWebpMetadata = (bytes: Uint8Array): Uint8Array => {
  const chunks: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = Buffer.from(bytes.subarray(offset, offset + 4)).toString('ascii');
    const length = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
    const end = offset + 8 + length + (length % 2);
    if (length < 0 || end > bytes.length) throw new AppError(400, 'WebP invalido');
    if (!['EXIF', 'XMP ', 'ICCP'].includes(type)) {
      const chunk = bytes.slice(offset, end);
      if (type === 'VP8X' && chunk.length > 8) chunk[8] &= ~0x2c;
      chunks.push(chunk);
    }
    offset = end;
  }
  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  const result = Buffer.alloc(12 + body.length);
  result.write('RIFF', 0, 'ascii');
  result.writeUInt32LE(result.length - 8, 4);
  result.write('WEBP', 8, 'ascii');
  body.copy(result, 12);
  return new Uint8Array(result);
};

const sanitizeImageBytes = (bytes: Uint8Array, type: string): Uint8Array => {
  if (type === 'image/jpeg') return stripJpegMetadata(bytes);
  if (type === 'image/png') return stripPngMetadata(bytes);
  if (type === 'image/webp') return stripWebpMetadata(bytes);
  throw new AppError(400, 'Formato de imagem nao suportado');
};

const base64ToBytes = (value: string, contentType: string): Uint8Array => {
  const dataUrlMatch = value.match(/^data:([^;,]+);base64,(.+)$/s);
  if (dataUrlMatch && dataUrlMatch[1].toLowerCase() !== contentType) {
    throw new AppError(400, 'O tipo da imagem nao corresponde ao conteudo enviado');
  }

  const clean = (dataUrlMatch?.[2] ?? value).replace(/\s/g, '');
  if (!clean || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean) || clean.length % 4 !== 0) {
    throw new AppError(400, 'Imagem base64 invalida');
  }

  const bytes = Uint8Array.from(Buffer.from(clean, 'base64'));
  if (bytes.length === 0) {
    throw new AppError(400, 'A imagem esta vazia');
  }
  if (bytes.length > maxFileSizeBytes) {
    throw new AppError(413, 'A imagem deve ter no maximo 10 MB');
  }
  if (!matchesImageSignature(bytes, contentType)) {
    throw new AppError(400, 'O arquivo enviado nao e uma imagem valida');
  }

  return bytes;
};

export class StorageService {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  private async ensurePublicBucket(bucket: string): Promise<void> {
    if (bucketCache.has(bucket)) {
      return;
    }

    const { data: existingBucket, error: getError } = await this.client.storage.getBucket(bucket);

    if (getError && !String(getError.message).toLowerCase().includes('not found')) {
      throw new AppError(500, 'Erro ao validar bucket no Supabase Storage', getError);
    }

    if (!existingBucket) {
      const { error: createError } = await this.client.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: '10MB',
      });

      if (createError && !String(createError.message).toLowerCase().includes('already exists')) {
        throw new AppError(500, 'Erro ao criar bucket publico no Supabase Storage', createError);
      }
    } else if (!existingBucket.public) {
      const { error: updateError } = await this.client.storage.updateBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: '10MB',
      });

      if (updateError) {
        throw new AppError(500, 'Erro ao tornar bucket publico no Supabase Storage', updateError);
      }
    }

    bucketCache.add(bucket);
  }

  async uploadImage(input: UploadImageInput): Promise<UploadImageResult> {
    const bucket = bucketName;
    await this.ensurePublicBucket(bucket);

    const extension = extensionByContentType[input.contentType];
    if (!extension) {
      throw new AppError(400, 'Formato de imagem nao suportado');
    }

    const bytes = base64ToBytes(input.base64, input.contentType);
    const folder = sanitizeFolder(input.folder);
    const fileName = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'imagem';
    const key = `${folder}/${randomUUID()}-${fileName}.${extension}`;

    const { error: uploadError } = await this.client.storage.from(bucket).upload(key, bytes, {
      contentType: input.contentType,
      cacheControl: '31536000',
      upsert: false,
    });

    if (uploadError) {
      throw new AppError(500, 'Erro ao enviar imagem para o Supabase Storage', uploadError);
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(key);
    if (!data.publicUrl || !data.publicUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
      await this.client.storage.from(bucket).remove([key]);
      throw new AppError(500, 'Erro ao gerar URL publica da imagem');
    }

    return {
      key,
      url: data.publicUrl,
    };
  }

  async uploadAdminFile(bytes: Uint8Array, context: AdminUploadContext): Promise<UploadImageResult & { contentType: string; size: number }> {
    if (bytes.length === 0) throw new AppError(400, 'O arquivo esta vazio');
    if (bytes.length > 8 * 1024 * 1024) throw new AppError(413, 'O arquivo deve ter no maximo 8 MB');
    const contentType = detectImageType(bytes);
    if (!contentType) throw new AppError(400, 'Envie uma imagem JPEG, PNG ou WebP valida');
    const sanitized = sanitizeImageBytes(bytes, contentType);
    const extension = extensionByContentType[contentType];
    const key = `admin/${context}/${randomUUID()}.${extension}`;
    await this.ensurePublicBucket(bucketName);
    const { error } = await this.client.storage.from(bucketName).upload(key, sanitized, {
      contentType, cacheControl: '31536000', upsert: false,
    });
    if (error) throw new AppError(503, 'Storage temporariamente indisponivel', error);
    const { data } = this.client.storage.from(bucketName).getPublicUrl(key);
    if (!data.publicUrl?.startsWith('https://')) {
      await this.client.storage.from(bucketName).remove([key]);
      throw new AppError(500, 'Erro ao gerar URL HTTPS publica da imagem');
    }
    return { key, url: data.publicUrl, contentType, size: sanitized.length };
  }

  async getObject(key: string): Promise<Response> {
    const bucket = bucketName;
    await this.ensurePublicBucket(bucket);

    const { data } = this.client.storage.from(bucket).getPublicUrl(key.replace(/^\/+/, ''));
    const response = await fetch(data.publicUrl);

    if (!response.ok) {
      throw new AppError(response.status === 404 ? 404 : 500, 'Erro ao buscar arquivo no Supabase Storage', await response.text());
    }

    return response;
  }

  async removeObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const bucket = bucketName;
    const { error } = await this.client.storage.from(bucket).remove(keys);

    if (error) {
      throw new AppError(500, 'Erro ao remover imagem do Supabase Storage', error);
    }
  }

  keyFromPublicUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = value.indexOf(marker);
    if (markerIndex < 0) {
      return null;
    }

    const encodedKey = value.slice(markerIndex + marker.length).split('?')[0];
    try {
      return encodedKey.split('/').map(decodeURIComponent).join('/');
    } catch {
      return null;
    }
  }
}
