# Script simple pour importer tous les departements BAN manquants

$sourceDir = "C:\Users\Admin\Documents\Export BAN"
$containerName = "main_courante_backend"
$destDir = "/json"

Write-Host "================================================================"
Write-Host "IMPORT DES DEPARTEMENTS BAN MANQUANTS"
Write-Host "================================================================"
Write-Host ""

# Recuperer les departements manquants
Write-Host "Analyse des departements manquants..." -ForegroundColor Yellow
$depts_disponibles = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson" | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") { $matches[1] } 
} | Sort-Object

$depts_presents = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT DISTINCT LEFT((proprietes::json->>'INSEE_COM')::text, 2) FROM ban WHERE proprietes IS NOT NULL AND proprietes::json->>'INSEE_COM' IS NOT NULL;" 2>&1 | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }

$depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }

Write-Host "Departements deja presents: $($depts_presents.Count)" -ForegroundColor Green
Write-Host "Fichiers disponibles: $($depts_disponibles.Count)" -ForegroundColor Cyan
Write-Host "Departements manquants: $($depts_manquants.Count)" -ForegroundColor Yellow
Write-Host ""

if ($depts_manquants.Count -eq 0) {
    Write-Host "Tous les departements sont deja importes!" -ForegroundColor Green
    exit 0
}

Write-Host "Liste des departements a importer: $($depts_manquants -join ', ')" -ForegroundColor Gray
Write-Host ""
Write-Host "Debut de l'import..." -ForegroundColor Cyan
Write-Host ""

$total_importes = 0
$total_echoues = 0
$depts_restants = $depts_manquants.Count

foreach ($dept in $depts_manquants | Sort-Object) {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "IMPORTATION DU DEPARTEMENT $dept" -ForegroundColor Cyan
    Write-Host "   $depts_restants departement(s) restant(s)" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    
    $fichierSource = "$sourceDir\BAN_$dept.geojson"
    
    if (-not (Test-Path $fichierSource)) {
        Write-Host "   ERREUR: Fichier non trouve: $fichierSource" -ForegroundColor Red
        $total_echoues++
        $depts_restants--
        continue
    }
    
    Write-Host "   Copie du fichier vers Docker..." -ForegroundColor Yellow
    docker cp "$fichierSource" "${containerName}:${destDir}/BAN_$dept.geojson" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERREUR lors de la copie" -ForegroundColor Red
        $total_echoues++
        $depts_restants--
        continue
    }
    
    Write-Host "   Import en cours..." -ForegroundColor Yellow
    $importResult = docker exec $containerName python scripts/import_ban_departements_manquants_avec_transformation.py --yes 2>&1
    
    if ($importResult -match "DÉPARTEMENT $dept IMPORTÉ AVEC SUCCÈS" -or $importResult -match "département\(s\) déjà présent\(s\)") {
        Write-Host "   SUCCES: Departement $dept importe" -ForegroundColor Green
        $total_importes++
        
        if ($importResult -match '(\d{1,3}(?:\s?\d{3})*) adresses importées') {
            $nbAdresses = $matches[1]
            Write-Host "   $nbAdresses adresses importees" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ECHEC: Departement $dept" -ForegroundColor Red
        $total_echoues++
    }
    
    $depts_restants--
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "RESUME FINAL" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Departements importes avec succes: $total_importes" -ForegroundColor Green
if ($total_echoues -gt 0) {
    Write-Host "   Departements echoues: $total_echoues" -ForegroundColor Red
}

$totalResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
if ($totalResult -match "(\d+)") {
    $total = $matches[1] -replace '\s', ''
    $totalFormatted = [int]$total
    $totalStr = $totalFormatted.ToString('N0')
    Write-Host "   Total d'adresses dans la base: $totalStr" -ForegroundColor Gray
}

# Verifier les departements restants
$depts_presents_final = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT DISTINCT LEFT((proprietes::json->>'INSEE_COM')::text, 2) FROM ban WHERE proprietes IS NOT NULL AND proprietes::json->>'INSEE_COM' IS NOT NULL;" 2>&1 | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }
$depts_restants_final = $depts_disponibles | Where-Object { $depts_presents_final -notcontains $_ }

Write-Host ""
if ($depts_restants_final.Count -gt 0) {
    Write-Host "   Departements restants a importer: $($depts_restants_final.Count)" -ForegroundColor Yellow
    Write-Host "   Liste: $($depts_restants_final -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "   Tous les departements disponibles sont maintenant importes!" -ForegroundColor Green
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
