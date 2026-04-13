#!/bin/bash
# Script de Verificação - Church Mobile API
# Execute: npm run verify (ou manualmente cada linha)

echo "🔍 Verificando Integridade do Projeto..."
echo ""

# 1. Verificar Node
echo "1️⃣  Node.js Version:"
node --version

# 2. Verificar npm
echo ""
echo "2️⃣  npm Version:"
npm --version

# 3. Verificar dependências instaladas
echo ""
echo "3️⃣  Dependências Críticas:"
npm list fastify zod @supabase/supabase-js | grep -E "fastify|zod|supabase"

# 4. TypeScript
echo ""
echo "4️⃣  TypeScript Check (sem erros esperado):"
npm run typecheck 2>&1 | tail -3

# 5. Build
echo ""
echo "5️⃣  Build Production:"
npm run build 2>&1 | tail -1

# 6. Testes
echo ""
echo "6️⃣  Testes (4/4 esperado):"
npm run test 2>&1 | grep "Test Files"

# 7. Arquivos de Configuração
echo ""
echo "7️⃣  Arquivos .env:"
echo "NODE_ENV: $(grep NODE_ENV .env)"
echo "PORT: $(grep PORT .env)"
echo "SUPABASE_URL: $(grep SUPABASE_URL .env | cut -c1-30)..."
echo "BIBLE_API_KEY: $(grep BIBLE_API_KEY .env | cut -c1-30)..."

# 8. Contagem de Arquivos
echo ""
echo "8️⃣  Estrutura de Arquivos:"
echo "Controllers: $(ls -1 src/controllers/*.ts 2>/dev/null | wc -l)"
echo "Services: $(ls -1 src/services/*.ts 2>/dev/null | wc -l)"
echo "DTOs: $(ls -1 src/dtos/*.ts 2>/dev/null | wc -l)"
echo "Rotas: $(ls -1 src/routes/*.ts 2>/dev/null | wc -l)"
echo "Testes: $(ls -1 tests/*.ts 2>/dev/null | wc -l)"

# 9. SQL
echo ""
echo "9️⃣  Script SQL:"
echo "Tabelas: $(grep 'create table' database/schema.sql | wc -l)"
echo "Triggers: $(grep 'create trigger' database/schema.sql | wc -l)"

# 10. Pasta dist
echo ""
echo "🔟 Build Compilado:"
if [ -d "dist" ]; then
    echo "✅ Pasta dist existe"
    echo "Arquivos: $(find dist -name '*.js' | wc -l) JS files"
else
    echo "❌ Pasta dist não encontrada"
fi

echo ""
echo "================================"
echo "✅ Verificação Completa!"
echo "================================"
echo ""
echo "Próximos Passos:"
echo "1. Execute SQL de database/schema.sql no Supabase"
echo "2. npm run dev"
echo "3. Teste endpoints em localhost:3333"
echo ""
