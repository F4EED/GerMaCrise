# Script d'initialisation du projet Main Courante (PowerShell)

Write-Host "Initialisation du projet Main Courante..." -ForegroundColor Cyan

# Verifier que Docker est installe
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installe. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Verifier que Docker Compose est disponible (V2 ou V1)
$composeOk = $false
if (docker compose version 2>$null) { $composeOk = $true }
if (-not $composeOk -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) { $composeOk = $true }
if (-not $composeOk) {
    Write-Host "Docker Compose n'est pas installe. Veuillez l'installer (Docker Desktop ou plugin docker compose)." -ForegroundColor Red
    exit 1
}

# Demarrer les services
Write-Host "Demarrage des services Docker..." -ForegroundColor Yellow
docker compose up -d db

# Attendre que la base de donnees soit prete
Write-Host "Attente de la base de donnees..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Initialiser la base de donnees
Write-Host "Initialisation de la base de donnees..." -ForegroundColor Yellow
docker compose run --rm backend python -m app.init_db

# Demarrer tous les services
Write-Host "Demarrage de tous les services..." -ForegroundColor Yellow
docker compose up -d

Write-Host "Initialisation terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Informations de connexion:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:8000"
Write-Host "   - API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Compte administrateur par defaut:" -ForegroundColor Cyan
Write-Host "   Username: admin"
Write-Host "   Password: admin123"
Write-Host "   IMPORTANT: Changez le mot de passe apres la premiere connexion!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour arreter les services: docker compose down"
Write-Host "Pour voir les logs: docker compose logs -f"
