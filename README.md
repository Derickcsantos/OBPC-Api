# Church Mobile API

API completa para app mobile de igreja com:

- Node.js + TypeScript
- Fastify
- Zod para validação
- Arquitetura em camadas (`controllers`, `services`, `routes`, `dtos`, `middlewares`, `utils`, `tests`)
- CRUDs: ministérios, usuários, eventos, notícias, louvores e mensagens
- Sessão Bíblia integrada com API externa
- Banco via Supabase

## Configuração

1. Copie `.env.example` para `.env`
2. Preencha as variáveis
3. Execute:

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - desenvolvimento
- `npm run build` - build TypeScript
- `npm run start` - inicia build
- `npm run typecheck` - validação de tipos
- `npm run test` - testes

## SQL

Script completo em `database/schema.sql`.
