# Script de test pour vérifier la configuration avant l'import BAN

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "TEST DE CONFIGURATION POUR L'IMPORT BAN" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Test 1: Répertoire source
Write-Host "1️⃣  Vérification du répertoire source..." -ForegroundColor Yellow
$sourceDir = "C:\Users\Admin\Documents\Export BAN"
if (Test-Path $sourceDir) {
    $fichiers = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson"
    Write-Host "   ✅ Répertoire trouvé: $sourceDir" -ForegroundColor Green
    Write-Host "   📁 $($fichiers.Count) fichier(s) GeoJSON trouvé(s)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Répertoire non trouvé: $sourceDir" -ForegroundColor Red
    $errors++
}

# Test 2: Python
Write-Host ""
Write-Host "2️⃣  Vérification de Python..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) {
    $version = python --version 2>&1
    Write-Host "   ✅ Python trouvé: $version" -ForegroundColor Green
} else {
    Write-Host "   ❌ Python n'est pas trouvé dans le PATH" -ForegroundColor Red
    $errors++
}

# Test 3: Script Python
Write-Host ""
Write-Host "3️⃣  Vérification du script Python..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "..\backend\scripts\import_ban_departements_manquants_windows.py"
$scriptPath = Resolve-Path $scriptPath -ErrorAction SilentlyContinue
if ($scriptPath) {
    Write-Host "   ✅ Script trouvé: $scriptPath" -ForegroundColor Green
} else {
    Write-Host "   ❌ Script non trouvé" -ForegroundColor Red
    $errors++
}

# Test 4: Docker
Write-Host ""
Write-Host "4️⃣  Vérification de Docker..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host "   ✅ Docker trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker n'est pas trouvé dans le PATH" -ForegroundColor Red
    $errors++
}

# Test 5: Conteneurs Docker
Write-Host ""
Write-Host "5️⃣  Vérification des conteneurs Docker..." -ForegroundColor Yellow
if ($dockerCmd) {
    $dbContainer = docker ps --filter "name=main_courante_db" --format "{{.Names}}" 2>&1
    $backendContainer = docker ps --filter "name=main_courante_backend" --format "{{.Names}}" 2>&1
    
    if ($dbContainer -match "main_courante_db") {
        Write-Host "   ✅ Conteneur main_courante_db est en cours d'exécution" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Conteneur main_courante_db n'est pas en cours d'exécution" -ForegroundColor Red
        $errors++
    }
    
    if ($backendContainer -match "main_courante_backend") {
        Write-Host "   ✅ Conteneur main_courante_backend est en cours d'exécution" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Conteneur main_courante_backend n'est pas en cours d'exécution (optionnel)" -ForegroundColor Yellow
    }
}

# Test 6: Connexion à la base de données
Write-Host ""
Write-Host "6️⃣  Test de connexion à la base de données..." -ForegroundColor Yellow
if ($dockerCmd -and $dbContainer -match "main_courante_db") {
    try {
        $testResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Connexion à la base de données réussie" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Impossible de se connecter à la base de données" -ForegroundColor Red
            $errors++
        }
    } catch {
        Write-Host "   ❌ Erreur lors de la connexion: $_" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ⚠️  Test ignoré (Docker ou conteneur non disponible)" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✅ Tous les tests sont passés avec succès!" -ForegroundColor Green
    Write-Host "   Vous pouvez maintenant lancer l'import avec:" -ForegroundColor Gray
    Write-Host "   .\scripts\import_ban_departements_manquants.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ $errors erreur(s) détectée(s)" -ForegroundColor Red
    Write-Host "   Veuillez corriger les erreurs avant de lancer l'import" -ForegroundColor Yellow
}
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
