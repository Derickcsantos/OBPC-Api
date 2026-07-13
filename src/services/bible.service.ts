import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { BibleServiceContract, EntityRecord, PaginatedResult } from '../types/crud.types.js';
import { redisCache } from './redis-cache.service.js';

const defaultVersion = 'nvi';
const defaultLimit = 100;
const maxLimit = 100;
const chapterColumns: string = 'version,comparison_scope,testament,book,book_name,book_abbrev,chapter';
const chapterFullColumns: string = `${chapterColumns},verses,chapter_text`;
const verseColumns: string = 'id,version,testament,book,book_name,book_abbrev,chapter,verse,text,global_order';
const comparisonColumns: string = 'testament,book,book_name,book_abbrev,chapter,verse,texts_by_version';
const inFlightCache = new Map<string, Promise<unknown>>();

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&quot;?/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;?/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const sanitizeText = (value: unknown): unknown => (typeof value === 'string' ? decodeHtmlEntities(value) : value);

const sanitizeVerse = (verse: EntityRecord): EntityRecord => ({
  ...verse,
  text: sanitizeText(verse.text),
});

const sanitizeChapter = (chapter: EntityRecord): EntityRecord => ({
  ...chapter,
  chapter_text: sanitizeText(chapter.chapter_text),
  verses: Array.isArray(chapter.verses)
    ? chapter.verses.map((verse) => ({
        ...(verse as EntityRecord),
        text: sanitizeText((verse as EntityRecord).text),
      }))
    : chapter.verses,
});

const sanitizeComparison = (comparison: EntityRecord, versions?: string[]): EntityRecord => {
  const texts = comparison.texts_by_version as Record<string, unknown> | undefined;
  const normalizedTexts = Object.fromEntries(
    Object.entries(texts ?? {})
      .filter(([version]) => !versions || versions.includes(version))
      .map(([version, text]) => [version, sanitizeText(text)]),
  );

  return {
    ...comparison,
    texts_by_version: normalizedTexts,
  };
};

const toInt = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBool = (value: string | undefined): boolean => value === 'true' || value === '1';

const paginationFrom = (params: Record<string, string>): { page: number; limit: number; from: number; to: number } => {
  const page = Math.max(toInt(params.page) ?? 1, 1);
  const limit = Math.min(Math.max(toInt(params.limit) ?? defaultLimit, 1), maxLimit);
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

const cacheKey = (method: string, params: Record<string, string> = {}): string => {
  const normalizedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      if (params[key] !== undefined && params[key] !== '') {
        acc[key] = params[key];
      }
      return acc;
    }, {});

  return `biblia:v2:${method}:${JSON.stringify(normalizedParams)}`;
};

const hasSearchTerm = (params: Record<string, string>): boolean => Boolean(params.keyword ?? params.q ?? params.text);

const versionsFilter = (params: Record<string, string>): string[] | undefined =>
  params.versions
    ?.split(',')
    .map((version) => version.trim().toLowerCase())
    .filter(Boolean);

const sanitizeSearchPattern = (value: string): string => value.replace(/[,%*()]/g, ' ').trim();

export class BibleService implements BibleServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  private async cached<T>(method: string, params: Record<string, string>, loader: () => Promise<T>): Promise<T> {
    const key = cacheKey(method, params);
    const cached = await redisCache.get<T>(key);

    if (cached) {
      return cached;
    }

    const running = inFlightCache.get(key) as Promise<T> | undefined;
    if (running) {
      return running;
    }

    const promise = loader()
      .then(async (data) => {
        await redisCache.set(key, data);
        return data;
      })
      .finally(() => {
        inFlightCache.delete(key);
      });

