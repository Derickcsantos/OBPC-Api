-- Execute this migration in Supabase before publishing the gallery feature.
create table if not exists public.pessoas_imagens (
  pessoa_imagem_id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(pessoa_id) on delete cascade,
  url_imagem text not null,
  ordem integer not null default 0 check (ordem >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pessoas_imagens_pessoa_ordem_idx
  on public.pessoas_imagens (pessoa_id, ordem, created_at);
