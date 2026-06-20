import { z } from 'zod';

const imageContentTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadImageSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: imageContentTypeSchema,
  base64: z.string().min(1).max(14_000_000),
  folder: z.string().trim().min(1).max(300).optional(),
});

export const eventImageUploadSchema = uploadImageSchema.extend({
  ordem: z.coerce.number().int().nonnegative().optional(),
});

export const eventImagesBatchUploadSchema = z.object({
  files: z.array(eventImageUploadSchema).min(1),
});

export const ministryPhotoUploadSchema = eventImageUploadSchema;
export const ministryPhotosBatchUploadSchema = eventImagesBatchUploadSchema;
