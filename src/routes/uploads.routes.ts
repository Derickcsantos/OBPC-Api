import { FastifyInstance } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { eventImagesBatchUploadSchema, eventImageUploadSchema, uploadImageSchema } from '../dtos/upload.dto.js';
import { parseWithSchema } from '../utils/validation.js';
import { StorageService } from '../services/storage.service.js';
import { AppError } from '../utils/app-error.js';

const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const uploadsRoutes = (app: FastifyInstance, supabase: SupabaseClient): void => {
  const storage = new StorageService(supabase);

  app.get('/uploads/object/*', async (request, reply) => {
    const key = decodeURIComponent(((request.params as Record<string, string>)['*'] ?? '').replace(/^\/+/, ''));
    if (!key) throw new AppError(400, 'Informe a chave do arquivo');

    const objectResponse = await storage.getObject(key);
    const contentType = objectResponse.headers.get('content-type') ?? 'application/octet-stream';
    const cacheControl = objectResponse.headers.get('cache-control') ?? 'public, max-age=3600';
    const body = Buffer.from(await objectResponse.arrayBuffer());

    reply
      .header('Content-Type', contentType)
      .header('Cache-Control', cacheControl)
      .send(body);
  });

  app.post('/uploads', async (request, reply) => {
    const payload = parseWithSchema(uploadImageSchema, request.body);
    const upload = await storage.uploadImage(payload);
    reply.status(201).send({ data: upload });
  });

  app.post('/eventos/:id/capa', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const payload = parseWithSchema(uploadImageSchema, request.body);
    const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `eventos/${id}/capa` });
    const { data, error } = await supabase.from('eventos').update({ url_capa: upload.url }).eq('evento_id', id).select('*').maybeSingle();

    if (error) throw new AppError(500, 'Erro ao atualizar capa do evento', error);
    if (!data) throw new AppError(404, 'Evento nao encontrado');

    reply.status(201).send({ data: { upload, evento: data } });
  });

  app.post('/noticias/:id/capa', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const payload = parseWithSchema(uploadImageSchema, request.body);
    const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `noticias/${id}/capa` });
    const { data, error } = await supabase.from('noticias').update({ url_capa: upload.url }).eq('noticia_id', id).select('*').maybeSingle();

    if (error) throw new AppError(500, 'Erro ao atualizar capa da noticia', error);
    if (!data) throw new AppError(404, 'Noticia nao encontrada');

    reply.status(201).send({ data: { upload, noticia: data } });
  });

  app.post('/eventos/:id/imagens', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const body = request.body;
    const files = Array.isArray((body as { files?: unknown })?.files)
      ? parseWithSchema(eventImagesBatchUploadSchema, body).files
      : [parseWithSchema(eventImageUploadSchema, body)];
    const rows = [];

    for (const [index, payload] of files.entries()) {
      const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `eventos/${id}/imagens` });
      rows.push({
        evento_id: id,
        url_imagem: upload.url,
        ordem: payload.ordem ?? index,
      });
    }

    const { data, error } = await supabase.from('eventos_imagens').insert(rows).select('*');

    if (error) throw new AppError(500, 'Erro ao cadastrar imagem do evento', error);

    reply.status(201).send({ data });
  });
};
