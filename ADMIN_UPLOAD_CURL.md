# Exemplos de upload administrativo

```bash
curl -X POST "$BACKEND_URL/api/admin/uploads" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "context=eventos" \
  -F "file=@./capa.webp;type=image/webp"
```

Resposta:

```json
{"data":{"url":"https://exemplo.supabase.co/storage/v1/object/public/imagens/admin/eventos/arquivo.webp"}}
```

O endpoint aceita JPEG, PNG ou WebP de até 8 MB. O tipo declarado pelo cliente não é usado como prova; o conteúdo real é validado e os metadados auxiliares são removidos antes do armazenamento.
