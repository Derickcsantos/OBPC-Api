import { z } from 'zod';

export type ResourceName =
  | 'ministerios'
  | 'usuarios'
  | 'eventos'
  | 'noticias'
  | 'louvores'
  | 'mensagens'
  | 'oracoes';

export type EntityRecord = Record<string, unknown>;

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
  getVerses(params: Record<string, string>): Promise<unknown>;
  searchExactWords(params: Record<string, string>): Promise<unknown>;
}
