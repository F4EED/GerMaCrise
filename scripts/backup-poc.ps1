# Script de sauvegarde optimisé pour POC (vérifie la présence de la table BAN)
# Usage: .\scripts\backup-poc.ps1 [CHEMIN_CLE_USB]
# Exemple: .\scripts\backup-poc.ps1 E:\

param(
    [Parameter(Mandatory=$false)]
    [string]$DestinationPath = $null
)

$ErrorActionPreference = "Stop"

# Fonction pour obtenir le chemin de destination
function Get-DestinationPath {
    if ($DestinationPath) {
        return $DestinationPath.TrimEnd('\').TrimEnd('/')
    }
    
    Write-Host "`n=== Sauvegarde POC GerMaCrise ===" -ForegroundColor Cyan
    Write-Host "Veuillez indiquer le chemin de destination (ex: E:\)" -ForegroundColor Yellow
    $path = Read-Host "Chemin de destination"
    return $path.TrimEnd('\').TrimEnd('/')
}

$destPath = Get-DestinationPath
$backupDir = Join-Path $destPath "germacrise_poc_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`nDémarrage de la sauvegarde POC..." -ForegroundColor Green
Write-Host "Destination: $backupDir" -ForegroundColor Cyan

# Vérifier que Docker est en cours d'exécution
if (-not (Get-Process docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: Docker n'est pas en cours d'exécution." -ForegroundColor Red
    Write-Host "La sauvegarde nécessite que la base de données soit démarrée." -ForegroundColor Yellow
    exit 1
}

# Vérifier que le répertoire de destination existe
if (-not (Test-Path $destPath)) {
    Write-Host "ERREUR: Le chemin de destination n'existe pas: $destPath" -ForegroundColor Red
    exit 1
}

# Créer le répertoire de sauvegarde
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Répertoire de sauvegarde créé: $backupDir" -ForegroundColor Green

# 1. Sauvegarder la base de données avec vérification BAN
Write-Host "`n1. Sauvegarde de la base de données..." -ForegroundColor Cyan
$dbBackupFile = Join-Path $backupDir "database_backup.sql"

try {
    # Vérifier si le conteneur est en cours d'exécution
    $dbContainer = docker ps --filter "name=germacrise_db" --format "{{.Names}}" 2>$null
    if ($dbContainer -ne "germacrise_db") {
        # Essayer aussi avec l'ancien nom
        $dbContainer = docker ps --filter "name=main_courante_db" --format "{{.Names}}" 2>$null
        if ($dbContainer -ne "main_courante_db") {
            Write-Host "   [ERREUR] Le conteneur de base de données n'est pas en cours d'exécution" -ForegroundColor Red
            Write-Host "   Lancez d'abord: docker compose up -d db" -ForegroundColor Yellow
            exit 1
        }
        $containerName = "main_courante_db"
    } else {
        $containerName = "germacrise_db"
    }
    
    Write-Host "   [INFO] Conteneur trouvé: $containerName" -ForegroundColor Gray
    
    # Vérifier la présence de la table BAN
    Write-Host "   [INFO] Vérification de la table BAN..." -ForegroundColor Gray
    $banCheck = docker exec $containerName psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ban';" 2>$null
    $banCount = ($banCheck -replace '\s', '')
    
    if ($banCount -eq "1") {
        # Compter les adresses BAN
        $banRows = docker exec $containerName psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>$null
        $banRowsCount = ($banRows -replace '\s', '')
        Write-Host "   [OK] Table BAN trouvée avec $banRowsCount adresses" -ForegroundColor Green
    } else {
        Write-Host "   [ATTENTION] Table BAN non trouvée (sera créée lors de la restauration)" -ForegroundColor Yellow
    }
    
    # Faire le dump complet
    Write-Host "   [INFO] Export de la base de données..." -ForegroundColor Gray
    docker exec $containerName pg_dump -U maincourante main_courante > $dbBackupFile
    
    if ($LASTEXITCODE -eq 0) {
        $dbSize = (Get-Item $dbBackupFile).Length / 1MB
        $dbSizeRounded = [math]::Round($dbSize, 2)
        Write-Host "   [OK] Base de données sauvegardée ($dbSizeRounded MB)" -ForegroundColor Green
        
        # Vérifier que le dump contient bien la table BAN
        $dumpContent = Get-Content $dbBackupFile -Raw
        if ($dumpContent -match "CREATE TABLE.*ban" -or $dumpContent -match "COPY ban") {
            Write-Host "   [OK] Table BAN confirmée dans le dump" -ForegroundColor Green
        } else {
            Write-Host "   [ATTENTION] Table BAN non trouvée dans le dump (peut être vide)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [ERREUR] Erreur lors de la sauvegarde de la base de données" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ERREUR] Erreur lors de la sauvegarde: $_" -ForegroundColor Red
    exit 1
}

# 2. Copier les fichiers essentiels du projet
Write-Host "`n2. Copie des fichiers du projet..." -ForegroundColor Cyan

# Fichiers et dossiers à exclure
$excludePatterns = @(
    "node_modules",
    "__pycache__",
    "*.pyc",
    ".git",
    "venv",
    "env",
    ".venv",
    ".env",
    "build",
    "dist",
    "*.log",
    ".vscode",
    ".idea",
    ".DS_Store",
    "Thumbs.db",
    "*.tmp",
    "*.bak",
    "coverage",
    ".nyc_output"
)

# Copier les fichiers essentiels
$essentialDirs = @(
    "backend",
    "frontend/src",
    "frontend/public",
    "frontend/package.json",
    "frontend/tsconfig.json",
    "scripts",
    "json",
    "docker-compose.poc.yml",
    "docker-compose.yml",
    "env.example",
    "README.md",
    "README_POC.md",
    "QUICKSTART.md"
)

foreach ($item in $essentialDirs) {
    $sourcePath = Join-Path $projectRoot $item
    if (Test-Path $sourcePath) {
        $destPathItem = Join-Path $backupDir $item
        $destParent = Split-Path -Parent $destPathItem
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPathItem -Recurse -Force
    }
}

$fileCount = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object).Count
Write-Host "   [OK] $fileCount fichiers copiés" -ForegroundColor Green

# 3. Créer un fichier d'information
Write-Host "`n3. Création du fichier d'information..." -ForegroundColor Cyan
$infoFile = Join-Path $backupDir "BACKUP_INFO.txt"
$info = @"
SAUVEGARDE POC GERMACRISE
=========================

Date de sauvegarde: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Système: Windows
Version Docker: $(docker --version 2>$null)
Version Docker Compose: $(docker-compose --version 2>$null)

CONTENU DE LA SAUVEGARDE:
- Code source essentiel (backend, frontend, scripts)
- Fichiers de configuration (docker-compose.poc.yml, env.example)
- Base de données complète (database_backup.sql) avec TOUTES les tables
- Table BAN incluse (si présente dans la base source)
- Fichiers JSON de configuration (json/)

INSTRUCTIONS DE RESTAURATION:

1. Copier ce dossier sur la machine de destination
2. Démarrer Docker
3. Exécuter:
   docker compose -f docker-compose.poc.yml up -d db
   cat database_backup.sql | docker exec -i germacrise_db psql -U maincourante -d main_courante
   docker compose -f docker-compose.poc.yml up -d

OU utiliser les scripts de restauration standard:
   .\scripts\restore.ps1 "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"

IMPORTANT:
- Docker et Docker Compose doivent être installés
- Les ports 5433, 8000, 3000 doivent être disponibles
- La base de données sera complètement restaurée (toutes les tables + BAN)
"@

Set-Content -Path $infoFile -Value $info -Encoding UTF8
Write-Host "   [OK] Fichier d'information créé" -ForegroundColor Green

# 4. Calculer la taille totale
$totalSize = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
$totalSizeRounded = [math]::Round($totalSize, 2)
Write-Host "`n=== Sauvegarde POC terminée avec succès ===" -ForegroundColor Green
Write-Host "Taille totale: $totalSizeRounded GB" -ForegroundColor Cyan
Write-Host "Emplacement: $backupDir" -ForegroundColor Cyan
Write-Host "`nCette sauvegarde contient:" -ForegroundColor Yellow
Write-Host "  ✅ Base de données complète (toutes les tables)" -ForegroundColor Green
Write-Host "  ✅ Table BAN (si présente)" -ForegroundColor Green
Write-Host "  ✅ Code source essentiel" -ForegroundColor Green
Write-Host "  ✅ Fichiers de configuration" -ForegroundColor Green
Write-Host "`nVous pouvez maintenant copier ce dossier pour le partager." -ForegroundColor Yellow
