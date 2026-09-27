import { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { SupabaseRelationshipService } from '../src/services/relationship.service.js';
import { StorageService } from '../src/services/storage.service.js';

const chunk = (type: string, payload = new Uint8Array()): Uint8Array => {
  const result = new Uint8Array(12 + payload.length);
  new DataView(result.buffer).setUint32(0, payload.length, false);
  result.set(new TextEncoder().encode(type), 4);
  result.set(payload, 8);
  return result;
};

const join = (...parts: Uint8Array[]): Uint8Array => {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
};

const pngWithMetadata = (): Uint8Array => join(
  Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR'),
  chunk('tEXt', new TextEncoder().encode('segredo')),
  chunk('IDAT'),
  chunk('IEND'),
);

describe('contratos de seguranca e concorrencia', () => {
  it('mantem uma unica marcacao sob chamadas concorrentes', async () => {
    let stored: Record<string, unknown> | null = null;
    const client = {
      from: (table: string) => {
        if (table === 'oracoes') return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { oracao_id: 'prayer' }, error: null }) }) }),
        };
        return {
          select: () => {
            const query = {
              eq: () => query,
              maybeSingle: async () => ({ data: stored, error: null }),
            };
            return query;
          },
          upsert: (value: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                stored ??= { ...value, created_at: '2026-01-01T00:00:00.000Z' };
                return { data: stored, error: null };
              },
            }),
          }),
        };
      },
    } as unknown as SupabaseClient;
    const service = new SupabaseRelationshipService(client);
    const results = await Promise.all([
      service.markPrayerAsPrayed('user', 'prayer'),
      service.markPrayerAsPrayed('user', 'prayer'),
    ]);
    expect(results.every((result) => result.orado === true)).toBe(true);
    expect(stored).toMatchObject({ usuario_id: 'user', oracao_id: 'prayer' });
  });

  it('remove metadados auxiliares antes de enviar a imagem', async () => {
    let uploaded = new Uint8Array();
    const client = {
      storage: {
        getBucket: async () => ({ data: { public: true }, error: null }),
        from: () => ({
          upload: async (_key: string, bytes: Uint8Array) => { uploaded = Uint8Array.from(bytes); return { error: null }; },
          getPublicUrl: () => ({ data: { publicUrl: 'https://storage.example/admin/eventos/image.png' } }),
          remove: async () => ({ error: null }),
        }),
      },
    } as unknown as SupabaseClient;
    await new StorageService(client).uploadAdminFile(pngWithMetadata(), 'eventos');
    expect(new TextDecoder().decode(uploaded)).not.toContain('segredo');
    expect(new TextDecoder().decode(uploaded)).not.toContain('tEXt');
  });

  it('responde 503 sem fabricar URL quando o storage falha', async () => {
    const client = {
      storage: {
        getBucket: async () => ({ data: { public: true }, error: null }),
        from: () => ({
          upload: async () => ({ error: new Error('offline') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: async () => ({ error: null }),
        }),
      },
    } as unknown as SupabaseClient;
    await expect(new StorageService(client).uploadAdminFile(pngWithMetadata(), 'eventos'))
      .rejects.toMatchObject({ statusCode: 503 });
  });
});
