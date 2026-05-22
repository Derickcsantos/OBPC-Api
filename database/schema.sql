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
  telefone_usuario varchar(20) not null,
  senha_usuario text not null,
  email_usuario varchar(255) not null unique,
  data_nascimento date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists eventos (
  evento_id uuid primary key default gen_random_uuid(),
  nome_evento varchar(150) not null,
  descricao_evento text not null,
  data_evento timestamptz not null,
  link_evento text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists noticias (
  noticia_id uuid primary key default gen_random_uuid(),
  nome_noticia varchar(150) not null,
  mensagem_noticia text not null,
  data_noticia timestamptz not null,
  observacao_noticia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists idx_ministerios_created_at on ministerios (created_at desc);
create index if not exists idx_usuarios_created_at on usuarios (created_at desc);
create index if not exists idx_eventos_created_at on eventos (created_at desc);
create index if not exists idx_eventos_data_evento on eventos (data_evento desc);
create index if not exists idx_noticias_created_at on noticias (created_at desc);
create index if not exists idx_noticias_data_noticia on noticias (data_noticia desc);
create index if not exists idx_louvores_created_at on louvores (created_at desc);
create index if not exists idx_mensagens_created_at on mensagens (created_at desc);
create index if not exists idx_oracoes_created_at on oracoes (created_at desc);
create index if not exists idx_oracoes_status on oracoes (status);

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
