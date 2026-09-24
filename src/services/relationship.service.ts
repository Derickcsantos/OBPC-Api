import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { RelationshipServiceContract } from '../types/relationship.types.js';

const publicUserColumns = 'usuario_id,nome_usuario,email_usuario,telefone_usuario,data_nascimento,avatar_url,auth_provider';

export class SupabaseRelationshipService implements RelationshipServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  private async assertExists(table: string, field: string, value: string, label: string): Promise<void> {
    const { data, error } = await this.client.from(table).select(field).eq(field, value).maybeSingle();
    if (error) throw new AppError(500, `Erro ao consultar ${label}.`, error);
    if (!data) throw new AppError(404, `${label} não encontrado.`);
  }

  async markPrayerAsPrayed(userId: string, prayerId: string): Promise<Record<string, unknown>> {
    await this.assertExists('oracoes', 'oracao_id', prayerId, 'Pedido de oração');
    const existing = await this.client
      .from('usuario_oracoes_oradas')
      .select('usuario_id,oracao_id,created_at')
      .eq('usuario_id', userId)
      .eq('oracao_id', prayerId)
      .maybeSingle();
    if (existing.error) throw new AppError(500, 'Erro ao consultar marcação do pedido.', existing.error);
    if (existing.data) return { ...existing.data, orado: true } as Record<string, unknown>;

    const { data, error } = await this.client
      .from('usuario_oracoes_oradas')
      .insert({ usuario_id: userId, oracao_id: prayerId })
      .select('usuario_id,oracao_id,created_at')
      .single();
    if (error) throw new AppError(500, 'Erro ao marcar pedido como orado.', error);
    return { ...data, orado: true } as Record<string, unknown>;
  }

  async addMinistryInterest(userId: string, ministryId: string): Promise<Record<string, unknown>> {
    await this.assertExists('ministerios', 'ministerio_id', ministryId, 'Ministério');
    const existing = await this.client
      .from('usuario_ministerios_interesse')
      .select('usuario_id,ministerio_id,created_at')
      .eq('usuario_id', userId)
      .eq('ministerio_id', ministryId)
      .maybeSingle();
    if (existing.error) throw new AppError(500, 'Erro ao consultar interesse do usuário.', existing.error);
    if (existing.data) return existing.data as Record<string, unknown>;

    const { data, error } = await this.client
      .from('usuario_ministerios_interesse')
      .insert({ usuario_id: userId, ministerio_id: ministryId })
      .select('usuario_id,ministerio_id,created_at')
      .single();
    if (error) throw new AppError(500, 'Erro ao adicionar interesse no ministério.', error);
    return data as Record<string, unknown>;
  }

  async removeMinistryInterest(userId: string, ministryId: string): Promise<Record<string, unknown>> {
    await this.assertExists('ministerios', 'ministerio_id', ministryId, 'Ministério');
    const { data, error } = await this.client
      .from('usuario_ministerios_interesse')
      .delete()
      .eq('usuario_id', userId)
      .eq('ministerio_id', ministryId)
      .select('usuario_id,ministerio_id,created_at')
      .maybeSingle();
    if (error) throw new AppError(500, 'Erro ao remover interesse no ministério.', error);
    return (data ?? { usuario_id: userId, ministerio_id: ministryId, removido: false }) as Record<string, unknown>;
  }

  async listMinistryInterests(userId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('usuario_ministerios_interesse')
      .select('ministerio_id,created_at,ministerios(*)')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw new AppError(500, 'Erro ao listar interesses do usuário.', error);
    return (data ?? []) as Record<string, unknown>[];
  }

  async listMinistryInterestedUsers(ministryId: string): Promise<Record<string, unknown>[]> {
    await this.assertExists('ministerios', 'ministerio_id', ministryId, 'Ministério');
    const { data, error } = await this.client
      .from('usuario_ministerios_interesse')
      .select(`created_at, usuarios(${publicUserColumns})`)
      .eq('ministerio_id', ministryId)
      .order('created_at', { ascending: true });
    if (error) throw new AppError(500, 'Erro ao listar interessados do ministério.', error);

    return ((data ?? []) as Array<{ created_at: string; usuarios: Record<string, unknown>[] | null }>).map((item) => ({
      ...(item.usuarios?.[0] ?? {}),
      interesse_created_at: item.created_at,
    }));
  }
}