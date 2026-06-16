-- Indices para a API de Biblia multi-versao.
-- Rode em uma janela de baixa movimentacao, principalmente os indices GIN.

create extension if not exists pg_trgm;

create index if not exists idx_books_testament_id
  on books (testament, id);

create unique index if not exists idx_verses_references_position
  on verses_references (book, chapter, verse);

create index if not exists idx_verses_references_global_order
  on verses_references (global_order);

create unique index if not exists idx_verses_texts_version_reference
  on verses_texts (version, verse_reference_id);

create index if not exists idx_verses_texts_reference
  on verses_texts (verse_reference_id);

create index if not exists idx_verses_texts_text_trgm
  on verses_texts using gin (text gin_trgm_ops);

do $$
begin
  if exists (select 1 from pg_class where oid = 'verses_normalized'::regclass and relkind in ('r', 'm', 'p')) then
    create index if not exists idx_verses_normalized_version_position
      on verses_normalized (version, book, chapter, verse);
    create index if not exists idx_verses_normalized_version_global_order
      on verses_normalized (version, global_order);
    create index if not exists idx_verses_normalized_text_trgm
      on verses_normalized using gin (text gin_trgm_ops);
  end if;
exception
  when undefined_table then null;
end $$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'chapter_texts'::regclass and relkind in ('r', 'm', 'p')) then
    create index if not exists idx_chapter_texts_version_position
      on chapter_texts (version, book, chapter);
    create index if not exists idx_chapter_texts_book_chapter
      on chapter_texts (book, chapter);
  end if;
exception
  when undefined_table then null;
end $$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'verses_comparisons'::regclass and relkind in ('r', 'm', 'p')) then
    create index if not exists idx_verses_comparisons_position
      on verses_comparisons (book, chapter, verse);
  end if;
exception
  when undefined_table then null;
end $$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'chapter_comparisons'::regclass and relkind in ('r', 'm', 'p')) then
    create index if not exists idx_chapter_comparisons_version_position
      on chapter_comparisons (version, book, chapter);
  end if;
exception
  when undefined_table then null;
end $$;
