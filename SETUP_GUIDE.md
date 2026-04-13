# Guia de Setup - Church Mobile API

## 1. Configuração do Banco de Dados (Supabase)

### 1.1 Execute o Script SQL

Acesse seu painel de Supabase e execute o script completo localizado em:

**Arquivo**: `database/schema.sql`

Este script criar todas as 6 tabelas com os atributos exatos solicitados:

- **ministerios**: ministerio_id, nome_ministerio, descricao_ministerio, url_ministerio, created_at, updated_at
- **usuarios**: usuario_id, nome_usuario, telefone_usuario, senha_usuario, email_usuario, data_nascimento, created_at, updated_at
- **eventos**: evento_id, nome_evento, descricao_evento, data_evento, link_evento, created_at, updated_at
- **noticias**: noticia_id, nome_noticia, mensagem_noticia, data_noticia, observacao_noticia, created_at, updated_at
- **louvores**: louvor_id, nome_louvor, url_louvor, observacao_louvor, created_at, updated_at
- **mensagens**: mensagem_id, nome_mensagem, texto_mensagem, created_at, updated_at

### 1.2 Ativar RLS (Row Level Security) [Opcional]

Para segurança em produção, você pode ativar RLS nas tabelas. O SQL fornecido já inclui triggers para `updated_at` automático.

## 2. Configuração Local

### 2.1 Copiar e Configurar .env

O arquivo `.env` já está pré-configurado com:

```env
NODE_ENV=development
PORT=3333
SUPABASE_URL=https://gydjvkykgzpgqxfmxusk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
BIBLE_API_BASE_URL=https://pesquisarnabiblia.com.br/api-projeto/api
BIBLE_API_KEY=657f49a093e7b5360...
```

Não há necessidade de mudanças; a API está pronta para usar.

### 2.2 Instalar Dependências

```bash
npm install
```

### 2.3 Iniciar o Servidor (Desenvolvimento)

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3333`

### 2.4 Validar a Instalação

```bash
# Verificar tipos e lógica
npm run typecheck

# Rodar testes
npm run test

# Build Production
npm run build

# Iniciar versão compilada
npm run start
```

## 3. Endpoints Disponíveis

### Health Check

```http
GET /health
```

Resposta: `{ "status": "ok" }`

### CRUDs (CRUD padrão para cada recurso)

Todos os 6 CRUDs seguem o mesmo padrão RESTful:

#### Ministérios
- `GET /api/ministerios` - Listar todos
- `GET /api/ministerios/:id` - Buscar por ID
- `POST /api/ministerios` - Criar
- `PUT /api/ministerios/:id` - Atualizar
- `DELETE /api/ministerios/:id` - Remover

#### Usuários
- `GET /api/usuarios` - Listar todos
- `GET /api/usuarios/:id` - Buscar por ID
- `POST /api/usuarios` - Criar (senha é hashada com bcrypt)
- `PUT /api/usuarios/:id` - Atualizar (senha rehasheada se modificada)
- `DELETE /api/usuarios/:id` - Remover

**Nota**: Senhas são automaticamente ocultadas na resposta.

#### Eventos
- `GET /api/eventos` - Listar todos
- `GET /api/eventos/:id` - Buscar por ID
- `POST /api/eventos` - Criar
- `PUT /api/eventos/:id` - Atualizar
- `DELETE /api/eventos/:id` - Remover

#### Notícias
- `GET /api/noticias` - Listar todos
- `GET /api/noticias/:id` - Buscar por ID
- `POST /api/noticias` - Criar
- `PUT /api/noticias/:id` - Atualizar
- `DELETE /api/noticias/:id` - Remover

#### Louvores
- `GET /api/louvores` - Listar todos
- `GET /api/louvores/:id` - Buscar por ID
- `POST /api/louvores` - Criar
- `PUT /api/louvores/:id` - Atualizar
- `DELETE /api/louvores/:id` - Remover

#### Mensagens
- `GET /api/mensagens` - Listar todos
- `GET /api/mensagens/:id` - Buscar por ID
- `POST /api/mensagens` - Criar
- `PUT /api/mensagens/:id` - Atualizar
- `DELETE /api/mensagens/:id` - Remover

### Sessão Bíblia (API Externa Integrada)

Todos os endpoints incluem autenticação automática via Bearer Token com a API `pesquisarnabiblia.com.br`

#### Versões da Bíblia
```http
GET /api/biblia/versions
```

Exemplo de Resposta:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Almeida Corrigida e Fiel"
    }
  ]
}
```

#### Listar Livros de uma Versão
```http
GET /api/biblia/books?version_id=1
```

#### Listar Capítulos de um Livro
```http
GET /api/biblia/chapters?version_id=1&book_id=1
```

#### Buscar Versículos
```http
GET /api/biblia/verses?version_id=1&book_id=1&chapter_id=1
```

**Parâmetros opcionais**:
- `verse` - Um versículo específico
- `verse_start` e `verse_end` - Intervalo de versículos

Exemplos:
```http
GET /api/biblia/verses?version_id=1&book_id=1&chapter_id=1&verse=1
GET /api/biblia/verses?version_id=1&book_id=1&chapter_id=1&verse_start=1&verse_end=5
```

