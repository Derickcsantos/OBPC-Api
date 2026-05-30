alter table eventos add column if not exists url_capa text;
alter table eventos add column if not exists numero_vagas integer check (numero_vagas is null or numero_vagas > 0);
alter table eventos add column if not exists endereco_evento text;
alter table eventos add column if not exists hora_inicio time;
alter table eventos add column if not exists observacao_evento text;
alter table eventos add column if not exists responsavel_nome varchar(150);
alter table eventos add column if not exists responsavel_telefone varchar(20);

alter table noticias add column if not exists url_capa text;

create table if not exists eventos_imagens (
  imagem_id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(evento_id) on delete cascade,
  url_imagem text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table eventos_imagens drop column if exists storage_key;
alter table eventos_imagens drop column if exists descricao;

create table if not exists eventos_inscricoes (
  inscricao_id bigserial primary key,
  evento_id uuid not null references eventos(evento_id) on delete cascade,
  nome varchar(150) not null,
  email varchar(255) not null,
  telefone varchar(20) not null,
  status varchar(20) not null default 'inscrito' check (status in ('inscrito', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evento_id, email)
);

create index if not exists idx_eventos_numero_vagas on eventos (numero_vagas);
create index if not exists idx_eventos_imagens_evento_id on eventos_imagens (evento_id);
create index if not exists idx_eventos_imagens_ordem on eventos_imagens (evento_id, ordem asc, created_at asc);
create index if not exists idx_eventos_inscricoes_evento_id on eventos_inscricoes (evento_id);
create index if not exists idx_eventos_inscricoes_email on eventos_inscricoes (email);
create index if not exists idx_eventos_inscricoes_status on eventos_inscricoes (status);

drop trigger if exists trg_eventos_imagens_updated_at on eventos_imagens;
create trigger trg_eventos_imagens_updated_at
before update on eventos_imagens
for each row
execute function set_updated_at();

drop trigger if exists trg_eventos_inscricoes_updated_at on eventos_inscricoes;
create trigger trg_eventos_inscricoes_updated_at
before update on eventos_inscricoes
for each row
execute function set_updated_at();

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
  v_evento eventos%rowtype;
  v_total_inscritos integer;
  v_inscricao eventos_inscricoes%rowtype;
begin
  select *
    into v_evento
    from eventos
   where evento_id = p_evento_id
   for update;

  if not found then
    raise exception 'Evento nao encontrado';
  end if;

  select count(*)
    into v_total_inscritos
    from eventos_inscricoes
   where evento_id = p_evento_id
     and status = 'inscrito';

  if v_evento.numero_vagas is not null and v_total_inscritos >= v_evento.numero_vagas then
    raise exception 'Evento lotado';
  end if;

  insert into eventos_inscricoes (evento_id, nome, email, telefone, status)
  values (p_evento_id, p_nome, lower(trim(p_email)), p_telefone, 'inscrito')
  returning * into v_inscricao;

  return v_inscricao;
exception
  when unique_violation then
    raise exception 'Email ja inscrito neste evento';
end;
$$;
