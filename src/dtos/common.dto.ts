import { z } from 'zod';
import { idStringSchema } from '../utils/validation.js';

export const idParamSchema = z.object({
  id: idStringSchema,
});
