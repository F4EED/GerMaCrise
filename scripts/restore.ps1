# Script de restauration complète du projet Main Courante
# Usage: .\scripts\restore.ps1 [CHEMIN_SAUVEGARDE] [CHEMIN_DESTINATION]
# Exemple: .\scripts\restore.ps1 E:\main_courante_backup_20240101_120000 C:\main_courante

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = $null,
    
    [Parameter(Mandatory=$false)]
    [string]$DestinationPath = $null
)

$ErrorActionPreference = "Stop"

# Fonction pour obtenir le chemin de sauvegarde
function Get-BackupPath {
    if ($BackupPath) {
        return $BackupPath.TrimEnd('\').TrimEnd('/')
    }
    
    # Détection automatique si exécuté depuis RESTORE_SCRIPTS
    $currentDir = (Get-Location).Path
    if ($currentDir -like "*RESTORE_SCRIPTS*") {
        $parentPath = Split-Path -Parent $currentDir
        $dbFile = Join-Path $parentPath "database_backup.sql"
        if (Test-Path $dbFile) {
            Write-Host "`n[INFO] Chemin de sauvegarde detecte automatiquement: $parentPath" -ForegroundColor Green
            return $parentPath.TrimEnd('\').TrimEnd('/')
        }
    }
    
    Write-Host "`n=== Restauration du projet Main Courante ===" -ForegroundColor Cyan
    Write-Host "Veuillez indiquer le chemin du dossier de sauvegarde" -ForegroundColor Yellow
    Write-Host "Exemple: E:\main_courante_backup_20240101_120000" -ForegroundColor Gray
    Write-Host "Astuce: Si vous etes dans RESTORE_SCRIPTS, le chemin parent sera utilise automatiquement" -ForegroundColor Gray
    $path = Read-Host "Chemin de sauvegarde"
    return $path.TrimEnd('\').TrimEnd('/')
}

# Fonction pour obtenir le chemin de destination
function Get-DestinationPath {
    if ($DestinationPath) {
        return $DestinationPath.TrimEnd('\').TrimEnd('/')
    }
    
    $defaultPath = "C:\main_courante"
    Write-Host "`nOù voulez-vous restaurer le projet ?" -ForegroundColor Yellow
    Write-Host "Appuyez sur Entrée pour utiliser: $defaultPath" -ForegroundColor Gray
    $path = Read-Host "Chemin de destination"
    
    if ([string]::IsNullOrWhiteSpace($path)) {
        return $defaultPath
    }
    return $path.TrimEnd('\').TrimEnd('/')
}

$backupPath = Get-BackupPath
$destPath = Get-DestinationPath

Write-Host "`n=== Vérifications préalables ===" -ForegroundColor Cyan

# Vérifier que le dossier de sauvegarde existe
if (-not (Test-Path $backupPath)) {
    Write-Host "ERREUR: Le dossier de sauvegarde n'existe pas: $backupPath" -ForegroundColor Red
    exit 1
}

# Vérifier que Docker est installé
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker non trouvé"
    }
    Write-Host "[OK] Docker installe: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Docker n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Docker Desktop depuis: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Vérifier que Docker Compose est installé (V2 "docker compose" ou V1 "docker-compose")
$composeVersion = docker compose version 2>$null
if (-not $composeVersion) { $composeVersion = docker-compose --version 2>$null }
if (-not $composeVersion) {
    Write-Host "ERREUR: Docker Compose n'est pas installé (essayez 'docker compose' ou 'docker-compose')" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker Compose installe: $composeVersion" -ForegroundColor Green

# Vérifier que Docker est en cours d'exécution
try {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker non démarré"
    }
    Write-Host "[OK] Docker est en cours d'execution" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Avertissement si le dossier de destination existe déjà
if (Test-Path $destPath) {
    Write-Host "`nATTENTION: Le dossier de destination existe déjà: $destPath" -ForegroundColor Yellow
    Write-Host "Souhaitez-vous le remplacer ? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "O" -and $response -ne "o" -and $response -ne "Y" -and $response -ne "y") {
        Write-Host "Restauration annulée." -ForegroundColor Red
        exit 0
    }
    Write-Host "Suppression de l'ancien dossier..." -ForegroundColor Yellow
    Remove-Item -Path $destPath -Recurse -Force
}

Write-Host "`n=== Début de la restauration ===" -ForegroundColor Cyan
Write-Host "Source: $backupPath" -ForegroundColor Cyan
Write-Host "Destination: $destPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Utilisation:" -ForegroundColor Gray
Write-Host "  .\restore.ps1 [CHEMIN_SAUVEGARDE] [CHEMIN_DESTINATION]" -ForegroundColor Gray
Write-Host '  Exemple: .\restore.ps1 "E:\backup\main_courante_backup_20240101_120000" "C:\main_courante"' -ForegroundColor Gray
Write-Host ""

# Fonction de copie standard (fallback)
function Copy-ProjectFilesStandard {
    param($sourcePath, $destPath)
    
    Get-ChildItem -Path $sourcePath -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($sourcePath.Length + 1)
        
        # Ignorer le fichier de sauvegarde de base de données et RESTORE_SCRIPTS
        if ($relativePath -like "database_backup.sql" -or $relativePath -like "RESTORE_SCRIPTS*") {
            return
        }
        
        $destFilePath = Join-Path $destPath $relativePath
        
        if ($_.PSIsContainer) {
            if (-not (Test-Path $destFilePath)) {
                New-Item -ItemType Directory -Path $destFilePath -Force | Out-Null
            }
        } else {
            $destDir = Split-Path -Parent $destFilePath
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item -Path $_.FullName -Destination $destFilePath -Force
        }
    }
    
    $fileCount = (Get-ChildItem -Path $destPath -Recurse -File | Measure-Object).Count
    Write-Host "   [OK] $fileCount fichiers restaures" -ForegroundColor Green
}

# 1. Copier tous les fichiers du projet
Write-Host "`n1. Copie des fichiers du projet..." -ForegroundColor Cyan

# Créer le répertoire de destination
New-Item -ItemType Directory -Path $destPath -Force | Out-Null

# Utiliser Robocopy pour une copie plus rapide et efficace (Windows)
if (Get-Command robocopy -ErrorAction SilentlyContinue) {
    Write-Host "   Copie avec Robocopy (plus rapide)..." -ForegroundColor Gray
    
    $robocopyArgs = @(
        $backupPath,
        $destPath,
        "/E",           # Copier les sous-dossiers, y compris les vides
        "/XD", "RESTORE_SCRIPTS",  # Exclure le dossier RESTORE_SCRIPTS
        "/XF", "database_backup.sql",  # Exclure database_backup.sql
        "/NFL",         # Ne pas lister les fichiers
        "/NDL",         # Ne pas lister les dossiers
        "/NJH",         # Pas d'en-tête de travail
        "/NJS",         # Pas de résumé
        "/NP"           # Pas de progression
    )
    
    $robocopyResult = & robocopy @robocopyArgs 2>&1
    $robocopyExitCode = $LASTEXITCODE
    
    # Robocopy retourne 0-7 pour succès, 8+ pour erreurs
    if ($robocopyExitCode -le 7) {
        $fileCount = (Get-ChildItem -Path $destPath -Recurse -File | Measure-Object).Count
        Write-Host "   [OK] $fileCount fichiers restaures (avec Robocopy)" -ForegroundColor Green
    } else {
        Write-Host "   [ATTENTION] Erreur avec Robocopy, utilisation de la methode standard..." -ForegroundColor Yellow
        Copy-ProjectFilesStandard -sourcePath $backupPath -destPath $destPath
    }
} else {
    # Méthode standard si Robocopy n'est pas disponible
    Copy-ProjectFilesStandard -sourcePath $backupPath -destPath $destPath
}

# 2. Naviguer vers le dossier de destination
Push-Location $destPath

# 3. Arrêter les conteneurs existants s'ils existent
Write-Host "`n2. Arrêt des conteneurs existants..." -ForegroundColor Cyan
try {
    docker compose down 2>$null | Out-Null
    Write-Host "   [OK] Conteneurs arretes (s'ils existaient)" -ForegroundColor Green
} catch {
    Write-Host "   [INFO] Aucun conteneur existant a arreter" -ForegroundColor Gray
}

# 4. Reconstruire et démarrer les conteneurs
Write-Host "`n3. Construction et démarrage des conteneurs..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre plusieurs minutes la première fois...)" -ForegroundColor Gray

try {
    # Démarrer d'abord la base de données
    Write-Host "   Démarrage de la base de données..." -ForegroundColor Gray
    docker compose up -d db
    
    # Attendre que la base de données soit prête
    Write-Host "   Attente que la base de données soit prête..." -ForegroundColor Gray
    $maxRetries = 30
    $retryCount = 0
    $dbReady = $false
    
    while ($retryCount -lt $maxRetries -and -not $dbReady) {
        Start-Sleep -Seconds 2
        $health = docker exec main_courante_db pg_isready -U maincourante 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dbReady = $true
        }
        $retryCount++
    }
    
    if (-not $dbReady) {
        Write-Host "   [ATTENTION] La base de donnees prend plus de temps que prevu, continuation..." -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] Base de donnees prete" -ForegroundColor Green
    }
    
    # Restaurer la base de données
    $dbBackupFile = Join-Path $backupPath "database_backup.sql"
    if (Test-Path $dbBackupFile) {
        Write-Host "`n4. Restauration de la base de données..." -ForegroundColor Cyan
        Write-Host "   (Cela peut prendre quelques minutes selon la taille de la base...)" -ForegroundColor Gray
        
        # Supprimer la base de données existante et la recréer
        docker exec -i main_courante_db psql -U maincourante -d postgres -c "DROP DATABASE IF EXISTS main_courante;"
        docker exec -i main_courante_db psql -U maincourante -d postgres -c "CREATE DATABASE main_courante;"
        
        # Restaurer la sauvegarde
        Get-Content $dbBackupFile | docker exec -i main_courante_db psql -U maincourante -d main_courante
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Base de donnees restauree" -ForegroundColor Green
        } else {
            Write-Host "   [ATTENTION] Erreur lors de la restauration de la base de donnees" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n4. Aucune sauvegarde de base de donnees trouvee, initialisation standard..." -ForegroundColor Yellow
        docker compose run --rm backend python -m app.init_db 2>$null | Out-Null
    }
    
    # Démarrer tous les services
    Write-Host "`n5. Démarrage de tous les services..." -ForegroundColor Cyan
    docker compose up -d
    
    Write-Host "   [OK] Tous les services demarres" -ForegroundColor Green
    
} catch {
    Write-Host "   [ERREUR] Erreur lors du demarrage des conteneurs: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host "`n=== Restauration terminee avec succes ===" -ForegroundColor Green
Write-Host "`nProjet restaure dans: $destPath" -ForegroundColor Cyan
Write-Host "`nAcces a l'application:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   - Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
Write-Host "   cd $destPath" -ForegroundColor Gray
Write-Host "   docker compose logs -f    # Voir les logs" -ForegroundColor Gray
Write-Host "   docker compose down       # Arrêter les services" -ForegroundColor Gray
Write-Host "   docker compose up -d      # Démarrer les services" -ForegroundColor Gray

