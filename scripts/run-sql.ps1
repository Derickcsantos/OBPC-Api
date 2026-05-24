param(
  [string]$File = "database/nvi.sql",
  [string]$DatabaseUrl = $env:DATABASE_URL
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

function Read-EnvValue {
  param([string[]]$Names)

  if (-not (Test-Path $envPath)) {
    return $null
  }

  foreach ($line in Get-Content $envPath) {
    $trimmed = $line.Trim()

    if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
      continue
    }

    foreach ($name in $Names) {
      if ($trimmed -match "^$name\s*=\s*(.*)$") {
        return $Matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }

  return $null
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  $DatabaseUrl = Read-EnvValue @("DATABASE_URL", "SUPABASE_DB_URL", "POSTGRES_URL")
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw @"
Informe a connection string do Postgres em DATABASE_URL, SUPABASE_DB_URL ou POSTGRES_URL.

Exemplo no PowerShell:
  `$env:DATABASE_URL = "postgresql://postgres:<SENHA>@<HOST>:5432/postgres?sslmode=require"
  npm run db:run:nvi

No Supabase, pegue esse valor em:
  Project Settings > Database > Connection string
"@
}

$sqlPath = $File
if (-not [System.IO.Path]::IsPathRooted($sqlPath)) {
  $sqlPath = Join-Path $projectRoot $sqlPath
}

if (-not (Test-Path $sqlPath)) {
  throw "Arquivo SQL nao encontrado: $sqlPath"
}

function Show-SupabasePoolerHelp {
  Write-Host ""
  Write-Host "Seu DATABASE_URL parece ser a conexao direta do Supabase."
  Write-Host "Essa conexao direta usa IPv6. Neste ambiente, o IPv6 nao esta alcancavel."
  Write-Host ""
  Write-Host "Para rodar este SQL, troque o DATABASE_URL pela string 'Session pooler' do Supabase:"
  Write-Host "  1. Abra o projeto no Supabase"
  Write-Host "  2. Clique em Connect"
  Write-Host "  3. Copie a connection string em Session pooler"
  Write-Host "  4. Cole no .env como DATABASE_URL"
  Write-Host ""
  Write-Host "O formato costuma ser:"
  Write-Host "  postgresql://postgres.<PROJECT_REF>:<SENHA>@aws-0-<REGION>.pooler.supabase.com:5432/postgres?sslmode=require"
  Write-Host ""
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($psql) {
  Write-Host "Executando SQL: $sqlPath"
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $psql.Source $DatabaseUrl --set=ON_ERROR_STOP=on --single-transaction --file=$sqlPath
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference

  if ($exitCode -ne 0) {
    if ($DatabaseUrl -match "@db\.[^.]+\.supabase\.co:" ) {
      Show-SupabasePoolerHelp
    }

    throw "Falha ao executar o SQL. Codigo de saida: $exitCode"
  }

  Write-Host "SQL executado com sucesso."
  exit 0
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  $sqlDir = Split-Path -Parent $sqlPath
  $sqlFileName = Split-Path -Leaf $sqlPath
  $containerSqlPath = "/sql/$sqlFileName"
  $volume = "${sqlDir}:/sql:ro"

  Write-Host "O comando 'psql' nao foi encontrado. Tentando executar via Docker..."
  Write-Host "Executando SQL: $sqlPath"
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & $docker.Source run --rm --dns 1.1.1.1 -v $volume postgres:16-alpine psql $DatabaseUrl --set=ON_ERROR_STOP=on --single-transaction --file=$containerSqlPath 2>&1
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  $output | Write-Host

  if ($exitCode -ne 0) {
    $joinedOutput = $output -join "`n"
    if ($DatabaseUrl -match "@db\.[^.]+\.supabase\.co:" -and $joinedOutput -match "Network unreachable|could not translate host name|Name does not resolve") {
      Show-SupabasePoolerHelp
    }

    throw "Falha ao executar o SQL via Docker. Codigo de saida: $exitCode"
  }

  Write-Host "SQL executado com sucesso."
  exit 0
}

throw @"
O comando 'psql' nao foi encontrado e o Docker tambem nao esta disponivel.

Instale uma das opcoes abaixo e tente novamente:
  winget install PostgreSQL.PostgreSQL

ou instale/abra o Docker Desktop.
"@
