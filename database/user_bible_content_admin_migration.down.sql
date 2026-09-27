begin;

drop function if exists public.upsert_bible_annotation(uuid, uuid, text, text, jsonb);
drop table if exists public.destaques_biblicos;
drop table if exists public.anotacoes_biblicas_versiculos;
drop table if exists public.anotacoes_biblicas;
drop index if exists public.idx_usuario_oracoes_oradas_usuario_created_at;
alter table public.usuarios drop column if exists role;
alter table public.mensagens drop column if exists url_capa;
drop type if exists public.usuario_role_enum;

commit;
