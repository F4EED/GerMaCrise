# Script de sauvegarde complète du projet Main Courante
# Usage: .\scripts\backup.ps1 [CHEMIN_CLE_USB]
# Exemple: .\scripts\backup.ps1 E:\

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
    
    # Demander à l'utilisateur le chemin de la clé USB
    Write-Host "`n=== Sauvegarde du projet Main Courante ===" -ForegroundColor Cyan
    Write-Host "Veuillez indiquer le chemin de votre clé USB (ex: E:\)" -ForegroundColor Yellow
    $path = Read-Host "Chemin de destination"
    return $path.TrimEnd('\').TrimEnd('/')
}

$destPath = Get-DestinationPath
$backupDir = Join-Path $destPath "main_courante_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`nDémarrage de la sauvegarde..." -ForegroundColor Green
Write-Host "Destination: $backupDir" -ForegroundColor Cyan

# Vérifier que Docker est en cours d'exécution
if (-not (Get-Process docker -ErrorAction SilentlyContinue)) {
    Write-Host "ATTENTION: Docker ne semble pas être en cours d'exécution." -ForegroundColor Yellow
    Write-Host "La sauvegarde continuera mais la base de données pourrait ne pas être sauvegardée." -ForegroundColor Yellow
}

# Vérifier que le répertoire de destination existe
if (-not (Test-Path $destPath)) {
    Write-Host "ERREUR: Le chemin de destination n'existe pas: $destPath" -ForegroundColor Red
    exit 1
}

# Créer le répertoire de sauvegarde
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Répertoire de sauvegarde créé: $backupDir" -ForegroundColor Green

# 1. Sauvegarder la base de données
Write-Host "`n1. Sauvegarde de la base de données..." -ForegroundColor Cyan
$dbBackupFile = Join-Path $backupDir "database_backup.sql"

try {
    # Vérifier si le conteneur est en cours d'exécution
    $dbContainer = docker ps --filter "name=main_courante_db" --format "{{.Names}}" 2>$null
    if ($dbContainer -eq "main_courante_db") {
        docker exec main_courante_db pg_dump -U maincourante main_courante > $dbBackupFile
        if ($LASTEXITCODE -eq 0) {
            $dbSize = (Get-Item $dbBackupFile).Length / 1MB
            $dbSizeRounded = [math]::Round($dbSize, 2)
            Write-Host "   [OK] Base de donnees sauvegardee ($dbSizeRounded MB)" -ForegroundColor Green
        } else {
            Write-Host "   [ERREUR] Erreur lors de la sauvegarde de la base de donnees" -ForegroundColor Red
        }
    } else {
        Write-Host "   [ATTENTION] Le conteneur de base de donnees n'est pas en cours d'execution" -ForegroundColor Yellow
        Write-Host "   La sauvegarde de la base de donnees sera ignoree." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ATTENTION] Erreur lors de la sauvegarde de la base de donnees: $_" -ForegroundColor Yellow
}

# 2. Copier tous les fichiers du projet (sauf node_modules, __pycache__, etc.)
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