    inFlightCache.set(key, promise);
    return promise;
  }

  async getTestaments(): Promise<unknown> {
    return this.cached('testaments', {}, async () => {
      const { data, error } = await this.client.from('testaments').select('*').order('id', { ascending: true });

      if (error) {
        throw new AppError(500, 'Erro ao listar testamentos', error);
      }

      return data ?? [];
    });
  }

  async getVersions(): Promise<unknown> {
    return this.cached('versions', {}, async () => {
      const { data, error } = await this.client
        .from('bible_versions')
        .select('code,name,language,source_file,comparison_scope,total_books,total_chapters,total_verses,created_at,updated_at')
        .order('code', { ascending: true });

      if (error) {
        throw new AppError(500, 'Erro ao listar versoes da Biblia', error);
      }

      return (data ?? []).map((version) => ({
        id: version.code,
        ...version,
      }));
    });
  }

  async getBooks(params: Record<string, string>): Promise<unknown> {
    return this.cached('books', params, async () => {
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
    });
  }

  async getChapters(params: Record<string, string>): Promise<unknown> {
    return this.cached('chapters', params, async () => {
      const bookId = toInt(params.book_id);
      const includeFullText = toBool(params.include_text) || toBool(params.include_verses);
      const { page, limit, from, to } = paginationFrom(params);
      let query = this.client
        .from('chapter_texts')
        .select(includeFullText ? chapterFullColumns : chapterColumns, { count: 'exact' })
        .eq('version', params.version ?? defaultVersion)
        .order('book', { ascending: true })
        .order('chapter', { ascending: true })
        .range(from, to);

      if (bookId) {
        query = query.eq('book', bookId);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new AppError(500, 'Erro ao listar capitulos da Biblia', error);
      }

      const rows = includeFullText
        ? ((data ?? []) as unknown as EntityRecord[]).map(sanitizeChapter)
        : ((data ?? []) as unknown as EntityRecord[]);
      return paginated(rows, count, page, limit);
    });
  }

  async getChapter(params: Record<string, string>): Promise<unknown> {
    return this.cached('chapter', params, async () => {
      const bookId = toInt(params.book_id);
      const chapterId = toInt(params.chapter_id);

      if (!bookId || !chapterId) {
        throw new AppError(400, 'Informe book_id e chapter_id');
      }

      const { data, error } = await this.client
        .from('chapter_texts')
        .select(chapterFullColumns)
        .eq('version', params.version ?? defaultVersion)
        .eq('book', bookId)
        .eq('chapter', chapterId)
        .maybeSingle();

      if (error) {
        throw new AppError(500, 'Erro ao buscar capitulo da Biblia', error);
      }

      if (!data) {
        throw new AppError(404, 'Capitulo da Biblia nao encontrado');
      }

      return sanitizeChapter(data as unknown as EntityRecord);
    });
  }

  async getVerses(params: Record<string, string>): Promise<unknown> {
    const normalizedParams = {
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    };

    if (hasSearchTerm(normalizedParams)) {
      return this.queryVerses(normalizedParams);
    }

    return this.cached('verses', normalizedParams, async () => this.queryVerses(normalizedParams));
  }

  async getBookVerses(params: Record<string, string>): Promise<unknown> {
    const normalizedParams = {
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    };

    if (hasSearchTerm(normalizedParams)) {
      return this.queryVerses(normalizedParams);
    }

    return this.cached('book-verses', normalizedParams, async () => this.queryVerses(normalizedParams));
  }

  async compareVerses(params: Record<string, string>): Promise<unknown> {
    return this.cached('compare', params, async () => {
      const bookId = toInt(params.book_id);
      const chapterId = toInt(params.chapter_id);
      const verse = toInt(params.verse);
      const verseStart = toInt(params.verse_start);
      const verseEnd = toInt(params.verse_end);
      const versions = versionsFilter(params);
      const { page, limit, from, to } = paginationFrom(params);

      let query = this.client
        .from('verses_comparisons')
        .select(comparisonColumns, { count: 'exact' })
        .order('book', { ascending: true })
        .order('chapter', { ascending: true })
        .order('verse', { ascending: true })
        .range(from, to);

      if (bookId) query = query.eq('book', bookId);
      if (chapterId) query = query.eq('chapter', chapterId);
      if (verse) query = query.eq('verse', verse);
      if (verseStart && verseEnd) query = query.gte('verse', verseStart).lte('verse', verseEnd);

      const { data, error, count } = await query;

      if (error) {
        throw new AppError(500, 'Erro ao comparar versoes da Biblia', error);
      }

      return paginated(((data ?? []) as unknown as EntityRecord[]).map((row) => sanitizeComparison(row, versions)), count, page, limit);
    });
  }

  async searchExactWords(params: Record<string, string>): Promise<unknown> {
    const normalizedParams: Record<string, string> = {
      ...params,
      keyword: params.keyword ?? params.q ?? params.text,
    };
    const scope = normalizedParams.scope ?? 'all';

    if (scope === 'books') {
      return this.queryBooks(normalizedParams);
    }

    const verses = await this.queryVerses(normalizedParams);

    if (scope === 'verses') {
      return {
        ...verses,
        meta: {
          scope,
          keyword: normalizedParams.keyword,
          version: normalizedParams.version ?? defaultVersion,
        },
      };
    }

    const books = await this.queryBooks(normalizedParams);

    return {
      ...verses,
      books: books.data,
      books_pagination: books.pagination,
      meta: {
        scope,
        keyword: normalizedParams.keyword,
        version: normalizedParams.version ?? defaultVersion,
      },
    };
  }

  private async queryBooks(params: Record<string, string>): Promise<PaginatedResult> {
    const keyword = params.keyword?.trim();
    const testamentId = toInt(params.testament_id ?? params.testament);
    const { page, limit, from, to } = paginationFrom(params);

    let query = this.client
      .from('books')
      .select('id,name,abbrev,testament', { count: 'exact' })
      .order('id', { ascending: true })
      .range(from, to);

    if (testamentId) {
      query = query.eq('testament', testamentId);
    }

    if (keyword) {
      const pattern = sanitizeSearchPattern(keyword);
      query = query.or(`name.ilike.%${pattern}%,abbrev.ilike.%${pattern}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao buscar livros da Biblia', error);
    }

    return paginated((data ?? []) as unknown as EntityRecord[], count, page, limit);
  }

  private async queryVerses(params: Record<string, string>): Promise<PaginatedResult> {
    const bookId = toInt(params.book_id);
    const chapterId = toInt(params.chapter_id);
    const verse = toInt(params.verse);
    const verseStart = toInt(params.verse_start);
    const verseEnd = toInt(params.verse_end);
    const keyword = params.keyword?.trim();
    const { page, limit, from, to } = paginationFrom(params);

    let query = this.client
      .from('verses_normalized')
      .select(verseColumns, { count: 'exact' })
      .eq('version', params.version ?? defaultVersion)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse', { ascending: true })
      .range(from, to);

    if (bookId) query = query.eq('book', bookId);
    if (chapterId) query = query.eq('chapter', chapterId);
    if (verse) query = query.eq('verse', verse);
    if (verseStart && verseEnd) query = query.gte('verse', verseStart).lte('verse', verseEnd);
    if (keyword) query = query.ilike('text', `%${keyword}%`);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao buscar versos da Biblia', error);
    }

    return paginated(((data ?? []) as unknown as EntityRecord[]).map(sanitizeVerse), count, page, limit);
  }
}
