# Documentacao da API da Biblia

Base URL local:

```text
http://localhost:3333/api/biblia
```

Todas as rotas usam `GET` e retornam JSON.

Versao padrao quando `version` nao e informado: `nvi`.

Limite maximo de paginacao: `100` itens por pagina.

## Formato de paginacao

Endpoints paginados retornam:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Parametros comuns:

| Parametro | Tipo | Padrao | Descricao |
| --- | --- | --- | --- |
| `page` | number | `1` | Pagina atual. Deve ser inteiro positivo. |
| `limit` | number | `100` | Quantidade por pagina. Maximo `100`. |

## Cache e performance

A API usa cache Redis quando `REDIS_URL` esta configurado. O TTL vem de `REDIS_CACHE_TTL_SECONDS`.

Rotas cacheadas:

- `GET /testaments`
- `GET /versions`
- `GET /books`
- `GET /chapters`
- `GET /books/:book_id/chapters/:chapter`
- `GET /books/:book_id/verses` quando nao ha busca textual
- `GET /verses` quando nao ha busca textual
- `GET /compare`

Rotas com busca textual nao usam cache por padrao, para evitar criar muitas chaves dinamicas:

- `GET /search`
- `GET /verses?keyword=...`
- `GET /verses?q=...`
- `GET /verses?text=...`

Tabelas/views usadas:

- `bible_versions`
- `books`
- `testaments`
- `chapter_texts`
- `verses_normalized`
- `verses_comparisons`

Indices recomendados:

```text
database/bible_performance_indexes.sql
```

## Erros

Erro de validacao:

```json
{
  "message": "Erro de validacao",
  "details": {
    "fieldErrors": {
      "book_id": ["Invalid input"]
    }
  }
}
```

Capitulo nao encontrado:

```json
{
  "message": "Capitulo da Biblia nao encontrado"
}
```

Erros internos de consulta retornam status `500` com uma mensagem como:

```json
{
  "message": "Erro ao buscar versos da Biblia"
}
```

## GET /testaments

Lista os testamentos.

Exemplo:

```bash
curl "http://localhost:3333/api/biblia/testaments"
```

Resposta:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Antigo Testamento"
    },
    {
      "id": 2,
      "name": "Novo Testamento"
    }
  ]
}
```

## GET /versions

Lista as versoes biblicas disponiveis.

Exemplo:

```bash
curl "http://localhost:3333/api/biblia/versions"
```

Resposta:

```json
{
  "data": [
    {
      "id": "nvi",
      "code": "nvi",
      "name": "NVI",
      "language": "pt-BR",
      "source_file": "NVI.json",
      "comparison_scope": "verse",
      "total_books": 66,
      "total_chapters": 1189,
      "total_verses": 31105,
      "created_at": "2026-06-16T12:34:36.148756+00:00",
      "updated_at": "2026-06-16T12:34:36.148756+00:00"
    }
  ]
}
```

Campos importantes:

| Campo | Descricao |
| --- | --- |
| `id` | Mesmo valor de `code`, usado pelo cliente como identificador da versao. |
| `code` | Codigo usado no parametro `version`. Exemplo: `nvi`, `ara`, `arc`, `naa`, `kja`, `mens`. |
| `comparison_scope` | Indica se a versao e comparavel por verso ou por capitulo. |
| `total_books` | Total de livros carregados para a versao. |
| `total_chapters` | Total de capitulos carregados para a versao. |
| `total_verses` | Total de versos carregados para a versao. |

## GET /books

Lista livros da Biblia.

Parametros:

| Parametro | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `testament_id` | number | Nao | Filtra por testamento. `1` antigo, `2` novo. |
| `testament` | number | Nao | Alias de `testament_id`. |
| `version_id` | number | Nao | Mantido por compatibilidade, nao e usado pela estrutura multi-versao atual. |

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/books"
curl "http://localhost:3333/api/biblia/books?testament_id=1"
curl "http://localhost:3333/api/biblia/books?testament=2"
```

