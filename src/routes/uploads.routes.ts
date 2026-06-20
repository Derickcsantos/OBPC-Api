import { FastifyInstance } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  eventImagesBatchUploadSchema,
  eventImageUploadSchema,
  ministryPhotosBatchUploadSchema,
  ministryPhotoUploadSchema,
  uploadImageSchema,
} from '../dtos/upload.dto.js';
import { parseWithSchema } from '../utils/validation.js';
import { StorageService } from '../services/storage.service.js';
import { AppError } from '../utils/app-error.js';
import { createPessoaComImagemSchema } from '../dtos/pessoas.dto.js';

const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const uploadsRoutes = (app: FastifyInstance, supabase: SupabaseClient): void => {
  const storage = new StorageService(supabase);

  const removePreviousImage = async (previousUrl: unknown, currentKey: string): Promise<void> => {
    const previousKey = storage.keyFromPublicUrl(previousUrl);
    if (previousKey && previousKey !== currentKey) {
      await storage.removeObjects([previousKey]).catch(() => undefined);
    }
  };

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
    const { data: existing, error: existingError } = await supabase
      .from('eventos')
      .select('evento_id,url_capa')
      .eq('evento_id', id)
      .maybeSingle();

    if (existingError) throw new AppError(500, 'Erro ao validar evento', existingError);
    if (!existing) throw new AppError(404, 'Evento nao encontrado');

    const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `eventos/${id}/capa` });
    const { data, error } = await supabase.from('eventos').update({ url_capa: upload.url }).eq('evento_id', id).select('*').maybeSingle();

    if (error || !data) {
      await storage.removeObjects([upload.key]).catch(() => undefined);
      if (error) throw new AppError(500, 'Erro ao atualizar capa do evento', error);
      throw new AppError(404, 'Evento nao encontrado');
    }

    await removePreviousImage(existing.url_capa, upload.key);
    reply.status(201).send({ data: { upload, evento: data } });
  });

  app.post('/noticias/:id/capa', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const payload = parseWithSchema(uploadImageSchema, request.body);
    const { data: existing, error: existingError } = await supabase
      .from('noticias')
      .select('noticia_id,url_capa')
      .eq('noticia_id', id)
      .maybeSingle();

    if (existingError) throw new AppError(500, 'Erro ao validar noticia', existingError);
    if (!existing) throw new AppError(404, 'Noticia nao encontrada');

    const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `noticias/${id}/capa` });
    const { data, error } = await supabase.from('noticias').update({ url_capa: upload.url }).eq('noticia_id', id).select('*').maybeSingle();

    if (error || !data) {
      await storage.removeObjects([upload.key]).catch(() => undefined);
      if (error) throw new AppError(500, 'Erro ao atualizar capa da noticia', error);
      throw new AppError(404, 'Noticia nao encontrada');
    }

    await removePreviousImage(existing.url_capa, upload.key);
    reply.status(201).send({ data: { upload, noticia: data } });
  });

  app.post('/eventos/:id/imagens', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const body = request.body;
    const files = Array.isArray((body as { files?: unknown })?.files)
      ? parseWithSchema(eventImagesBatchUploadSchema, body).files
      : [parseWithSchema(eventImageUploadSchema, body)];
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('evento_id')
      .eq('evento_id', id)
      .maybeSingle();

    if (eventoError) throw new AppError(500, 'Erro ao validar evento', eventoError);
    if (!evento) throw new AppError(404, 'Evento nao encontrado');

    const uploads = [];
    try {
      for (const [index, payload] of files.entries()) {
        const upload = await storage.uploadImage({ ...payload, folder: payload.folder ?? `eventos/${id}/imagens` });
        uploads.push({
          upload,
          row: {
            evento_id: id,
            url_imagem: upload.url,
            ordem: payload.ordem ?? index,
          },
        });
      }

      const { data, error } = await supabase
        .from('eventos_imagens')
        .insert(uploads.map((item) => item.row))
        .select('*');

      if (error) throw new AppError(500, 'Erro ao cadastrar imagem do evento', error);

      reply.status(201).send({ data });
    } catch (error) {
      await storage.removeObjects(uploads.map((item) => item.upload.key)).catch(() => undefined);
      throw error;
    }
  });

  app.post('/ministerios/:id/fotos', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const { data: ministerio, error: ministerioError } = await supabase
      .from('ministerios')
      .select('ministerio_id')
      .eq('ministerio_id', id)
      .maybeSingle();

    if (ministerioError) throw new AppError(500, 'Erro ao validar ministerio', ministerioError);
    if (!ministerio) throw new AppError(404, 'Ministerio nao encontrado');

    const body = request.body;
    const files = Array.isArray((body as { files?: unknown })?.files)
      ? parseWithSchema(ministryPhotosBatchUploadSchema, body).files
      : [parseWithSchema(ministryPhotoUploadSchema, body)];
    const uploads = [];

    try {
      for (const [index, payload] of files.entries()) {
        const upload = await storage.uploadImage({
          ...payload,
          folder: payload.folder ?? `ministerios/${id}/fotos`,
        });
        uploads.push({
          upload,
          row: {
            ministerio_id: id,
            url_imagem: upload.url,
            ordem: payload.ordem ?? index,
          },
        });
      }

      const { data, error } = await supabase
        .from('fotos_ministerios')
        .insert(uploads.map((item) => item.row))
        .select('*');

      if (error) {
        throw new AppError(500, 'Erro ao cadastrar foto do ministerio', error);
      }

      reply.status(201).send({ data });
    } catch (error) {
      if (uploads.length > 0) {
        await storage.removeObjects(uploads.map((item) => item.upload.key)).catch(() => undefined);
      }
      throw error;
    }
  });

  app.post('/pessoas/:id/imagem', async (request, reply) => {
    const { id } = parseWithSchema(uuidParamSchema, request.params);
    const { data: pessoa, error: pessoaError } = await supabase
      .from('pessoas')
      .select('pessoa_id,url_imagem')
      .eq('pessoa_id', id)
      .maybeSingle();

    if (pessoaError) throw new AppError(500, 'Erro ao validar pessoa', pessoaError);
    if (!pessoa) throw new AppError(404, 'Pessoa nao encontrada');

    const payload = parseWithSchema(uploadImageSchema, request.body);
    const upload = await storage.uploadImage({
      ...payload,
      folder: payload.folder ?? `pessoas/${id}`,
    });
    const { data, error } = await supabase
      .from('pessoas')
      .update({ url_imagem: upload.url })
      .eq('pessoa_id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      await storage.removeObjects([upload.key]).catch(() => undefined);
      if (error) throw new AppError(500, 'Erro ao atualizar imagem da pessoa', error);
      throw new AppError(404, 'Pessoa nao encontrada');
    }

    await removePreviousImage(pessoa.url_imagem, upload.key);
    reply.status(201).send({ data: { upload, pessoa: data } });
  });

  app.post('/pessoas/com-imagem', async (request, reply) => {
    const payload = parseWithSchema(createPessoaComImagemSchema, request.body);
    const upload = await storage.uploadImage({
      ...payload.imagem,
      folder: payload.imagem.folder ?? 'pessoas',
    });
    const { imagem: _imagem, ...pessoaPayload } = payload;
    const { data, error } = await supabase
      .from('pessoas')
      .insert({
        ...pessoaPayload,
        url_imagem: upload.url,
      })
      .select('*')
      .single();

    if (error) {
      await storage.removeObjects([upload.key]).catch(() => undefined);
      throw new AppError(500, 'Erro ao cadastrar pessoa', error);
    }

    reply.status(201).send({
      message: 'pessoas criado com sucesso',
      data,
    });
  });
};