# Fonction récursive pour copier les fichiers
function Copy-ProjectFiles {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludePatterns
    )
    
    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($Source.Length + 1)
        $destPath = Join-Path $Destination $relativePath
        $shouldExclude = $false
        
        foreach ($pattern in $ExcludePatterns) {
            if ($relativePath -like "*$pattern*" -or $_.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            if ($_.PSIsContainer) {
                if (-not (Test-Path $destPath)) {
                    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                }
            } else {
                $destDir = Split-Path -Parent $destPath
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
}

Copy-ProjectFiles -Source $projectRoot -Destination $backupDir -ExcludePatterns $excludePatterns

$fileCount = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object).Count
Write-Host "   [OK] $fileCount fichiers copies" -ForegroundColor Green

# 3. Créer un fichier d'information sur la sauvegarde
Write-Host "`n3. Création du fichier d'information..." -ForegroundColor Cyan
$infoFile = Join-Path $backupDir "BACKUP_INFO.txt"
$info = @"
SAUVEGARDE MAIN COURANTE
========================

Date de sauvegarde: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Système: Windows
Version Docker: $(docker --version 2>$null)
Version Docker Compose: $(docker-compose --version 2>$null)

CONTENU DE LA SAUVEGARDE:
- Code source complet (backend, frontend, scripts, etc.)
- Fichiers de configuration (docker-compose.yml, etc.)
- Documents stockés (backend/storage/documents/)
- Base de données (database_backup.sql)
- Fichiers JSON de configuration (json/)

INSTRUCTIONS DE RESTAURATION:

SOLUTION 1 - Restauration automatique (Recommandee):
1. Aller dans le dossier RESTORE_SCRIPTS/ de cette sauvegarde
2. Windows: Executer .\RESTAURER.ps1
3. Linux/Mac: Executer ./RESTAURER.sh (apres chmod +x)

SOLUTION 2 - Restauration avec chemins specifies:
1. Windows: .\restore.ps1 "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"
2. Linux/Mac: ./restore.sh "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"
3. Exemple: .\restore.ps1 "E:\backup\main_courante_backup_20240101_120000" "C:\main_courante"

Voir RESTORE_SCRIPTS/README_RESTORE.md pour plus de details

IMPORTANT:
- Assurez-vous que Docker et Docker Compose sont installés sur le PC de destination
- Le projet doit être restauré dans un dossier nommé 'main_courante'
- Les ports 5433, 8000 et 3001 doivent être disponibles
"@

Set-Content -Path $infoFile -Value $info -Encoding UTF8
Write-Host "   [OK] Fichier d'information cree" -ForegroundColor Green

# 4. Copier les scripts de restauration
Write-Host "`n4. Copie des scripts de restauration..." -ForegroundColor Cyan
$restoreScriptsDir = Join-Path $backupDir "RESTORE_SCRIPTS"
New-Item -ItemType Directory -Path $restoreScriptsDir -Force | Out-Null

# Copier les scripts de restauration
$scriptsToCopy = @(
    "restore.ps1",
    "restore.sh",
    "RESTAURER.ps1",
    "RESTAURER.sh",
    "README_BACKUP.md",
    "README_RESTORE.md"
)

foreach ($script in $scriptsToCopy) {
    $sourceScript = Join-Path $projectRoot "scripts\$script"
    if (Test-Path $sourceScript) {
        Copy-Item -Path $sourceScript -Destination $restoreScriptsDir -Force
        Write-Host "   [OK] $script copie" -ForegroundColor Gray
    }
}

# Créer un fichier README dans le dossier RESTORE_SCRIPTS
$restoreReadme = Join-Path $restoreScriptsDir "LIRE_MOI.txt"
$restoreInfo = @"
SCRIPTS DE RESTAURATION
=======================

Ce dossier contient les scripts necessaires pour restaurer cette sauvegarde.

INSTRUCTIONS:

Pour Windows (PowerShell):
1. Ouvrez PowerShell en tant qu'administrateur
2. Naviguez vers ce dossier (RESTORE_SCRIPTS) dans la sauvegarde
3. Executez simplement: .\RESTAURER.ps1
   (Le script detectera automatiquement le chemin de sauvegarde)

Le script vous demandera:
- Le chemin de la sauvegarde (parent du dossier RESTORE_SCRIPTS)
- Le chemin de destination (ex: C:\main_courante)

Ou avec chemins complets:
.\restore.ps1 "CHEMIN_VERS_SAUVEGARDE" "C:\main_courante"

Pour Linux/Mac (Bash):
1. Ouvrez un terminal
2. Naviguez vers ce dossier (RESTORE_SCRIPTS) dans la sauvegarde
3. Rendez le script executable: chmod +x RESTAURER.sh
4. Executez simplement: ./RESTAURER.sh
   (Le script detectera automatiquement le chemin de sauvegarde)

Le script vous demandera:
- Le chemin de la sauvegarde (parent du dossier RESTORE_SCRIPTS)
- Le chemin de destination (ex: ~/main_courante)

Ou avec chemins complets:
./restore.sh "CHEMIN_VERS_SAUVEGARDE" ~/main_courante

IMPORTANT:
- Docker et Docker Compose doivent etre installes sur le PC de destination
- Les ports 5433, 8000 et 3001 doivent etre disponibles
- Le chemin de sauvegarde doit pointer vers le dossier principal de sauvegarde (pas RESTORE_SCRIPTS)
"@

Set-Content -Path $restoreReadme -Value $restoreInfo -Encoding UTF8
Write-Host "   [OK] Scripts de restauration copies" -ForegroundColor Green

# 5. Calculer la taille totale
$totalSize = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
$totalSizeRounded = [math]::Round($totalSize, 2)
Write-Host "`n=== Sauvegarde terminee avec succes ===" -ForegroundColor Green
Write-Host "Taille totale: $totalSizeRounded GB" -ForegroundColor Cyan
Write-Host "Emplacement: $backupDir" -ForegroundColor Cyan
Write-Host "`nVous pouvez maintenant copier ce dossier sur votre cle USB." -ForegroundColor Yellow

