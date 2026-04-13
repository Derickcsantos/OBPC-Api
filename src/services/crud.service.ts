import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { CrudServiceContract, EntityRecord } from '../types/crud.types.js';

export class SupabaseCrudService implements CrudServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly tableName: string,
    private readonly idField: string,
  ) {}

  async list(): Promise<EntityRecord[]> {
    const { data, error } = await this.client.from(this.tableName).select('*').order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, `Erro ao listar ${this.tableName}`, error);
    }

    return (data ?? []) as EntityRecord[];
  }

  async getById(id: string): Promise<EntityRecord> {
    const { data, error } = await this.client.from(this.tableName).select('*').eq(this.idField, id).maybeSingle();

    if (error) {
      throw new AppError(500, `Erro ao buscar ${this.tableName}`, error);
    }

    if (!data) {
      throw new AppError(404, `${this.tableName} não encontrado`);
    }

    return data as EntityRecord;
  }

  async create(payload: EntityRecord): Promise<EntityRecord> {
    const { data, error } = await this.client.from(this.tableName).insert(payload).select('*').single();

    if (error) {
      throw new AppError(500, `Erro ao criar ${this.tableName}`, error);
    }

    return data as EntityRecord;
  }

  async update(id: string, payload: EntityRecord): Promise<EntityRecord> {
    const dataToUpdate = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .update(dataToUpdate)
      .eq(this.idField, id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new AppError(500, `Erro ao atualizar ${this.tableName}`, error);
    }

    if (!data) {
      throw new AppError(404, `${this.tableName} não encontrado`);
    }

    return data as EntityRecord;
  }

  async remove(id: string): Promise<EntityRecord> {
    const { data, error } = await this.client.from(this.tableName).delete().eq(this.idField, id).select('*').maybeSingle();

    if (error) {
      throw new AppError(500, `Erro ao remover ${this.tableName}`, error);
    }

    if (!data) {
      throw new AppError(404, `${this.tableName} não encontrado`);
    }

    return data as EntityRecord;
  }
}