#### Pesquisar Versículos com Palavras Exatas
```http
GET /api/biblia/search?version_id=1&keyword=Deus
```

**Parâmetros opcionais**:
- `book_id` - Livro específico
- `chapter_id` - Capítulo específico
- `verse_start` e `verse_end` - Intervalo de versículos

## 4. Exemplos de Requisições

### Criar Ministério

```bash
curl -X POST http://localhost:3333/api/ministerios \
  -H "Content-Type: application/json" \
  -d '{
    "nome_ministerio": "Jovens em Movimento",
    "descricao_ministerio": "Ministério voltado para jovens adulttos",
    "url_ministerio": "https://Igreja.com/jovens"
  }'
```

Resposta (201):
```json
{
  "message": "ministerios criado com sucesso",
  "data": {
    "ministerio_id": "uuid-value",
    "nome_ministerio": "Jovens em Movimento",
    "descricao_ministerio": "Ministério voltado para jovens adulttos",
    "url_ministerio": "https://Igreja.com/jovens",
    "created_at": "2025-04-13T...",
    "updated_at": "2025-04-13T..."
  }
}
```

### Criar Usuário

```bash
curl -X POST http://localhost:3333/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome_usuario": "João Silva",
    "telefone_usuario": "11987654321",
    "senha_usuario": "senhaSegura123",
    "email_usuario": "joao@exemplo.com",
    "data_nascimento": "1990-01-15"
  }'
```

Resposta (201):
```json
{
  "message": "usuarios criado com sucesso",
  "data": {
    "usuario_id": "uuid-value",
    "nome_usuario": "João Silva",
    "telefone_usuario": "11987654321",
    "email_usuario": "joao@exemplo.com",
    "data_nascimento": "1990-01-15",
    "created_at": "2025-04-13T...",
    "updated_at": "2025-04-13T..."
  }
}
```

**Nota**: A senha não é retornada na resposta por segurança.

### Listar Versículos da Bíblia

```bash
curl -X GET "http://localhost:3333/api/biblia/verses?version_id=1&book_id=1&chapter_id=1&verse=1"
```

Resposta (200):
```json
{
  "data": {
    "verses": [
      {
        "verse_id": 1,
        "book_name": "Gênesis",
        "chapter": 1,
        "verse_number": 1,
        "text": "No princípio, Deus criou os céus e a terra."
      }
    ]
  }
}
```

## 5. Estrutura de Pastas

```
src/
├── config/              # Configurações (env, etc)
│   └── env.ts
├── controllers/         # Controladores (lógica de endpoint)
│   ├── crud.controller.ts
│   └── bible.controller.ts
├── dtos/               # Data Transfer Objects (validação Zod)
│   ├── ministerios.dto.ts
│   ├── usuarios.dto.ts
│   ├── eventos.dto.ts
│   ├── noticias.dto.ts
│   ├── louvores.dto.ts
│   ├── mensagens.dto.ts
│   ├── biblia.dto.ts
│   └── common.dto.ts
├── lib/                # Bibliotecas de cliente (Supabase, etc)
│   └── supabase.ts
├── middlewares/        # Middleware (erro, CORS, etc)
│   └── error-handler.middleware.ts
├── routes/             # Definição de rotas e registros
│   ├── index.ts
│   ├── ministerios.routes.ts
│   ├── usuarios.routes.ts
│   ├── eventos.routes.ts
│   ├── noticias.routes.ts
│   ├── louvores.routes.ts
│   ├── mensagens.routes.ts
│   ├── biblia.routes.ts
│   └── crud-route.factory.ts
├── services/           # Lógica de negócio
│   ├── crud.service.ts
│   └── bible.service.ts
├── types/              # Tipos TypeScript
│   └── crud.types.ts
├── utils/              # Utilitários
│   ├── app-error.ts
│   └── validation.ts
├── app.ts              # Factory da aplicação
└── server.ts           # Bootstrap do servidor

tests/
├── app.test.ts         # Testes integrados
└── helpers/
    └── fake-crud.service.ts

database/
└── schema.sql          # Script SQL completo
```

## 6. Validação e Tratamento de Erros

### Validações Automáticas (Zod)

Todos os endpoints validam entrada com Zod. Erro de validação retorna status `400`:

```json
{
  "message": "Erro de validação",
  "details": {
    "fieldErrors": {
      "email_usuario": ["Invalid email address"]
    }
  }
}
```

### Tratamento de Erros

- `400 Bad Request` - Validação ou parâmetro inválido
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor ou banco

## 7. Tecnologias

- **Node.js** com **TypeScript**
- **Fastify** (framework web moderno)
- **Zod** (validação runtime-safe)
- **Supabase** (banco PostgreSQL)
- **bcryptjs** (hash de senhas)
- **Vitest** (testes)
- **Supertest** (testes de API)

## 8. Próximas Etapas (Opcional)

- Adicionar autenticação JWT
- Implementar refresh tokens
- Adicionar logs estruturados
- Setup CI/CD (GitHub Actions)
- Deploy em container (Docker)
- Implementar cache (Redis)
- Rate limiting
- Documentação Swagger/OpenAPI

## Suporte

Para dúvidas sobre a integração com a API da Bíblia:
https://pesquisarnabiblia.com.br/api-projeto/public/documentacao.php
