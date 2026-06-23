# Login Google no aplicativo mobile

## Endpoint

`POST {BACKEND_URL}/api/auth/google`

Body:

```json
{
  "id_token": "TOKEN_DE_IDENTIDADE_RETORNADO_PELO_GOOGLE"
}
```

Resposta:

```json
{
  "access_token": "JWT_DA_API",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "usuario_id": "uuid",
    "nome_usuario": "Nome",
    "email_usuario": "email@example.com",
    "avatar_url": "https://..."
  }
}
```

## Variaveis de ambiente

```dotenv
BACKEND_URL=https://sua-api.example.com
GOOGLE_CLIENT_IDS=ANDROID_CLIENT_ID.apps.googleusercontent.com,IOS_CLIENT_ID.apps.googleusercontent.com
AUTH_JWT_SECRET=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
AUTH_JWT_EXPIRES_IN_SECONDS=604800
```

`GOOGLE_CLIENT_ID` continua aceito quando existe apenas um Client ID. `GOOGLE_SECRET_KEY`
continua aceito como fallback para assinar o JWT da API, mas `AUTH_JWT_SECRET` separado e recomendado.
O Client Secret OAuth do Google nao e necessario para validar um ID token no backend.

## Banco de dados

Execute `database/google_auth_migration.sql` uma vez no Supabase antes de publicar a API.

## Fluxo no aplicativo

1. Realize o login nativo com Google.
2. Obtenha o `idToken`/`identityToken` retornado pelo SDK. Nao envie o access token.
3. Envie esse valor como `id_token` para o endpoint.
4. Armazene o `access_token` retornado em armazenamento seguro (Keychain no iOS e
   Keystore/EncryptedSharedPreferences no Android).
5. Nas futuras rotas protegidas, envie `Authorization: Bearer {access_token}`.

Se o SDK mobile usar um Web/Server Client ID para emitir o ID token, inclua tambem esse Client ID
em `GOOGLE_CLIENT_IDS`.
