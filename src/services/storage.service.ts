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
