# Orações, anotações, destaques e administração

Todos os endpoints pessoais exigem `Authorization: Bearer <token>`. Operações de conteúdo e rotas sob `/api/admin` exigem que o usuário continue com `role = admin` no banco.

Os contratos completos e os valores aceitos estão em `user-content-api-documentation.json`. A estrutura necessária está na migration `database/user_bible_content_admin_migration.sql`, que deve ser aplicada antes do deploy da API.

O upload administrativo usa `POST /api/admin/uploads` em `multipart/form-data`, com os campos `file` e `context`. Consulte também `openapi-user-content.json` e `ADMIN_UPLOAD_CURL.md`.

## Configuração segura do Worker

`wrangler.jsonc` contém somente configuração pública. Cadastre valores sensíveis com `wrangler secret put`, incluindo `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_JWT_SECRET`, `GOOGLE_SECRET_KEY`, `BIBLE_API_KEY`, `REDIS_URL` e credenciais de storage. `SUPABASE_URL`, IDs OAuth e URLs públicas podem ser configurados como vars do ambiente de deploy.

Os segredos anteriormente expostos devem ser rotacionados nos respectivos provedores antes de qualquer publicação.
