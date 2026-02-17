# Script PowerShell pour construire les images Docker multi-architecture (amd64/arm64)
# A lancer depuis la racine du depot GerMaCrise (pas depuis scripts/)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path (Join-Path $root "backend\Dockerfile.multiarch"))) {
    $root = (Get-Location).Path
}
if (-not (Test-Path (Join-Path $root "backend\Dockerfile.multiarch"))) {
    Write-Host "Erreur: executer depuis la racine du depot (GerMaCrise)." -ForegroundColor Red
    exit 1
}
Push-Location $root

Write-Host "Construction des images multi-architecture..." -ForegroundColor Cyan

# Creer un builder multi-arch si necessaire
$builderExists = docker buildx ls | Select-String "multiarch-builder"
if (-not $builderExists) {
    Write-Host "Creation du builder multi-architecture..." -ForegroundColor Yellow
    docker buildx create --name multiarch-builder --use
    docker buildx inspect --bootstrap
}

docker buildx use multiarch-builder

Write-Host "Construction image backend (amd64 + arm64)..." -ForegroundColor Cyan
docker buildx build `
    --platform linux/amd64,linux/arm64 `
    --file backend/Dockerfile.multiarch `
    --tag maincourante/backend:latest `
    --tag maincourante/backend:v3.0.0 `
    --push `
    ./backend

Write-Host "Construction image frontend (amd64 + arm64)..." -ForegroundColor Cyan
docker buildx build `
    --platform linux/amd64,linux/arm64 `
    --file frontend/Dockerfile.multiarch `
    --tag maincourante/frontend:latest `
    --tag maincourante/frontend:v3.0.0 `
    --push `
    ./frontend

Pop-Location
Write-Host "Images multi-architecture construites avec succes." -ForegroundColor Green
Write-Host "Pour tester localement (depuis la racine):" -ForegroundColor Yellow
Write-Host "  Backend:  docker buildx build --platform linux/amd64 --load -f backend/Dockerfile.multiarch -t maincourante/backend:latest ./backend" -ForegroundColor Gray
Write-Host "  Frontend: docker buildx build --platform linux/amd64 --load -f frontend/Dockerfile.multiarch -t maincourante/frontend:latest ./frontend" -ForegroundColor Gray
