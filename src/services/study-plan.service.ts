import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { EntityRecord, StudyPlanServiceContract } from '../types/crud.types.js';

const planColumns = 'plano_estudo_id,titulo,slug,descricao,tipo,duracao_dias,ativo,metadata,created_at,updated_at';
const dayColumns = 'plano_estudo_dia_id,plano_estudo_id,dia,titulo,created_at,updated_at';
const readingColumns = [
  'plano_estudo_leitura_id',
  'plano_estudo_dia_id',
  'ordem',
  'book_id',
  'chapter',
  'verse_start',
  'verse_end',
  'versao',
  'versiculo_inicio_id',
  'versiculo_fim_id',
  'created_at',
  'updated_at',
].join(',');

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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

const toInt = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class StudyPlanService implements StudyPlanServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  private async resolvePlan(plan: string): Promise<EntityRecord> {
    const query = this.client.from('planos_estudo').select(planColumns);
    const { data, error } = isUuid(plan)
      ? await query.eq('plano_estudo_id', plan).maybeSingle()
      : await query.eq('slug', plan).maybeSingle();

    if (error) {
      throw new AppError(500, 'Erro ao buscar plano de estudo', error);
    }

    if (!data) {
      throw new AppError(404, 'Plano de estudo nao encontrado');
    }

    return data as EntityRecord;
  }

  private async countDays(planIds: unknown[]): Promise<Record<string, number>> {
    if (planIds.length === 0) {
      return {};
    }

    const { data, error } = await this.client
      .from('planos_estudo_dias')
      .select('plano_estudo_id,dia')
      .in('plano_estudo_id', planIds);

    if (error) {
      throw new AppError(500, 'Erro ao contar dias dos planos de estudo', error);
    }

    return ((data ?? []) as EntityRecord[]).reduce<Record<string, number>>((acc, row) => {
      const planId = String(row.plano_estudo_id);
      acc[planId] = (acc[planId] ?? 0) + 1;
      return acc;
    }, {});
  }

  private async listDays(planId: unknown): Promise<EntityRecord[]> {
    const { data, error } = await this.client
      .from('planos_estudo_dias')
      .select(dayColumns)
      .eq('plano_estudo_id', planId)
      .order('dia', { ascending: true });

    if (error) {
      throw new AppError(500, 'Erro ao listar dias do plano de estudo', error);
    }

    return (data ?? []) as unknown as EntityRecord[];
  }

  private async getDay(planId: unknown, day: number): Promise<EntityRecord> {
    const { data, error } = await this.client
      .from('planos_estudo_dias')
      .select(dayColumns)
      .eq('plano_estudo_id', planId)
      .eq('dia', day)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'Erro ao buscar dia do plano de estudo', error);
    }

    if (!data) {
      throw new AppError(404, 'Dia do plano de estudo nao encontrado');
    }

    return data as EntityRecord;
  }

  private async listReadings(dayId: unknown): Promise<EntityRecord[]> {
    const { data, error } = await this.client
      .from('planos_estudo_leituras')
      .select(readingColumns)
      .eq('plano_estudo_dia_id', dayId)
      .order('ordem', { ascending: true });

    if (error) {
      throw new AppError(500, 'Erro ao listar leituras do dia do plano de estudo', error);
    }

    return (data ?? []) as unknown as EntityRecord[];
  }

  private async enrichReading(reading: EntityRecord, versionOverride?: string): Promise<EntityRecord> {
    const originalVersion = String(reading.versao ?? 'ara');
    const version = versionOverride ?? originalVersion;
    const bookId = toInt(reading.book_id);
    const chapter = toInt(reading.chapter);
    const verseStart = toInt(reading.verse_start) ?? 1;
    const verseEnd = toInt(reading.verse_end);

    if (!bookId || !chapter) {
      return reading;
    }

    let query = this.client
      .from('verses_normalized')
      .select('id,version,testament,book,book_name,book_abbrev,chapter,verse,text,global_order')
      .eq('version', version)
      .eq('book', bookId)
      .eq('chapter', chapter)
      .gte('verse', verseStart)
      .order('verse', { ascending: true });

    if (verseEnd) {
      query = query.lte('verse', verseEnd);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, 'Erro ao buscar versiculos da leitura do plano de estudo', error);
    }

    const verses = ((data ?? []) as unknown as EntityRecord[]).map(sanitizeVerse);
    const first = verses[0];
    const referenceRange = verseEnd ? `:${verseStart}-${verseEnd}` : '';

    return {
      ...reading,
      versao: version,
      versao_original: originalVersion,
      referencia: first ? `${first.book_name} ${chapter}${referenceRange}` : `${bookId} ${chapter}${referenceRange}`,
      texto: {
        version,
        testament: first?.testament ?? null,
        book: bookId,
        book_name: first?.book_name ?? null,
        book_abbrev: first?.book_abbrev ?? null,
        chapter,
        verse_start: verseStart,
        verse_end: verseEnd ?? null,
        verses,
        chapter_text: verses.map((verse) => verse.text).filter(Boolean).join('\n'),
      },
    };
  }

  async listPlans(): Promise<unknown> {
    const { data, error } = await this.client
      .from('planos_estudo')
      .select(planColumns)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Erro ao listar planos de estudo', error);
    }

    const plans = (data ?? []) as EntityRecord[];
    const counts = await this.countDays(plans.map((plan) => plan.plano_estudo_id));

    return plans.map((plan) => ({
      ...plan,
      quantidade_dias: counts[String(plan.plano_estudo_id)] ?? 0,
    }));
  }

  async getPlan(planRef: string): Promise<unknown> {
    const plan = await this.resolvePlan(planRef);
    const days = await this.listDays(plan.plano_estudo_id);

    return {
      ...plan,
      quantidade_dias: days.length,
      dias: days,
    };
  }

  async getPlanDay(planRef: string, dayNumber: number): Promise<unknown> {
    const plan = await this.resolvePlan(planRef);
    const day = await this.getDay(plan.plano_estudo_id, dayNumber);
    const readings = await this.listReadings(day.plano_estudo_dia_id);

    return {
      plano: {
        plano_estudo_id: plan.plano_estudo_id,
        titulo: plan.titulo,
        slug: plan.slug,
        tipo: plan.tipo,
        duracao_dias: plan.duracao_dias,
      },
      dia: {
        ...day,
        quantidade_leituras: readings.length,
        leituras: readings,
      },
    };
  }

  async getPlanDayTexts(planRef: string, dayNumber: number, version?: string): Promise<unknown> {
    const plan = await this.resolvePlan(planRef);
    const day = await this.getDay(plan.plano_estudo_id, dayNumber);
    const readings = await this.listReadings(day.plano_estudo_dia_id);
    const enrichedReadings = await Promise.all(readings.map((reading) => this.enrichReading(reading, version)));

    return {
      plano: {
        plano_estudo_id: plan.plano_estudo_id,
        titulo: plan.titulo,
        slug: plan.slug,
        tipo: plan.tipo,
        duracao_dias: plan.duracao_dias,
      },
      dia: {
        ...day,
        versao: version ?? null,
        quantidade_leituras: enrichedReadings.length,
        leituras: enrichedReadings,
      },
    };
  }
}
