# Script wrapper pour faciliter la restauration depuis RESTORE_SCRIPTS
# Ce script peut etre execute directement depuis le dossier RESTORE_SCRIPTS
# Usage: .\RESTAURER.ps1 [CHEMIN_DESTINATION]

param(
    [Parameter(Mandatory=$false)]
    [string]$DestinationPath = $null
)

$ErrorActionPreference = "Stop"

# Obtenir le repertoire courant
$currentDir = (Get-Location).Path

# Verifier qu'on est dans RESTORE_SCRIPTS ou dans la sauvegarde
$backupPath = $null
if ($currentDir -like "*RESTORE_SCRIPTS*") {
    $backupPath = Split-Path -Parent $currentDir
    Write-Host "[INFO] Chemin de sauvegarde detecte: $backupPath" -ForegroundColor Green
} elseif (Test-Path (Join-Path $currentDir "database_backup.sql")) {
    $backupPath = $currentDir
    Write-Host "[INFO] Chemin de sauvegarde detecte: $backupPath" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Ce script doit etre execute depuis RESTORE_SCRIPTS ou le dossier de sauvegarde" -ForegroundColor Red
    Write-Host "Placez-vous dans le dossier RESTORE_SCRIPTS et relancez le script." -ForegroundColor Yellow
    exit 1
}

# Verifier que le fichier restore.ps1 existe (dans le meme dossier que ce script)
$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) {
    $scriptPath = $PSCommandPath
}
$scriptDir = Split-Path -Parent $scriptPath
$restoreScript = Join-Path $scriptDir "restore.ps1"

if (-not (Test-Path $restoreScript)) {
    # Essayer de trouver restore.ps1 dans le repertoire courant
    $restoreScript = Join-Path $currentDir "restore.ps1"
    if (-not (Test-Path $restoreScript)) {
        Write-Host "[ERREUR] Le script restore.ps1 est introuvable" -ForegroundColor Red
        Write-Host "Assurez-vous que restore.ps1 est dans le meme dossier que RESTAURER.ps1" -ForegroundColor Yellow
        exit 1
    }
}

# Obtenir le chemin de destination
$destPath = $DestinationPath
if (-not $destPath) {
    # Proposer un chemin par defaut base sur le disque system
    $defaultPath = "C:\main_courante"
    Write-Host "`nOu voulez-vous restaurer le projet ?" -ForegroundColor Yellow
    Write-Host "Appuyez sur Entree pour utiliser: $defaultPath" -ForegroundColor Gray
    $inputPath = Read-Host "Chemin de destination"
    
    if ([string]::IsNullOrWhiteSpace($inputPath)) {
        $destPath = $defaultPath
    } else {
        $destPath = $inputPath
    }
}

# Executer le script de restauration
Write-Host "`n[INFO] Lancement de la restauration..." -ForegroundColor Cyan
Write-Host "Source: $backupPath" -ForegroundColor Gray
Write-Host "Destination: $destPath" -ForegroundColor Gray
Write-Host ""

& $restoreScript -BackupPath $backupPath -DestinationPath $destPath

