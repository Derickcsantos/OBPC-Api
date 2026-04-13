import { z } from 'zod';
import { AppError } from './app-error.js';

export const parseWithSchema = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError(400, 'Erro de validação', result.error.flatten());
  }

  return result.data;
};

export const atLeastOneField = (obj: Record<string, unknown>): boolean => Object.keys(obj).length > 0;
