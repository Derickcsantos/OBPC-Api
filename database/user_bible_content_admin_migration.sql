begin;

do $$ begin
  create type public.usuario_role_enum as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

alter table public.usuarios
  add column if not exists role public.usuario_role_enum not null default 'user';

alter table public.mensagens add column if not exists url_capa text;

create table if not exists public.anotacoes_biblicas (
  anotacao_id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  titulo varchar(200),
  conteudo text not null check (length(trim(conteudo)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anotacoes_biblicas_versiculos (
  anotacao_id uuid not null references public.anotacoes_biblicas(anotacao_id) on delete cascade,
  version varchar(20) not null,
  book integer not null check (book > 0),
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  created_at timestamptz not null default now(),
  primary key (anotacao_id, version, book, chapter, verse)
);

create table if not exists public.destaques_biblicos (
  destaque_id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  version varchar(20) not null,
  book integer not null check (book > 0),
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  estilo varchar(20) not null check (estilo in ('background', 'underline')),
  cor varchar(20) not null check (cor in ('yellow', 'green', 'blue', 'pink', 'purple')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, version, book, chapter, verse, estilo)
);

create index if not exists idx_usuario_oracoes_oradas_usuario_created_at
  on public.usuario_oracoes_oradas(usuario_id, created_at desc);
create index if not exists idx_usuario_oracoes_oradas_oracao_created_at
  on public.usuario_oracoes_oradas(oracao_id, created_at desc);
create index if not exists idx_anotacoes_biblicas_usuario_updated_at
  on public.anotacoes_biblicas(usuario_id, updated_at desc);
create index if not exists idx_destaques_biblicos_usuario_referencia
  on public.destaques_biblicos(usuario_id, version, book, chapter, verse);

drop trigger if exists trg_anotacoes_biblicas_updated_at on public.anotacoes_biblicas;
create trigger trg_anotacoes_biblicas_updated_at before update on public.anotacoes_biblicas
for each row execute function public.set_updated_at();
drop trigger if exists trg_destaques_biblicos_updated_at on public.destaques_biblicos;
create trigger trg_destaques_biblicos_updated_at before update on public.destaques_biblicos
for each row execute function public.set_updated_at();

create or replace function public.upsert_bible_annotation(
  p_usuario_id uuid,
  p_anotacao_id uuid,
  p_titulo text,
  p_conteudo text,
  p_versiculos jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_item jsonb;
begin
  if p_versiculos is null or jsonb_typeof(p_versiculos) <> 'array' or jsonb_array_length(p_versiculos) < 1 then
    raise exception 'VERSICULOS_OBRIGATORIOS';
  end if;

  for v_item in select value from jsonb_array_elements(p_versiculos) loop
    if not exists (
      select 1 from public.verses_normalized
      where version = lower(v_item->>'version')
        and book = (v_item->>'book')::integer
        and chapter = (v_item->>'chapter')::integer
        and verse = (v_item->>'verse')::integer
    ) then raise exception 'VERSICULO_NAO_ENCONTRADO'; end if;
  end loop;

  if p_anotacao_id is null then
    insert into public.anotacoes_biblicas(usuario_id, titulo, conteudo)
    values (p_usuario_id, nullif(trim(p_titulo), ''), trim(p_conteudo)) returning anotacao_id into v_id;
  else
    update public.anotacoes_biblicas set titulo = nullif(trim(p_titulo), ''), conteudo = trim(p_conteudo)
    where anotacao_id = p_anotacao_id and usuario_id = p_usuario_id returning anotacao_id into v_id;
    if v_id is null then raise exception 'ANOTACAO_NAO_ENCONTRADA'; end if;
    delete from public.anotacoes_biblicas_versiculos where anotacao_id = v_id;
  end if;

  insert into public.anotacoes_biblicas_versiculos(anotacao_id, version, book, chapter, verse)
  select distinct v_id, lower(value->>'version'), (value->>'book')::integer,
    (value->>'chapter')::integer, (value->>'verse')::integer
  from jsonb_array_elements(p_versiculos);
  return v_id;
end;
$$;

revoke all on function public.upsert_bible_annotation(uuid, uuid, text, text, jsonb) from public;
grant execute on function public.upsert_bible_annotation(uuid, uuid, text, text, jsonb) to service_role;

commit;

-- Promova o primeiro administrador somente após escolher explicitamente a conta:
-- update public.usuarios set role = 'admin' where email_usuario = 'admin@exemplo.com';
