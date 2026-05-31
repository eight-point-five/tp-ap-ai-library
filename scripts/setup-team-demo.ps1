$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "Created .env.local from template."
}

if (-not (Test-Path "docker-data")) {
  New-Item -ItemType Directory -Path "docker-data" | Out-Null
}

Write-Host "Starting local PostgreSQL container..."
docker compose up -d postgres

Write-Host "Installing project dependencies with peer compatibility..."
npm.cmd install --legacy-peer-deps

Write-Host "Running database migrations..."
npm.cmd run db:migrate

Write-Host "Importing latest team demo data..."
npm.cmd run import:test

Write-Host ""
Write-Host "Team demo setup completed. Start the app with:"
Write-Host "npm.cmd run team-demo:dev"
