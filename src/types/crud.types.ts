import { z } from 'zod';

export type ResourceName =
  | 'ministerios'
  | 'usuarios'
  | 'eventos'
  | 'noticias'
  | 'louvores'
  | 'mensagens'
  | 'oracoes'
  | 'eventos_imagens'
  | 'eventos_inscricoes';

export type EntityRecord = Record<string, unknown>;

export interface PaginatedResult<T = EntityRecord> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CrudServiceContract {
  list(): Promise<EntityRecord[]>;
  getById(id: string): Promise<EntityRecord>;
  create(payload: EntityRecord): Promise<EntityRecord>;
  update(id: string, payload: EntityRecord): Promise<EntityRecord>;
  remove(id: string): Promise<EntityRecord>;
}

export interface CrudControllerConfig {
  resource: ResourceName;
  idField: string;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  transformCreate?: (payload: EntityRecord) => Promise<EntityRecord> | EntityRecord;
  transformUpdate?: (payload: EntityRecord) => Promise<EntityRecord> | EntityRecord;
  sanitizeOutput?: (payload: EntityRecord) => EntityRecord;
}

export interface BibleServiceContract {
  getTestaments(): Promise<unknown>;
  getVersions(): Promise<unknown>;
  getBooks(params: Record<string, string>): Promise<unknown>;
  getChapters(params: Record<string, string>): Promise<unknown>;
  getChapter(params: Record<string, string>): Promise<unknown>;
  getBookVerses(params: Record<string, string>): Promise<unknown>;
  getVerses(params: Record<string, string>): Promise<unknown>;
  compareVerses(params: Record<string, string>): Promise<unknown>;
  searchExactWords(params: Record<string, string>): Promise<unknown>;
}
