alter table public.usuarios add column if not exists apple_sub varchar(255);
create unique index if not exists idx_usuarios_apple_sub on public.usuarios (apple_sub) where apple_sub is not null;
