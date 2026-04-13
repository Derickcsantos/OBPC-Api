import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { BibleServiceContract } from '../types/crud.types.js';

export class BibleService implements BibleServiceContract {
  private readonly headers = {
    Authorization: `Bearer ${env.BIBLE_API_KEY}`,
    Accept: 'application/json',
  };

  private async request(path: string, params?: URLSearchParams): Promise<unknown> {
    const url = `${env.BIBLE_API_BASE_URL}/${path}${params ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    const raw = await response.text();
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    if (!response.ok) {
      throw new AppError(response.status, 'Erro na integração com API da Bíblia', parsed);
    }

    return parsed;
  }

  getVersions(): Promise<unknown> {
    return this.request('get_versions.php');
  }

  getBooks(versionId: number): Promise<unknown> {
    const params = new URLSearchParams({ version_id: String(versionId) });
    return this.request('get_books.php', params);
  }

  getChapters(versionId: number, bookId: number): Promise<unknown> {
    const params = new URLSearchParams({
      version_id: String(versionId),
      book_id: String(bookId),
    });
    return this.request('get_chapters.php', params);
  }

  getVerses(params: Record<string, string>): Promise<unknown> {
    return this.request('get_verses.php', new URLSearchParams(params));
  }

  searchExactWords(params: Record<string, string>): Promise<unknown> {
    return this.request('search_exact_words.php', new URLSearchParams(params));
  }
}
