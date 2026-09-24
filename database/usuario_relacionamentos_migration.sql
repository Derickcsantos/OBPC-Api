begin;

create table if not exists public.usuario_oracoes_oradas (
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  oracao_id uuid not null references public.oracoes(oracao_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, oracao_id)
);

create table if not exists public.usuario_ministerios_interesse (
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  ministerio_id uuid not null references public.ministerios(ministerio_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, ministerio_id)
);

create index if not exists idx_usuario_oracoes_oradas_oracao_created_at
  on public.usuario_oracoes_oradas (oracao_id, created_at asc);
create index if not exists idx_usuario_ministerios_interesse_ministerio_created_at
  on public.usuario_ministerios_interesse (ministerio_id, created_at asc);

commit;