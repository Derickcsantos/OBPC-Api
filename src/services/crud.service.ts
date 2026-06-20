import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { CrudServiceContract, EntityRecord } from '../types/crud.types.js';

const toProxyUrl = (value: unknown): unknown => {
  if (typeof value !== 'string' || value.includes('/storage/v1/object/public/')) {
    return value;
  }

  return value;
};

export class SupabaseCrudService implements CrudServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly tableName: string,
    private readonly idField: string,
  ) {}

  private normalizeStorageUrls(record: EntityRecord): EntityRecord {
    return {
      ...record,
      url_capa: toProxyUrl(record.url_capa),
      url_imagem: toProxyUrl(record.url_imagem),
      imagens: Array.isArray(record.imagens)
        ? record.imagens.map((image) => this.normalizeStorageUrls(image as EntityRecord))
        : record.imagens,
      fotos: Array.isArray(record.fotos)
        ? record.fotos.map((image) => this.normalizeStorageUrls(image as EntityRecord))
        : record.fotos,
    };
  }

  private async attachRelatedImages(records: EntityRecord[]): Promise<EntityRecord[]> {
    if (records.length === 0) {
      return records;
    }

    const relation = this.tableName === 'eventos'
      ? {
          table: 'eventos_imagens',
          foreignKey: 'evento_id',
          outputKey: 'imagens',
          errorMessage: 'Erro ao listar imagens dos eventos',
        }
      : this.tableName === 'ministerios'
        ? {
            table: 'fotos_ministerios',
            foreignKey: 'ministerio_id',
            outputKey: 'fotos',
            errorMessage: 'Erro ao listar fotos dos ministerios',
          }
        : null;

    if (!relation) {
      return records;
    }

    const recordIds = records.map((record) => record[this.idField]).filter(Boolean);
    const { data, error } = await this.client
      .from(relation.table)
      .select('*')
      .in(relation.foreignKey, recordIds)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, relation.errorMessage, error);
    }

    const imagesByRecord = (data ?? []).reduce<Record<string, EntityRecord[]>>((acc, image) => {
      const recordId = String((image as EntityRecord)[relation.foreignKey]);
      acc[recordId] = acc[recordId] ?? [];
      acc[recordId].push(image as EntityRecord);
      return acc;
    }, {});

    return records.map((record) => this.normalizeStorageUrls({
      ...record,
      [relation.outputKey]: imagesByRecord[String(record[this.idField])] ?? [],
    }));
  }

  async list(): Promise<EntityRecord[]> {
    const { data, error } = await this.client.from(this.tableName).select('*').order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, `Erro ao listar ${this.tableName}`, error);
    }

    const records = await this.attachRelatedImages((data ?? []) as EntityRecord[]);
    return records.map((record) => this.normalizeStorageUrls(record));
  }

  async getById(id: string): Promise<EntityRecord> {
    const { data, error } = await this.client.from(this.tableName).select('*').eq(this.idField, id).maybeSingle();

    if (error) {
      throw new AppError(500, `Erro ao buscar ${this.tableName}`, error);
    }

    if (!data) {
      throw new AppError(404, `${this.tableName} não encontrado`);
    }

    const [record] = await this.attachRelatedImages([data as EntityRecord]);
    return this.normalizeStorageUrls(record);
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
