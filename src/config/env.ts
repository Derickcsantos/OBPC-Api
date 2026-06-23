import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  BIBLE_API_BASE_URL: z.string().url().optional(),
  BIBLE_API_KEY: z.string().optional(),
  BACKEND_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_IDS: z.string().min(1).optional(),
  GOOGLE_SECRET_KEY: z.string().min(32).optional(),
  AUTH_JWT_SECRET: z.string().min(32).optional(),
  AUTH_JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(604800),
}).superRefine((value, ctx) => {
  if (!value.GOOGLE_CLIENT_ID && !value.GOOGLE_CLIENT_IDS) {
    ctx.addIssue({
      code: 'custom',
      path: ['GOOGLE_CLIENT_ID'],
      message: 'Informe GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_IDS.',
    });
  }

  if (!value.AUTH_JWT_SECRET && !value.GOOGLE_SECRET_KEY) {
    ctx.addIssue({
      code: 'custom',
      path: ['AUTH_JWT_SECRET'],
      message: 'Informe AUTH_JWT_SECRET (recomendado) ou GOOGLE_SECRET_KEY.',
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Variáveis de ambiente inválidas: ${parsedEnv.error.message}`);
}

export const env = {
  ...parsedEnv.data,
  GOOGLE_CLIENT_IDS: [
    ...(parsedEnv.data.GOOGLE_CLIENT_IDS?.split(',') ?? []),
    parsedEnv.data.GOOGLE_CLIENT_ID,
  ].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()),
  AUTH_JWT_SECRET: parsedEnv.data.AUTH_JWT_SECRET ?? parsedEnv.data.GOOGLE_SECRET_KEY!,
};
