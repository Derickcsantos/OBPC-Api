import { z } from 'zod';

export const uploadImageSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1).default('application/octet-stream'),
  base64: z.string().min(1),
  folder: z.string().min(1).optional(),
});

export const eventImageUploadSchema = uploadImageSchema.extend({
  ordem: z.coerce.number().int().nonnegative().optional(),
});

export const eventImagesBatchUploadSchema = z.object({
  files: z.array(eventImageUploadSchema).min(1),
});

export const ministryPhotoUploadSchema = eventImageUploadSchema;
export const ministryPhotosBatchUploadSchema = eventImagesBatchUploadSchema;
