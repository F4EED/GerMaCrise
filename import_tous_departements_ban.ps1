# Script PowerShell pour importer tous les départements BAN manquants
# Ce script copie les fichiers dans Docker et les importe un par un

$sourceDir = "C:\Users\Admin\Documents\Export BAN"
$containerName = "main_courante_backend"
$destDir = "/json"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "IMPORT AUTOMATIQUE DES DÉPARTEMENTS MANQUANTS BAN" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Vérifier que le répertoire source existe
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Répertoire source non trouvé: $sourceDir" -ForegroundColor Red
    exit 1
}

# Obtenir la liste des départements déjà présents
Write-Host "`n📊 Analyse des départements présents dans la base..." -ForegroundColor Yellow
$result = docker exec $containerName python scripts/import_ban_departements_manquants_avec_transformation.py --yes 2>&1
$depts_presents = @()

# Parser la sortie pour extraire les départements présents
foreach ($line in $result) {
    if ($line -match "département\(s\) déjà présent\(s\): (.+)") {
        $depts_str = $matches[1]
        $depts_presents = $depts_str -split ', ' | ForEach-Object { $_.Trim() }
        break
    }
}

Write-Host "   $($depts_presents.Count) département(s) déjà présent(s)" -ForegroundColor Green

# Obtenir tous les fichiers disponibles
Write-Host "`n📁 Recherche des fichiers GeoJSON disponibles..." -ForegroundColor Yellow
$fichiers = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson"
$depts_disponibles = $fichiers | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") {
        $matches[1]
    }
}

Write-Host "   $($depts_disponibles.Count) fichier(s) GeoJSON trouvé(s)" -ForegroundColor Green

# Identifier les départements manquants
$depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }

if ($depts_manquants.Count -eq 0) {
    Write-Host "`n✅ Tous les départements disponibles sont déjà importés!" -ForegroundColor Green
    exit 0
}

Write-Host "`n📦 $($depts_manquants.Count) département(s) à importer: $($depts_manquants -join ', ')" -ForegroundColor Yellow

# Afficher la liste des fichiers à importer
Write-Host "`n📋 Fichiers à importer:" -ForegroundColor Yellow
$totalSize = 0
foreach ($dept in $depts_manquants | Sort-Object) {
    $fichier = Get-Item "$sourceDir\BAN_$dept.geojson"
    $tailleMB = [math]::Round($fichier.Length / 1MB, 2)
    $totalSize += $tailleMB
    Write-Host "   - BAN_$dept.geojson ($tailleMB MB)" -ForegroundColor Gray
}
Write-Host "   Total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Gray

# Demander confirmation
$confirmation = Read-Host "`nContinuer l'import automatique? (o/N)"
if ($confirmation -ne "o" -and $confirmation -ne "O") {
    Write-Host "Import annulé." -ForegroundColor Yellow
    exit 0
}

# Importer chaque département
Write-Host "`n🚀 Début de l'import automatique...`n" -ForegroundColor Cyan
$total_importes = 0
$total_echoues = 0

foreach ($dept in $depts_manquants | Sort-Object) {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "📂 IMPORTATION DU DÉPARTEMENT $dept" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    
    # Copier le fichier vers Docker
    $fichierSource = "$sourceDir\BAN_$dept.geojson"
    Write-Host "   📋 Copie du fichier vers Docker..." -ForegroundColor Yellow
    
    $copyResult = docker cp "$fichierSource" "${containerName}:${destDir}/BAN_$dept.geojson" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erreur lors de la copie: $copyResult" -ForegroundColor Red
        $total_echoues++
        continue
    }
    Write-Host "   ✅ Fichier copié avec succès" -ForegroundColor Green
    
    # Importer le département
    Write-Host "   📥 Import en cours..." -ForegroundColor Yellow
    $importResult = docker exec $containerName python scripts/import_ban_departements_manquants_avec_transformation.py --yes 2>&1
    
    # Vérifier si l'import a réussi (chercher "DÉPARTEMENT X IMPORTÉ AVEC SUCCÈS")
    $successPattern = "DÉPARTEMENT $dept IMPORTÉ AVEC SUCCÈS"
    if ($importResult -match $successPattern) {
        Write-Host "`n✅ DÉPARTEMENT $dept IMPORTÉ AVEC SUCCÈS!" -ForegroundColor Green
        $total_importes++
        
        # Extraire le nombre d'adresses importées
        if ($importResult -match '(\d{1,3}(?:\s?\d{3})*) adresses importées') {
            $nbAdresses = $matches[1]
            Write-Host "   📍 $nbAdresses adresses importées" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n❌ ÉCHEC DE L'IMPORT DU DÉPARTEMENT $dept" -ForegroundColor Red
        Write-Host $importResult -ForegroundColor Red
        $total_echoues++
    }
    
    Write-Host ""
}

# Résumé final
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ FINAL" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   ✅ $total_importes département(s) importé(s) avec succès" -ForegroundColor Green
if ($total_echoues -gt 0) {
    Write-Host "   ❌ $total_echoues département(s) échoué(s)" -ForegroundColor Red
}

# Afficher le total dans la base
$totalResult = docker exec $containerName psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
if ($totalResult -match "(\d+)") {
    $total = $matches[1] -replace '\s', ''
    $totalFormatted = [int]$total
    $totalStr = $totalFormatted.ToString('N0')
    Write-Host "   📊 Total dans la base: $totalStr adresses" -ForegroundColor Gray
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
