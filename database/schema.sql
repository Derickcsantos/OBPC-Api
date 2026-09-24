create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  create type status_oracao_enum as enum ('em andamento', 'finalizado', 'concluído');
exception
  when duplicate_object then null;
end $$;

create table if not exists ministerios (
  ministerio_id uuid primary key default gen_random_uuid(),
  nome_ministerio varchar(150) not null,
  descricao_ministerio text not null,
  url_ministerio text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usuarios (
  usuario_id uuid primary key default gen_random_uuid(),
  nome_usuario varchar(150) not null,
  telefone_usuario varchar(20),
  senha_usuario text,
  email_usuario varchar(255) not null unique,
  data_nascimento date,
  google_sub varchar(255) unique,
  avatar_url text,
  auth_provider varchar(30) not null default 'local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table usuarios alter column telefone_usuario drop not null;
alter table usuarios alter column senha_usuario drop not null;
alter table usuarios alter column data_nascimento drop not null;
alter table usuarios add column if not exists google_sub varchar(255);
alter table usuarios add column if not exists avatar_url text;
alter table usuarios add column if not exists auth_provider varchar(30) not null default 'local';
create unique index if not exists idx_usuarios_google_sub on usuarios (google_sub) where google_sub is not null;

create table if not exists eventos (
  evento_id uuid primary key default gen_random_uuid(),
  nome_evento varchar(150) not null,
  descricao_evento text not null,
  data_evento timestamptz not null,
  link_evento text not null,
  url_capa text,
  numero_vagas integer check (numero_vagas is null or numero_vagas > 0),
  endereco_evento text,
  hora_inicio time,
  observacao_evento text,
  responsavel_nome varchar(150),
  responsavel_telefone varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table eventos add column if not exists url_capa text;
alter table eventos add column if not exists numero_vagas integer check (numero_vagas is null or numero_vagas > 0);
alter table eventos add column if not exists endereco_evento text;
alter table eventos add column if not exists hora_inicio time;
alter table eventos add column if not exists observacao_evento text;
alter table eventos add column if not exists responsavel_nome varchar(150);
alter table eventos add column if not exists responsavel_telefone varchar(20);

create table if not exists noticias (
  noticia_id uuid primary key default gen_random_uuid(),
  nome_noticia varchar(150) not null,
  mensagem_noticia text not null,
  data_noticia timestamptz not null,
  url_capa text,
  observacao_noticia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists louvores (
  louvor_id uuid primary key default gen_random_uuid(),
  nome_louvor varchar(150) not null,
  url_louvor text not null,
  observacao_louvor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mensagens (
  mensagem_id uuid primary key default gen_random_uuid(),
  nome_mensagem varchar(150) not null,
  texto_mensagem text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists oracoes (
  oracao_id uuid primary key default gen_random_uuid(),
  nome_pedido varchar(150) not null,
  descricao_pedido text not null,
  mostrar_grupo boolean not null default true,
  aceita_ligacao boolean not null default true,
  status status_oracao_enum not null default 'em andamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usuario_oracoes_oradas (
  usuario_id uuid not null references usuarios(usuario_id) on delete cascade,
  oracao_id uuid not null references oracoes(oracao_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, oracao_id)
);

create table if not exists usuario_ministerios_interesse (
  usuario_id uuid not null references usuarios(usuario_id) on delete cascade,
  ministerio_id uuid not null references ministerios(ministerio_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, ministerio_id)
);

create index if not exists idx_ministerios_created_at on ministerios (created_at desc);
create index if not exists idx_usuarios_created_at on usuarios (created_at desc);
create index if not exists idx_eventos_created_at on eventos (created_at desc);
create index if not exists idx_eventos_data_evento on eventos (data_evento desc);
create index if not exists idx_eventos_numero_vagas on eventos (numero_vagas);
create index if not exists idx_eventos_imagens_evento_id on eventos_imagens (evento_id);
create index if not exists idx_eventos_imagens_ordem on eventos_imagens (evento_id, ordem asc, created_at asc);
create index if not exists idx_eventos_inscricoes_evento_id on eventos_inscricoes (evento_id);
create index if not exists idx_eventos_inscricoes_email on eventos_inscricoes (email);
create index if not exists idx_eventos_inscricoes_status on eventos_inscricoes (status);
create index if not exists idx_noticias_created_at on noticias (created_at desc);
create index if not exists idx_noticias_data_noticia on noticias (data_noticia desc);
create index if not exists idx_louvores_created_at on louvores (created_at desc);
create index if not exists idx_mensagens_created_at on mensagens (created_at desc);
create index if not exists idx_oracoes_created_at on oracoes (created_at desc);
create index if not exists idx_oracoes_status on oracoes (status);
create index if not exists idx_usuario_oracoes_oradas_oracao_created_at
  on usuario_oracoes_oradas (oracao_id, created_at asc);
create index if not exists idx_usuario_ministerios_interesse_ministerio_created_at
  on usuario_ministerios_interesse (ministerio_id, created_at asc);

drop trigger if exists trg_ministerios_updated_at on ministerios;
create trigger trg_ministerios_updated_at
before update on ministerios
for each row
execute function set_updated_at();

drop trigger if exists trg_usuarios_updated_at on usuarios;
create trigger trg_usuarios_updated_at
before update on usuarios
for each row
execute function set_updated_at();

drop trigger if exists trg_eventos_updated_at on eventos;
create trigger trg_eventos_updated_at
before update on eventos
for each row
execute function set_updated_at();

drop trigger if exists trg_noticias_updated_at on noticias;
create trigger trg_noticias_updated_at
before update on noticias
for each row
execute function set_updated_at();

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

drop trigger if exists trg_louvores_updated_at on louvores;
create trigger trg_louvores_updated_at
before update on louvores
for each row
execute function set_updated_at();

drop trigger if exists trg_mensagens_updated_at on mensagens;
create trigger trg_mensagens_updated_at
before update on mensagens
for each row
execute function set_updated_at();

drop trigger if exists trg_oracoes_updated_at on oracoes;
create trigger trg_oracoes_updated_at
before update on oracoes
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
