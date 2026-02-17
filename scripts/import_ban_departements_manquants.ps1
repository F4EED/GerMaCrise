# Script PowerShell pour importer automatiquement les départements BAN manquants
# Utilise le répertoire "C:\Users\Admin\Documents\Export BAN"
# Affiche le nombre de départements manquants restants au fur et à mesure

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "IMPORT AUTOMATIQUE DES DÉPARTEMENTS BAN MANQUANTS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le répertoire source existe
$sourceDir = "C:\Users\Admin\Documents\Export BAN"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Répertoire source non trouvé: $sourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Répertoire source: $sourceDir" -ForegroundColor Green
Write-Host ""

# Vérifier que Python est disponible
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "❌ Python n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host "   Veuillez installer Python ou l'ajouter au PATH" -ForegroundColor Yellow
    exit 1
}

# Chemin vers le script Python
$scriptPath = Join-Path $PSScriptRoot "..\backend\scripts\import_ban_departements_manquants_windows.py"
$scriptPath = Resolve-Path $scriptPath -ErrorAction SilentlyContinue

if (-not $scriptPath) {
    Write-Host "❌ Script Python non trouvé: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "🐍 Script Python: $scriptPath" -ForegroundColor Green
Write-Host ""

# Vérifier la connexion à la base de données
Write-Host "🔍 Vérification de la connexion à la base de données..." -ForegroundColor Yellow
try {
    $testConn = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Impossible de se connecter à la base de données Docker" -ForegroundColor Red
        Write-Host "   Assurez-vous que Docker est démarré et que les conteneurs sont en cours d'exécution" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Connexion à la base de données réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la vérification de la connexion: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Lancer le script Python avec le répertoire source
Write-Host "🚀 Lancement de l'import automatique..." -ForegroundColor Cyan
Write-Host "   (Les départements manquants seront importés automatiquement)" -ForegroundColor Gray
Write-Host ""

# Exécuter le script Python avec --yes pour éviter la confirmation
python $scriptPath --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "✅ IMPORT TERMINÉ" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "❌ ERREUR LORS DE L'IMPORT" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 1
}
