import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { BibleServiceContract, EntityRecord, PaginatedResult } from '../types/crud.types.js';

const defaultVersion = 'nvi';
const defaultLimit = 50;

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

const paginationFrom = (params: Record<string, string>): { page: number; limit: number; from: number; to: number } => {
  const page = Math.max(toInt(params.page) ?? 1, 1);
  const limit = Math.min(Math.max(toInt(params.limit) ?? defaultLimit, 1), 100);
  const from = (page - 1) * limit;

  return {
    page,
    limit,
    from,
    to: from + limit - 1,
  };
};

const paginated = <T extends EntityRecord>(data: T[], count: number | null, page: number, limit: number): PaginatedResult<T> => {
  const total = count ?? data.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
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
    const { page, limit, from, to } = paginationFrom(params);
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

    const allChapters = [...chapters.values()];
    return paginated(allChapters.slice(from, to + 1), allChapters.length, page, limit);
  }

  async getVerses(params: Record<string, string>): Promise<unknown> {
    const result = await this.queryVerses({
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    });

    return {
      ...result,
      data: result.data.map(sanitizeVerse),
    };
  }

  async getBookVerses(params: Record<string, string>): Promise<unknown> {
    const result = await this.queryVerses({
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    });

    return {
      ...result,
      data: result.data.map(sanitizeVerse),
    };
  }

  async searchExactWords(params: Record<string, string>): Promise<unknown> {
    const result = await this.queryVerses(params);

    return {
      ...result,
      data: result.data.map(sanitizeVerse),
    };
  }

  private async queryVerses(params: Record<string, string>): Promise<PaginatedResult> {
    const bookId = toInt(params.book_id);
    const chapterId = toInt(params.chapter_id);
    const verse = toInt(params.verse);
    const verseStart = toInt(params.verse_start);
    const verseEnd = toInt(params.verse_end);
    const { page, limit, from, to } = paginationFrom(params);

    let query = this.client
      .from('verses')
      .select('*', { count: 'exact' })
      .eq('version', params.version ?? defaultVersion)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse', { ascending: true })
      .range(from, to);

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

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao buscar versos da Biblia', error);
    }

    return paginated((data ?? []) as EntityRecord[], count, page, limit);
  }
}
