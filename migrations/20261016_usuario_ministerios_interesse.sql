-- Execute in Supabase before publishing the ministry-interest feature.
create table if not exists public.usuario_ministerios_interesse (
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  ministerio_id uuid not null references public.ministerios(ministerio_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, ministerio_id)
);

create index if not exists usuario_ministerios_interesse_ministerio_idx
  on public.usuario_ministerios_interesse (ministerio_id, created_at);
