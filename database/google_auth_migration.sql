begin;

alter table public.usuarios alter column telefone_usuario drop not null;
alter table public.usuarios alter column senha_usuario drop not null;
alter table public.usuarios alter column data_nascimento drop not null;

alter table public.usuarios add column if not exists google_sub varchar(255);
alter table public.usuarios add column if not exists avatar_url text;
alter table public.usuarios add column if not exists auth_provider varchar(30) not null default 'local';

create unique index if not exists idx_usuarios_google_sub
  on public.usuarios (google_sub)
  where google_sub is not null;

commit;
