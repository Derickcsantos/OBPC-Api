# Exemplos de Testes - cURL

Todos os exemplos abaixo podem ser copiados e executados em um terminal.

## 1. Health Check
```bash
curl -X GET http://localhost:3333/health
```

## 2. Ministérios

### Criar
```bash
curl -X POST http://localhost:3333/api/ministerios \
  -H "Content-Type: application/json" \
  -d '{
    "nome_ministerio": "Ministério de Jovens",
    "descricao_ministerio": "Ministério para jovens adultos da Igreja",
    "url_ministerio": "https://igreja.com.br/jovens"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/ministerios
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/ministerios/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/ministerios/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "nome_ministerio": "Ministério de Jovens - Atualizado"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/ministerios/{id}
```

## 3. Usuários

### Criar
```bash
curl -X POST http://localhost:3333/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome_usuario": "João Silva",
    "telefone_usuario": "11987654321",
    "senha_usuario": "SenhaForte123!",
    "email_usuario": "joao@igreja.com",
    "data_nascimento": "1990-05-15"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/usuarios
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/usuarios/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/usuarios/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "nome_usuario": "João Silva Santos",
    "telefone_usuario": "11998765432"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/usuarios/{id}
```

## 4. Eventos

### Criar
```bash
curl -X POST http://localhost:3333/api/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "nome_evento": "Culto Domingo",
    "descricao_evento": "Culto dominical da comunidade",
    "data_evento": "2025-04-20T18:00:00Z",
    "link_evento": "https://youtube.com/live/evento123"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/eventos
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/eventos/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/eventos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "data_evento": "2025-04-27T18:00:00Z"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/eventos/{id}
```

## 5. Notícias

### Criar
```bash
curl -X POST http://localhost:3333/api/noticias \
  -H "Content-Type: application/json" \
  -d '{
    "nome_noticia": "Novo Projeto Social",
    "mensagem_noticia": "A Igreja iniciou um novo projeto de assistência social",
    "data_noticia": "2025-04-13T10:00:00Z",
    "observacao_noticia": "Informação importante para toda comunidade"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/noticias
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/noticias/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/noticias/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "observacao_noticia": "Projeto ainda em andamento"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/noticias/{id}
```

## 6. Louvores

### Criar
```bash
curl -X POST http://localhost:3333/api/louvores \
  -H "Content-Type: application/json" \
  -d '{
    "nome_louvor": "Graça Divina",
    "url_louvor": "https://youtube.com/watch?v=louvor123",
    "observacao_louvor": "Louvor em vídeo para meditação"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/louvores
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/louvores/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/louvores/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "observacao_louvor": "Louvor popular na Igreja"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/louvores/{id}
```

## 7. Mensagens

### Criar
```bash
curl -X POST http://localhost:3333/api/mensagens \
  -H "Content-Type: application/json" \
  -d '{
    "nome_mensagem": "Mensagem de Esperança",
    "texto_mensagem": "Deposita tua confiança em Deus em todas as circunstâncias"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/mensagens
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/mensagens/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/mensagens/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "texto_mensagem": "Confia em Deus em todos os momentos, Ele está contigo"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/mensagens/{id}
```

## 8. Orações

### Criar
```bash
curl -X POST http://localhost:3333/api/oracoes \
  -H "Content-Type: application/json" \
  -d '{
    "nome_pedido": "Cura da família",
    "descricao_pedido": "Pedido de oração pela cura e restauração da família",
    "mostrar_grupo": true,
    "aceita_ligacao": true,
    "status": "em andamento"
  }'
```

### Listar Todos
```bash
curl -X GET http://localhost:3333/api/oracoes
```

### Buscar por ID
```bash
curl -X GET http://localhost:3333/api/oracoes/{id}
```

### Atualizar
```bash
curl -X PUT http://localhost:3333/api/oracoes/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "finalizado"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3333/api/oracoes/{id}
```

## 9. Bíblia - Versões

### Listar Versões
```bash
curl -X GET "http://localhost:3333/api/biblia/versions"
```

### Listar Livros de uma Versão
```bash
curl -X GET "http://localhost:3333/api/biblia/books?version_id=1"
```

### Listar Capítulos de um Livro
```bash
curl -X GET "http://localhost:3333/api/biblia/chapters?version_id=1&book_id=1"
```

### Buscar Versículos

#### Um versículo específico
```bash
curl -X GET "http://localhost:3333/api/biblia/verses?version_id=1&book_id=1&chapter_id=1&verse=1"
```

#### Intervalo de versículos
```bash
curl -X GET "http://localhost:3333/api/biblia/verses?version_id=1&book_id=1&chapter_id=1&verse_start=1&verse_end=5"
```

#### Todos os versículos de um capítulo
```bash
curl -X GET "http://localhost:3333/api/biblia/verses?version_id=1&book_id=1&chapter_id=1"
```

### Buscar Palavras Exatas

#### Em toda a Bíblia
```bash
curl -X GET "http://localhost:3333/api/biblia/search?version_id=1&keyword=Deus"
```

#### Em um livro específico
```bash
curl -X GET "http://localhost:3333/api/biblia/search?version_id=1&book_id=1&keyword=criou"
```

#### Em um capítulo específico
```bash
curl -X GET "http://localhost:3333/api/biblia/search?version_id=1&book_id=1&chapter_id=1&keyword=Deus"
```

#### Em um intervalo de versículos
```bash
curl -X GET "http://localhost:3333/api/biblia/search?version_id=1&book_id=1&chapter_id=1&verse_start=1&verse_end=30&keyword=criou"
```

## Notas Importantes

1. Substitua `{id}` pelo UUID da entidade que deseja manipular
2. Certifique-se de que o servidor está rodando (`npm run dev`)
3. Para testes em ferramentas visuais (Postman, Insomnia), você pode copiar as URLs sem as flags `\` (continuação de linha)
4. As respostas da Bíblia são obtidas em tempo real da API externa
5. Erros de validação retornarão status 400 com detalhes dos campos inválidos

## Teste de Integração Completa

```bash
# 1. Criar um ministério
MINISTERIO_ID=$(curl -s -X POST http://localhost:3333/api/ministerios \
  -H "Content-Type: application/json" \
  -d '{
    "nome_ministerio": "Novo Ministério",
    "descricao_ministerio": "Descrição",
    "url_ministerio": "https://exemplo.com"
  }' | jq -r '.data.ministerio_id')

# 2. Buscar o ministério criado
curl -X GET "http://localhost:3333/api/ministerios/$MINISTERIO_ID"

# 3. Atualizar
curl -X PUT "http://localhost:3333/api/ministerios/$MINISTERIO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_ministerio": "Ministério Atualizado"
  }'

# 4. Deletar
curl -X DELETE "http://localhost:3333/api/ministerios/$MINISTERIO_ID"
```
