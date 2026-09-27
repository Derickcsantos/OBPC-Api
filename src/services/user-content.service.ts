import { SupabaseClient } from '@supabase/supabase-js';
import { AnnotationInput, HighlightInput, PaginationInput, UserContentServiceContract, VerseSelection } from '../types/user-content.types.js';
import { AppError } from '../utils/app-error.js';

type Row = Record<string, unknown>;

export class UserContentService implements UserContentServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  private pagination(page: number, limit: number, total: number) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }

  async listPublicPrayers(userId: string | undefined, { page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    const prayers = await this.client.from('oracoes').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (prayers.error) throw new AppError(500, 'Erro ao listar pedidos de oracao.', prayers.error);
    const ids = (prayers.data ?? []).map((item) => item.oracao_id as string);
    let prayedIds = new Set<string>();
    if (userId && ids.length) {
      const marks = await this.client.from('usuario_oracoes_oradas').select('oracao_id')
        .eq('usuario_id', userId).in('oracao_id', ids);
      if (marks.error) throw new AppError(500, 'Erro ao consultar oracoes do usuario.', marks.error);
      prayedIds = new Set((marks.data ?? []).map((mark) => String(mark.oracao_id)));
    }
    return {
      data: (prayers.data ?? []).map((prayer) => userId ? { ...prayer, orado_por_mim: prayedIds.has(String(prayer.oracao_id)) } : prayer),
      pagination: this.pagination(page, limit, prayers.count ?? 0),
    };
  }

  async listMyPrayers(userId: string, { page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client.from('usuario_oracoes_oradas')
      .select('created_at,oracoes(*)', { count: 'exact' }).eq('usuario_id', userId)
      .order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new AppError(500, 'Erro ao listar pedidos orados.', error);
    return {
      data: ((data ?? []) as Array<{ created_at: string; oracoes: Row | Row[] | null }>).map((row) => ({
        ...(Array.isArray(row.oracoes) ? row.oracoes[0] : row.oracoes), orado_em: row.created_at,
      })),
      pagination: this.pagination(page, limit, count ?? 0),
    };
  }

  async listUserPrayerStatus(userId: string, _viewerId: string, pagination: PaginationInput): Promise<unknown> {
    return this.listPrayersWithStatus(userId, pagination);
  }

  async listAdminPrayers(viewerId: string, pagination: PaginationInput): Promise<unknown> {
    return this.listPrayersWithStatus(viewerId, pagination);
  }

  private async listPrayersWithStatus(userId: string, { page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    const prayers = await this.client.from('oracoes').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (prayers.error) throw new AppError(500, 'Erro ao listar pedidos de oracao.', prayers.error);
    const ids = (prayers.data ?? []).map((item) => item.oracao_id as string);
    if (!ids.length) return { data: [], pagination: this.pagination(page, limit, prayers.count ?? 0) };
    const marks = await this.client.from('usuario_oracoes_oradas').select('oracao_id,usuario_id,created_at').in('oracao_id', ids);
    if (marks.error) throw new AppError(500, 'Erro ao consultar oracoes dos usuarios.', marks.error);
    const allMarks = (marks.data ?? []) as Array<{ oracao_id: string; usuario_id: string; created_at: string }>;
    return {
      data: (prayers.data ?? []).map((prayer) => {
        const related = allMarks.filter((mark) => mark.oracao_id === prayer.oracao_id);
        const mine = related.find((mark) => mark.usuario_id === userId);
        return { ...prayer, total_oracoes: related.length, orado: Boolean(mine), orado_por_mim: Boolean(mine), orado_em: mine?.created_at ?? null, orado_por_mim_em: mine?.created_at ?? null };
      }),
      pagination: this.pagination(page, limit, prayers.count ?? 0),
    };
  }

  async listAnnotations(userId: string, { page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client.from('anotacoes_biblicas')
      .select('*,anotacoes_biblicas_versiculos(version,book,chapter,verse)', { count: 'exact' })
      .eq('usuario_id', userId).order('updated_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new AppError(500, 'Erro ao listar anotacoes.', error);
    return { data: await this.hydrateAnnotations((data ?? []) as Row[]), pagination: this.pagination(page, limit, count ?? 0) };
  }

  async getAnnotation(userId: string, id: string): Promise<unknown> {
    const { data, error } = await this.client.from('anotacoes_biblicas')
      .select('*,anotacoes_biblicas_versiculos(version,book,chapter,verse)')
      .eq('usuario_id', userId).eq('anotacao_id', id).maybeSingle();
    if (error) throw new AppError(500, 'Erro ao consultar anotacao.', error);
    if (!data) throw new AppError(404, 'Anotacao nao encontrada.');
    return (await this.hydrateAnnotations([data as Row]))[0];
  }

  async createAnnotation(userId: string, input: AnnotationInput): Promise<unknown> {
    return this.saveAnnotation(userId, null, input);
  }

  async updateAnnotation(userId: string, id: string, input: AnnotationInput): Promise<unknown> {
    return this.saveAnnotation(userId, id, input);
  }

  private async saveAnnotation(userId: string, id: string | null, input: AnnotationInput): Promise<unknown> {
    const { data, error } = await this.client.rpc('upsert_bible_annotation', {
      p_usuario_id: userId, p_anotacao_id: id, p_titulo: input.titulo ?? null,
      p_conteudo: input.conteudo, p_versiculos: input.versiculos,
    });
    if (error) {
      const status = error.message.includes('VERSICULO_NAO_ENCONTRADO') ? 400 : error.message.includes('ANOTACAO_NAO_ENCONTRADA') ? 404 : 500;
      throw new AppError(status, status === 400 ? 'Um ou mais versiculos nao existem.' : status === 404 ? 'Anotacao nao encontrada.' : 'Erro ao salvar anotacao.', error);
    }
    return this.getAnnotation(userId, String(data));
  }

  async deleteAnnotation(userId: string, id: string): Promise<unknown> {
    const { data, error } = await this.client.from('anotacoes_biblicas').delete()
      .eq('usuario_id', userId).eq('anotacao_id', id).select('anotacao_id').maybeSingle();
    if (error) throw new AppError(500, 'Erro ao excluir anotacao.', error);
    if (!data) throw new AppError(404, 'Anotacao nao encontrada.');
    return data;
  }

  async listHighlights(userId: string, filters: Record<string, string>, { page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    let query = this.client.from('destaques_biblicos').select('*', { count: 'exact' }).eq('usuario_id', userId);
    if (filters.version) query = query.eq('version', filters.version.toLowerCase());
    if (filters.book) query = query.eq('book', Number(filters.book));
    if (filters.chapter) query = query.eq('chapter', Number(filters.chapter));
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new AppError(500, 'Erro ao listar destaques.', error);
    return { data: await this.hydrateVerses((data ?? []) as Row[]), pagination: this.pagination(page, limit, count ?? 0) };
  }

  async upsertHighlight(userId: string, input: HighlightInput): Promise<unknown> {
    await this.assertVerse(input);
    const { data, error } = await this.client.from('destaques_biblicos').upsert(
      { usuario_id: userId, ...input, updated_at: new Date().toISOString() },
      { onConflict: 'usuario_id,version,book,chapter,verse,estilo' },
    ).select('*').single();
    if (error) throw new AppError(500, 'Erro ao salvar destaque.', error);
    return (await this.hydrateVerses([data as Row]))[0];
  }

  async deleteHighlight(userId: string, id: string): Promise<unknown> {
    const { data, error } = await this.client.from('destaques_biblicos').delete()
      .eq('usuario_id', userId).eq('destaque_id', id).select('destaque_id').maybeSingle();
    if (error) throw new AppError(500, 'Erro ao excluir destaque.', error);
    if (!data) throw new AppError(404, 'Destaque nao encontrado.');
    return data;
  }

  private async assertVerse(verse: VerseSelection): Promise<void> {
    const { data, error } = await this.client.from('verses_normalized').select('id').eq('version', verse.version)
      .eq('book', verse.book).eq('chapter', verse.chapter).eq('verse', verse.verse).limit(1).maybeSingle();
    if (error) throw new AppError(500, 'Erro ao validar versiculo.', error);
    if (!data) throw new AppError(400, 'Versiculo nao encontrado.');
  }

  private async hydrateAnnotations(rows: Row[]): Promise<Row[]> {
    return Promise.all(rows.map(async (row) => {
      const refs = (row.anotacoes_biblicas_versiculos ?? []) as VerseSelection[];
      const { anotacoes_biblicas_versiculos: _removed, ...annotation } = row;
      return { ...annotation, versiculos: await this.hydrateVerses(refs as unknown as Row[]) };
    }));
  }

  private async hydrateVerses(rows: Row[]): Promise<Row[]> {
    return Promise.all(rows.map(async (row) => {
      const { data } = await this.client.from('verses_normalized').select('book_name,book_abbrev,text')
        .eq('version', row.version).eq('book', row.book).eq('chapter', row.chapter).eq('verse', row.verse).limit(1).maybeSingle();
      return { ...row, ...(data ?? {}) };
    }));
  }
}
