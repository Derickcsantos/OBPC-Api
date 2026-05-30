begin;

-- A partir deste script, eventos.numero_vagas representa vagas disponiveis.
-- Permite 0 vaga, mas nunca valores negativos.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
      from pg_constraint
     where conrelid = 'eventos'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%numero_vagas%'
  loop
    execute format('alter table eventos drop constraint if exists %I', v_constraint.conname);
  end loop;
end $$;

alter table eventos
  add constraint eventos_numero_vagas_nao_negativo
  check (numero_vagas is null or numero_vagas >= 0);

create or replace function reservar_vaga_evento(p_evento_id uuid)
returns void
language plpgsql
as $$
declare
  v_evento_existe boolean;
begin
  update eventos
     set numero_vagas = case
       when numero_vagas is null then null
       else numero_vagas - 1
     end,
         updated_at = now()
   where evento_id = p_evento_id
     and (numero_vagas is null or numero_vagas > 0);

  if found then
    return;
  end if;

  select exists (
    select 1
      from eventos
     where evento_id = p_evento_id
  )
    into v_evento_existe;

  if not v_evento_existe then
    raise exception 'Evento nao encontrado'
      using errcode = 'P0001';
  end if;

  raise exception 'Evento lotado'
    using errcode = 'P0001';
end;
$$;

create or replace function liberar_vaga_evento(p_evento_id uuid)
returns void
language plpgsql
as $$
begin
  update eventos
     set numero_vagas = case
       when numero_vagas is null then null
       else numero_vagas + 1
     end,
         updated_at = now()
   where evento_id = p_evento_id;
end;
$$;

create or replace function controlar_vagas_evento_inscricao()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'inscrito' then
      perform reservar_vaga_evento(new.evento_id);
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'inscrito'
       and (new.status <> 'inscrito' or new.evento_id <> old.evento_id) then
      perform liberar_vaga_evento(old.evento_id);
    end if;

    if new.status = 'inscrito'
       and (old.status <> 'inscrito' or new.evento_id <> old.evento_id) then
      perform reservar_vaga_evento(new.evento_id);
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'inscrito' then
      perform liberar_vaga_evento(old.evento_id);
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_controlar_vagas_evento_inscricao on eventos_inscricoes;

create trigger trg_controlar_vagas_evento_inscricao
before insert or update or delete on eventos_inscricoes
for each row
execute function controlar_vagas_evento_inscricao();

create or replace function inscrever_evento(
  p_evento_id uuid,
  p_nome varchar,
  p_email varchar,
  p_telefone varchar
)
returns eventos_inscricoes
language plpgsql
as $$
declare
  v_inscricao eventos_inscricoes%rowtype;
begin
  insert into eventos_inscricoes (evento_id, nome, email, telefone, status)
  values (p_evento_id, p_nome, lower(trim(p_email)), p_telefone, 'inscrito')
  returning * into v_inscricao;

  return v_inscricao;
exception
  when unique_violation then
    raise exception 'Email ja inscrito neste evento'
      using errcode = '23505';
end;
$$;

commit;
