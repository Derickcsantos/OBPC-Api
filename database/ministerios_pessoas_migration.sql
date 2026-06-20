begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens',
  'imagens',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.fotos_ministerios (
  foto_ministerio_id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(ministerio_id) on delete cascade,
  url_imagem text not null check (length(trim(url_imagem)) > 0),
  ordem integer not null default 0 check (ordem >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pessoas (
  pessoa_id uuid primary key default gen_random_uuid(),
  url_imagem text,
  nome varchar(150) not null check (length(trim(nome)) > 0),
  cargo varchar(150) not null check (length(trim(cargo)) > 0),
  sobre text not null check (length(trim(sobre)) > 0),
  telefone varchar(30),
  email varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pessoas_email_formato_check check (
    email is null
    or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create or replace function public.normalize_pessoa_email()
returns trigger
language plpgsql
as $$
begin
  new.email = nullif(lower(trim(new.email)), '');
  new.telefone = nullif(trim(new.telefone), '');
  new.url_imagem = nullif(trim(new.url_imagem), '');
  return new;
end;
$$;

drop trigger if exists trg_fotos_ministerios_updated_at on public.fotos_ministerios;
create trigger trg_fotos_ministerios_updated_at
before update on public.fotos_ministerios
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pessoas_updated_at on public.pessoas;
create trigger trg_pessoas_updated_at
before update on public.pessoas
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pessoas_normalize on public.pessoas;
create trigger trg_pessoas_normalize
before insert or update on public.pessoas
for each row
execute function public.normalize_pessoa_email();

-- Novas tabelas.
create index if not exists idx_fotos_ministerios_ministerio_ordem
  on public.fotos_ministerios (ministerio_id, ordem, created_at);
create index if not exists idx_fotos_ministerios_created_at
  on public.fotos_ministerios (created_at desc);
create index if not exists idx_pessoas_nome
  on public.pessoas (nome);
create index if not exists idx_pessoas_cargo
  on public.pessoas (cargo);
create index if not exists idx_pessoas_email
  on public.pessoas (email)
  where email is not null;
create index if not exists idx_pessoas_created_at
  on public.pessoas (created_at desc);

-- Tabelas operacionais existentes.
create index if not exists idx_ministerios_nome
  on public.ministerios (nome_ministerio);
create index if not exists idx_ministerios_created_at
  on public.ministerios (created_at desc);

create index if not exists idx_usuarios_nome
  on public.usuarios (nome_usuario);
create index if not exists idx_usuarios_created_at
  on public.usuarios (created_at desc);

create index if not exists idx_eventos_data_evento
  on public.eventos (data_evento desc);
create index if not exists idx_eventos_created_at
  on public.eventos (created_at desc);
create index if not exists idx_eventos_numero_vagas
  on public.eventos (numero_vagas)
  where numero_vagas is not null;

create index if not exists idx_eventos_imagens_evento_ordem
  on public.eventos_imagens (evento_id, ordem, created_at);
create index if not exists idx_eventos_imagens_created_at
  on public.eventos_imagens (created_at desc);

create index if not exists idx_eventos_inscricoes_evento_status
  on public.eventos_inscricoes (evento_id, status);
create index if not exists idx_eventos_inscricoes_email
  on public.eventos_inscricoes (email);
create index if not exists idx_eventos_inscricoes_created_at
  on public.eventos_inscricoes (created_at desc);

create index if not exists idx_noticias_data_noticia
  on public.noticias (data_noticia desc);
create index if not exists idx_noticias_created_at
  on public.noticias (created_at desc);

create index if not exists idx_louvores_nome
  on public.louvores (nome_louvor);
create index if not exists idx_louvores_created_at
  on public.louvores (created_at desc);

create index if not exists idx_mensagens_nome
  on public.mensagens (nome_mensagem);
create index if not exists idx_mensagens_created_at
  on public.mensagens (created_at desc);

create index if not exists idx_oracoes_status_created_at
  on public.oracoes (status, created_at desc);
create index if not exists idx_oracoes_created_at
  on public.oracoes (created_at desc);

-- Estrutura base da Biblia. Views recebem performance dos indices das tabelas abaixo.
create index if not exists idx_books_testament_id
  on public.books (testament, id);
create index if not exists idx_verses_references_position
  on public.verses_references (book, chapter, verse);
create index if not exists idx_verses_references_global_order
  on public.verses_references (global_order);
create index if not exists idx_verses_texts_version_reference
  on public.verses_texts (version, verse_reference_id);
create index if not exists idx_verses_texts_reference
  on public.verses_texts (verse_reference_id);

commit;
