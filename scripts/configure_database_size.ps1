# Script pour configurer et augmenter les capacités de la base de données PostgreSQL
# Usage: .\scripts\configure_database_size.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration de la taille de la base" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si le conteneur est en cours d'exécution
$dbContainer = docker ps --filter "name=main_courante_db" --format "{{.Names}}" 2>$null
if ($dbContainer -ne "main_courante_db") {
    Write-Host "[ERREUR] Le conteneur de base de données n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "Veuillez démarrer les conteneurs avec: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Conteneur de base de données trouvé" -ForegroundColor Green
Write-Host ""

# Afficher la configuration actuelle
Write-Host "Configuration actuelle de PostgreSQL:" -ForegroundColor Cyan
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW max_connections;"
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW shared_buffers;"
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW effective_cache_size;"
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Voulez-vous appliquer les nouvelles configurations ? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "Opération annulée." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Application des nouvelles configurations..." -ForegroundColor Cyan

# Lire le script de configuration
$configScript = Get-Content -Path "backend\configure_postgres.sql" -Raw

# Exécuter le script de configuration
Write-Host "Exécution du script de configuration..." -ForegroundColor Yellow
Get-Content -Path "backend\configure_postgres.sql" | docker exec -i main_courante_db psql -U maincourante -d main_courante

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Configuration appliquée avec succès" -ForegroundColor Green
    Write-Host ""
    Write-Host "ATTENTION: Certains paramètres nécessitent un redémarrage du conteneur pour être appliqués." -ForegroundColor Yellow
    Write-Host "Voulez-vous redémarrer le conteneur maintenant ? (O/N)" -ForegroundColor Yellow
    $restart = Read-Host
    if ($restart -eq "O" -or $restart -eq "o") {
        Write-Host "Redémarrage du conteneur..." -ForegroundColor Cyan
        docker restart main_courante_db
        Start-Sleep -Seconds 5
        Write-Host "[OK] Conteneur redémarré" -ForegroundColor Green
    }
} else {
    Write-Host "[ERREUR] Erreur lors de l'application de la configuration" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configuration terminée !" -ForegroundColor Green
