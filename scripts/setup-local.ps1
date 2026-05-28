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
docker compose up -d

Write-Host "Installing project dependencies..."
npm.cmd install

Write-Host "Running database migrations..."
npm.cmd run db:migrate

Write-Host "Seeding local book data..."
npm.cmd run seed

Write-Host "Seeding risk demo data..."
npm.cmd run seed:risk

Write-Host ""
Write-Host "Local setup completed. Start the app with:"
Write-Host "npm.cmd run local:dev"
