$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "Created .env.local from template."
}

Write-Host "Ensuring PostgreSQL container is running..."
docker compose up -d postgres

Write-Host "Starting Next.js dev server..."
npm.cmd run dev
