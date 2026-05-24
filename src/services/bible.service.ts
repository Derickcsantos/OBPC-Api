import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { BibleServiceContract, EntityRecord } from '../types/crud.types.js';

const defaultVersion = 'nvi';

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&quot;?/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;?/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const sanitizeVerse = (verse: EntityRecord): EntityRecord => ({
  ...verse,
  text: typeof verse.text === 'string' ? decodeHtmlEntities(verse.text) : verse.text,
});

const toInt = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class BibleService implements BibleServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  async getTestaments(): Promise<unknown> {
    const { data, error } = await this.client.from('testaments').select('*').order('id', { ascending: true });

    if (error) {
      throw new AppError(500, 'Erro ao listar testamentos', error);
    }

    return data ?? [];
  }

  async getVersions(): Promise<unknown> {
    const { data, error } = await this.client.from('verses').select('version').order('version', { ascending: true });

    if (error) {
      throw new AppError(500, 'Erro ao listar versoes da Biblia', error);
    }

    const versions = [...new Set((data ?? []).map((item) => item.version).filter(Boolean))];

    return versions.map((version) => ({
      id: version,
      name: String(version).toUpperCase(),
    }));
  }

  async getBooks(params: Record<string, string>): Promise<unknown> {
    const testamentId = toInt(params.testament_id ?? params.testament);
    let query = this.client.from('books').select('*').order('id', { ascending: true });

    if (testamentId) {
      query = query.eq('testament', testamentId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao listar livros da Biblia', error);
    }

    return data ?? [];
  }

  async getChapters(params: Record<string, string>): Promise<unknown> {
    const bookId = toInt(params.book_id);
    let query = this.client
      .from('verses')
      .select('version,testament,book,chapter')
      .eq('version', params.version ?? defaultVersion)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true });

    if (bookId) {
      query = query.eq('book', bookId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao listar capitulos da Biblia', error);
    }

    const chapters = new Map<string, EntityRecord>();

    for (const row of data ?? []) {
      const key = `${row.version}:${row.book}:${row.chapter}`;
      if (!chapters.has(key)) {
        chapters.set(key, row as EntityRecord);
      }
    }

    return [...chapters.values()];
  }

  async getVerses(params: Record<string, string>): Promise<unknown> {
    const data = await this.queryVerses({
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    });

    return data.map(sanitizeVerse);
  }

  async searchExactWords(params: Record<string, string>): Promise<unknown> {
    const data = await this.queryVerses(params);
    return data.map(sanitizeVerse);
  }

  private async queryVerses(params: Record<string, string>): Promise<EntityRecord[]> {
    const bookId = toInt(params.book_id);
    const chapterId = toInt(params.chapter_id);
    const verse = toInt(params.verse);
    const verseStart = toInt(params.verse_start);
    const verseEnd = toInt(params.verse_end);

    let query = this.client
      .from('verses')
      .select('*')
      .eq('version', params.version ?? defaultVersion)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse', { ascending: true });

    if (bookId) {
      query = query.eq('book', bookId);
    }

    if (chapterId) {
      query = query.eq('chapter', chapterId);
    }

    if (verse) {
      query = query.eq('verse', verse);
    }

    if (verseStart && verseEnd) {
      query = query.gte('verse', verseStart).lte('verse', verseEnd);
    }

    if (params.keyword) {
      query = query.ilike('text', `%${params.keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao buscar versos da Biblia', error);
    }

    return (data ?? []) as EntityRecord[];
  }
}