Resposta:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Genesis",
      "abbrev": "gn",
      "testament": 1
    },
    {
      "id": 2,
      "name": "Exodo",
      "abbrev": "ex",
      "testament": 1
    }
  ]
}
```

## GET /chapters

Lista capitulos usando a tabela/view `chapter_texts`.

Por padrao retorna somente metadados do capitulo. Para trazer texto e lista de versos, use `include_text=true` ou `include_verses=true`.

Parametros:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `version` | string | Nao | `nvi` | Codigo da versao. |
| `book_id` | number | Nao | - | Filtra por livro. |
| `include_text` | boolean/string | Nao | `false` | Inclui `chapter_text` e `verses`. Aceita `true` ou `1`. |
| `include_verses` | boolean/string | Nao | `false` | Igual a `include_text`. Aceita `true` ou `1`. |
| `page` | number | Nao | `1` | Pagina atual. |
| `limit` | number | Nao | `100` | Quantidade por pagina. Maximo `100`. |
| `version_id` | number | Nao | - | Mantido por compatibilidade, nao e usado. |

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/chapters?version=nvi&book_id=1&page=1&limit=50"
curl "http://localhost:3333/api/biblia/chapters?version=ara&book_id=1&include_text=true"
```

Resposta sem texto:

```json
{
  "data": [
    {
      "version": "nvi",
      "comparison_scope": "verse",
      "testament": 1,
      "book": 1,
      "book_name": "Genesis",
      "book_abbrev": "gn",
      "chapter": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 50,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Resposta com texto:

```json
{
  "data": [
    {
      "version": "nvi",
      "comparison_scope": "verse",
      "testament": 1,
      "book": 1,
      "book_name": "Genesis",
      "book_abbrev": "gn",
      "chapter": 1,
      "verses": [
        {
          "verse": 1,
          "text": "No principio Deus criou os ceus e a terra."
        }
      ],
      "chapter_text": "No principio Deus criou os ceus e a terra."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 50,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## GET /books/:book_id/chapters/:chapter

Busca um capitulo completo de um livro.

Parametros de rota:

| Parametro | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `book_id` | number | Sim | ID do livro. |
| `chapter` | number | Sim | Numero do capitulo. |

Query params:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `version` | string | Nao | `nvi` | Codigo da versao. |

Exemplo:

```bash
curl "http://localhost:3333/api/biblia/books/1/chapters/1?version=nvi"
```

Resposta:

```json
{
  "data": {
    "version": "nvi",
    "comparison_scope": "verse",
    "testament": 1,
    "book": 1,
    "book_name": "Genesis",
    "book_abbrev": "gn",
    "chapter": 1,
    "verses": [
      {
        "verse": 1,
        "text": "No principio Deus criou os ceus e a terra."
      },
      {
        "verse": 2,
        "text": "Era a terra sem forma e vazia..."
      }
    ],
    "chapter_text": "No principio Deus criou os ceus e a terra.\nEra a terra sem forma e vazia..."
  }
}
```

## GET /books/:book_id/verses

Lista versos de um livro. Aceita filtros por capitulo, verso, intervalo e busca textual.

Parametros de rota:

| Parametro | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `book_id` | number | Sim | ID do livro. |

Query params:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `version` | string | Nao | `nvi` | Codigo da versao. |
| `chapter_id` | number | Nao | - | Filtra por capitulo. |
| `verse` | number | Nao | - | Filtra um verso especifico. |
| `verse_start` | number | Nao | - | Inicio de intervalo de versos. Exige `verse_end`. |
| `verse_end` | number | Nao | - | Fim de intervalo de versos. |
| `keyword` | string | Nao | - | Busca no texto do verso. |
| `q` | string | Nao | - | Alias de `keyword`. |
| `text` | string | Nao | - | Alias de `keyword`. |
| `page` | number | Nao | `1` | Pagina atual. |
| `limit` | number | Nao | `100` | Quantidade por pagina. Maximo `100`. |

Regras:

- Use `verse` ou `verse_start`/`verse_end`, nunca os dois ao mesmo tempo.
- Se `verse_start` for informado, `verse_end` tambem e obrigatorio.

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/books/1/verses?version=nvi&page=1&limit=100"
curl "http://localhost:3333/api/biblia/books/1/verses?version=nvi&chapter_id=1"
curl "http://localhost:3333/api/biblia/books/1/verses?version=nvi&chapter_id=1&verse=1"
curl "http://localhost:3333/api/biblia/books/1/verses?version=nvi&chapter_id=1&verse_start=1&verse_end=5"
curl "http://localhost:3333/api/biblia/books/1/verses?version=nvi&keyword=criacao"
```

Resposta:

```json
{
  "data": [
    {
      "id": 31063,
      "version": "nvi",
      "testament": 1,
      "book": 1,
      "book_name": "Genesis",
      "book_abbrev": "gn",
      "chapter": 1,
      "verse": 1,
      "text": "No principio Deus criou os ceus e a terra.",
      "global_order": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1533,
    "totalPages": 16,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## GET /verses

Lista versos em toda a Biblia ou filtra por livro/capitulo/verso.

Parametros:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `version` | string | Nao | `nvi` | Codigo da versao. |
| `book_id` | number | Nao | - | Filtra por livro. |
| `chapter_id` | number | Nao | - | Filtra por capitulo. |
| `verse` | number | Nao | - | Filtra um verso especifico. |
| `verse_start` | number | Nao | - | Inicio de intervalo. Exige `verse_end`. |
| `verse_end` | number | Nao | - | Fim de intervalo. |
| `keyword` | string | Nao | - | Busca no texto do verso. |
| `q` | string | Nao | - | Alias de `keyword`. |
| `text` | string | Nao | - | Alias de `keyword`. |
| `page` | number | Nao | `1` | Pagina atual. |
| `limit` | number | Nao | `100` | Quantidade por pagina. Maximo `100`. |
| `version_id` | number | Nao | - | Mantido por compatibilidade, nao e usado. |

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/verses?version=nvi&book_id=1&chapter_id=1"
curl "http://localhost:3333/api/biblia/verses?version=ara&book_id=1&chapter_id=1&verse=1"
curl "http://localhost:3333/api/biblia/verses?version=nvi&book_id=1&chapter_id=1&verse_start=1&verse_end=10"
curl "http://localhost:3333/api/biblia/verses?version=nvi&q=graca&page=1&limit=20"
```

Resposta:

```json
{
  "data": [
    {
      "id": 31063,
      "version": "nvi",
      "testament": 1,
      "book": 1,
      "book_name": "Genesis",
      "book_abbrev": "gn",
      "chapter": 1,
      "verse": 1,
      "text": "No principio Deus criou os ceus e a terra.",
      "global_order": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 31,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## GET /search

Busca textual no conteudo dos versos.

Este endpoint usa a mesma estrutura de retorno de `/verses`, mas exige `keyword`.

Parametros:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `version` | string | Nao | `nvi` | Codigo da versao. |
| `keyword` | string | Sim | - | Texto pesquisado. |
| `book_id` | number | Nao | - | Filtra por livro. |
| `chapter_id` | number | Nao | - | Filtra por capitulo. |
| `verse_start` | number | Nao | - | Inicio de intervalo. Exige `verse_end`. |
| `verse_end` | number | Nao | - | Fim de intervalo. |
| `page` | number | Nao | `1` | Pagina atual. |
| `limit` | number | Nao | `100` | Quantidade por pagina. Maximo `100`. |
| `version_id` | number | Nao | - | Mantido por compatibilidade, nao e usado. |

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/search?version=nvi&keyword=graca"
curl "http://localhost:3333/api/biblia/search?version=nvi&book_id=43&keyword=vida"
curl "http://localhost:3333/api/biblia/search?version=nvi&book_id=1&chapter_id=1&keyword=Deus"
```

Resposta:

```json
{
  "data": [
    {
      "id": 62124,
      "version": "nvi",
      "testament": 2,
      "book": 66,
      "book_name": "Apocalipse",
      "book_abbrev": "ap",
      "chapter": 22,
      "verse": 21,
      "text": "A graca do Senhor Jesus seja com todos. Amem.",
      "global_order": 31105
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## GET /compare

Compara o mesmo verso entre varias versoes.

Usa `verses_comparisons`, que ja retorna `texts_by_version` agregado.

Parametros:

| Parametro | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `book_id` | number | Nao | - | Filtra por livro. |
| `chapter_id` | number | Nao | - | Filtra por capitulo. |
| `verse` | number | Nao | - | Filtra um verso especifico. |
| `verse_start` | number | Nao | - | Inicio de intervalo. Exige `verse_end`. |
| `verse_end` | number | Nao | - | Fim de intervalo. |
| `versions` | string | Nao | todas | Lista separada por virgula. Exemplo: `nvi,ara,arc`. |
| `page` | number | Nao | `1` | Pagina atual. |
| `limit` | number | Nao | `100` | Quantidade por pagina. Maximo `100`. |

Regras:

- Use `verse` ou `verse_start`/`verse_end`, nunca os dois ao mesmo tempo.
- Se `versions` nao for informado, o retorno inclui todas as versoes presentes em `texts_by_version`.
- O filtro `versions` e aplicado na API sobre o JSON retornado pela view.

Exemplos:

```bash
curl "http://localhost:3333/api/biblia/compare?book_id=1&chapter_id=1&verse=1"
curl "http://localhost:3333/api/biblia/compare?book_id=1&chapter_id=1&verse=1&versions=nvi,ara"
curl "http://localhost:3333/api/biblia/compare?book_id=1&chapter_id=1&verse_start=1&verse_end=5&versions=nvi,ara,arc"
```

Resposta:

```json
{
  "data": [
    {
      "testament": 1,
      "book": 1,
      "book_name": "Genesis",
      "book_abbrev": "gn",
      "chapter": 1,
      "verse": 1,
      "texts_by_version": {
        "nvi": "No principio Deus criou os ceus e a terra.",
        "ara": "No principio, criou Deus os ceus e a terra.",
        "arc": "No principio criou Deus os ceus e a terra."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## GET /examples

Retorna exemplos internos usados pela propria API.

Exemplo:

```bash
curl "http://localhost:3333/api/biblia/examples"
```

Resposta:

```json
{
  "data": {
    "cache": {
      "provider": "Redis TCP via REDIS_URL"
    }
  }
}
```

## Receitas de uso

### Abrir Genesis 1 na NVI

```bash
curl "http://localhost:3333/api/biblia/books/1/chapters/1?version=nvi"
```

### Trocar a versao para ARA

```bash
curl "http://localhost:3333/api/biblia/books/1/chapters/1?version=ara"
```

### Buscar todos os versos de Joao 3

```bash
curl "http://localhost:3333/api/biblia/verses?version=nvi&book_id=43&chapter_id=3"
```

### Buscar Joao 3:16

```bash
curl "http://localhost:3333/api/biblia/verses?version=nvi&book_id=43&chapter_id=3&verse=16"
```

### Comparar Joao 3:16 em NVI, ARA e ARC

```bash
curl "http://localhost:3333/api/biblia/compare?book_id=43&chapter_id=3&verse=16&versions=nvi,ara,arc"
```

### Buscar a palavra amor na NVI

```bash
curl "http://localhost:3333/api/biblia/search?version=nvi&keyword=amor&page=1&limit=20"
```

## Campos por tipo de retorno

### Verso

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | number | ID do registro retornado pela view/tabela. |
| `version` | string | Codigo da versao. |
| `testament` | number | Testamento. `1` antigo, `2` novo. |
| `book` | number | ID do livro. |
| `book_name` | string | Nome do livro. |
| `book_abbrev` | string | Abreviacao do livro. |
| `chapter` | number | Capitulo. |
| `verse` | number | Versiculo. |
| `text` | string | Texto do verso. |
| `global_order` | number | Ordem global do verso na Biblia. |

### Capitulo

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `version` | string | Codigo da versao. |
| `comparison_scope` | string | Escopo de comparacao da versao. |
| `testament` | number | Testamento. |
| `book` | number | ID do livro. |
| `book_name` | string | Nome do livro. |
| `book_abbrev` | string | Abreviacao do livro. |
| `chapter` | number | Capitulo. |
| `verses` | array | Lista de versos do capitulo. |
| `chapter_text` | string | Texto completo do capitulo. |

### Comparacao

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `testament` | number | Testamento. |
| `book` | number | ID do livro. |
| `book_name` | string | Nome do livro. |
| `book_abbrev` | string | Abreviacao do livro. |
| `chapter` | number | Capitulo. |
| `verse` | number | Versiculo. |
| `texts_by_version` | object | Mapa `{ "codigo_da_versao": "texto" }`. |
