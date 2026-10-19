create table if not exists public.planos_estudo_dias_concluidos (
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  plano_estudo_id uuid not null references public.planos_estudo(plano_estudo_id) on delete cascade,
  plano_estudo_dia_id uuid not null references public.planos_estudo_dias(plano_estudo_dia_id) on delete cascade,
  dia integer not null check (dia > 0),
  concluido_em timestamptz not null default now(),
  primary key (usuario_id, plano_estudo_id, dia)
);

create index if not exists planos_estudo_dias_concluidos_user_idx
  on public.planos_estudo_dias_concluidos (usuario_id, plano_estudo_id);

create table if not exists public.audit_logs (
  log_id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.usuarios(usuario_id) on delete set null,
  category varchar(80) not null,
  action varchar(500) not null,
  status_code integer not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_category_created_idx on public.audit_logs (category, created_at desc);

alter table public.eventos_inscricoes alter column telefone drop not null;

create or replace function public.delete_obpc_account(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.usuarios where usuario_id = p_user_id and lower(email_usuario) = lower(trim(p_email))) then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  insert into public.audit_logs (actor_id, category, action, status_code)
  values (null, 'conta', 'Conta excluída pelo titular', 204);

  delete from public.eventos_inscricoes where lower(email) = lower(trim(p_email));
  delete from public.usuarios where usuario_id = p_user_id;
end;
$$;

revoke all on function public.delete_obpc_account(uuid, text) from public;
grant execute on function public.delete_obpc_account(uuid, text) to service_role;
