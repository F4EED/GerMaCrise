# Script pour importer TOUS les départements BAN manquants
# Copie les fichiers dans Docker et les importe un par un

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "IMPORT DE TOUS LES DÉPARTEMENTS BAN MANQUANTS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "C:\Users\Admin\Documents\Export BAN"
$containerName = "main_courante_backend"
$destDir = "/json"

# Vérifier que le répertoire source existe
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Répertoire source non trouvé: $sourceDir" -ForegroundColor Red
    exit 1
}

# Récupérer les départements présents dans la base
Write-Host "📊 Récupération des départements présents dans la base..." -ForegroundColor Yellow
$query = "SELECT DISTINCT LEFT((proprietes::json->>'INSEE_COM')::text, 2) as dept FROM ban WHERE proprietes IS NOT NULL AND proprietes::json->>'INSEE_COM' IS NOT NULL AND LENGTH((proprietes::json->>'INSEE_COM')::text) >= 2 ORDER BY dept;"
$depts_presents = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
    Where-Object { $_.Trim() -ne '' } | 
    ForEach-Object { $_.Trim() }

Write-Host "   $($depts_presents.Count) département(s) déjà présent(s)" -ForegroundColor Green

# Récupérer tous les fichiers disponibles
Write-Host "📁 Recherche des fichiers GeoJSON disponibles..." -ForegroundColor Yellow
$fichiers = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson"
$depts_disponibles = $fichiers | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") {
        $matches[1]
    }
} | Sort-Object

# Ajouter 2A et 2B s'ils existent
if (Test-Path "$sourceDir\BAN_2A.geojson") {
    $depts_disponibles = $depts_disponibles + "2A"
}
if (Test-Path "$sourceDir\BAN_2B.geojson") {
    $depts_disponibles = $depts_disponibles + "2B"
}
$depts_disponibles = $depts_disponibles | Sort-Object

Write-Host "   $($depts_disponibles.Count) fichier(s) GeoJSON trouvé(s)" -ForegroundColor Green

# Identifier les départements manquants
$depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }

if ($depts_manquants.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ Tous les départements disponibles sont déjà importés!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📦 $($depts_manquants.Count) département(s) à importer: $($depts_manquants -join ', ')" -ForegroundColor Yellow

# Afficher la liste des fichiers à importer
Write-Host ""
Write-Host "📋 Fichiers à importer:" -ForegroundColor Yellow
$totalSize = 0
foreach ($dept in $depts_manquants | Sort-Object) {
    $fichier = Get-Item "$sourceDir\BAN_$dept.geojson" -ErrorAction SilentlyContinue
    if ($fichier) {
        $tailleMB = [math]::Round($fichier.Length / 1MB, 2)
        $totalSize += $tailleMB
        Write-Host "   - BAN_$dept.geojson ($tailleMB MB)" -ForegroundColor Gray
    }
}
Write-Host "   Total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Début de l'import automatique...`n" -ForegroundColor Cyan
$total_importes = 0
$total_echoues = 0
$depts_restants = $depts_manquants.Count

foreach ($dept in $depts_manquants | Sort-Object) {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "📂 IMPORTATION DU DÉPARTEMENT $dept" -ForegroundColor Cyan
    Write-Host "   ⏳ $depts_restants département(s) restant(s) à importer" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    
    # Copier le fichier vers Docker
    $fichierSource = "$sourceDir\BAN_$dept.geojson"
    if (-not (Test-Path $fichierSource)) {
        Write-Host "   ❌ Fichier non trouvé: $fichierSource" -ForegroundColor Red
        $total_echoues++
        $depts_restants--
        continue
    }
    
    Write-Host "   📋 Copie du fichier vers Docker..." -ForegroundColor Yellow
    $copyResult = docker cp "$fichierSource" "${containerName}:${destDir}/BAN_$dept.geojson" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erreur lors de la copie: $copyResult" -ForegroundColor Red
        $total_echoues++
        $depts_restants--
        continue
    }
    Write-Host "   ✅ Fichier copié avec succès" -ForegroundColor Green
    
    # Importer le département
    Write-Host "   📥 Import en cours..." -ForegroundColor Yellow
    $importResult = docker exec $containerName python scripts/import_ban_departements_manquants_avec_transformation.py --yes 2>&1
    
    # Vérifier si l'import a réussi
    if ($importResult -match "DÉPARTEMENT $dept IMPORTÉ AVEC SUCCÈS" -or $importResult -match "département\(s\) déjà présent\(s\)") {
        Write-Host ""
        Write-Host "   ✅ DÉPARTEMENT $dept IMPORTÉ AVEC SUCCÈS!" -ForegroundColor Green
        $total_importes++
        
        # Extraire le nombre d'adresses importées
        if ($importResult -match '(\d{1,3}(?:\s?\d{3})*) adresses importées') {
            $nbAdresses = $matches[1]
            Write-Host "   📍 $nbAdresses adresses importées" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "   ❌ ÉCHEC DE L'IMPORT DU DÉPARTEMENT $dept" -ForegroundColor Red
        $total_echoues++
    }
    
    $depts_restants--
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
$totalResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
if ($totalResult -match "(\d+)") {
    $total = $matches[1] -replace '\s', ''
    $totalFormatted = [int]$total
    $totalStr = $totalFormatted.ToString('N0')
    Write-Host "   📊 Total dans la base: $totalStr adresses" -ForegroundColor Gray
}

# Vérifier les départements restants
Write-Host ""
Write-Host "📊 Vérification des départements restants..." -ForegroundColor Yellow
$depts_presents_final = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
    Where-Object { $_.Trim() -ne '' } | 
    ForEach-Object { $_.Trim() }
$depts_restants_final = $depts_disponibles | Where-Object { $depts_presents_final -notcontains $_ }

if ($depts_restants_final.Count -gt 0) {
    Write-Host "   ⚠️  $($depts_restants_final.Count) département(s) restant(s) à importer: $($depts_restants_final -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Tous les départements disponibles sont maintenant importés!" -ForegroundColor Green
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
