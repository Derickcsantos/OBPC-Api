import { randomUUID } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
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

const defaultBucket = 'imagens';
const bucketCache = new Set<string>();

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
  return Uint8Array.from(Buffer.from(clean, 'base64'));
};

const getBucket = (): string => env.SUPABASE_STORAGE_BUCKET ?? defaultBucket;

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
    const bucket = getBucket();
    await this.ensurePublicBucket(bucket);

    const bytes = base64ToBytes(input.base64);
    const folder = input.folder?.replace(/^\/+|\/+$/g, '') || 'uploads';
    const extension = input.contentType === 'image/webp' ? 'webp' : safeFileName(input.fileName).split('.').pop();
    const fileName = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'imagem';
    const key = `${folder}/${randomUUID()}-${fileName}.${extension || 'webp'}`;

    const { error: uploadError } = await this.client.storage.from(bucket).upload(key, bytes, {
      contentType: input.contentType,
      cacheControl: '31536000',
      upsert: false,
    });

    if (uploadError) {
      throw new AppError(500, 'Erro ao enviar imagem para o Supabase Storage', uploadError);
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(key);

    return {
      key,
      url: data.publicUrl,
    };
  }

  async getObject(key: string): Promise<Response> {
    const bucket = getBucket();
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

    const bucket = getBucket();
    const { error } = await this.client.storage.from(bucket).remove(keys);

    if (error) {
      throw new AppError(500, 'Erro ao remover imagem do Supabase Storage', error);
    }
  }
}
