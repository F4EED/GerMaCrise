# Script pour verifier l'etat final de l'import BAN
# Affiche le nombre total de departements et la liste des manquants

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION FINALE DES DEPARTEMENTS BAN" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "C:\Users\Admin\Documents\Export BAN"

# Recuperer les departements presents dans la base
Write-Host "Recuperation des departements presents dans la base..." -ForegroundColor Yellow
$query = "SELECT DISTINCT LEFT((proprietes::json->>'INSEE_COM')::text, 2) FROM ban WHERE proprietes IS NOT NULL AND proprietes::json->>'INSEE_COM' IS NOT NULL AND LENGTH((proprietes::json->>'INSEE_COM')::text) >= 2 ORDER BY LEFT((proprietes::json->>'INSEE_COM')::text, 2);"
$depts_presents = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
    Where-Object { $_.Trim() -ne '' } | 
    ForEach-Object { $_.Trim() } | 
    Sort-Object

# Recuperer tous les fichiers disponibles
Write-Host "Recuperation des fichiers GeoJSON disponibles..." -ForegroundColor Yellow
$fichiers = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson" -ErrorAction SilentlyContinue
$depts_disponibles = $fichiers | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") {
        $matches[1]
    }
} | Sort-Object

# Ajouter 2A et 2B s'ils existent
if (Test-Path "$sourceDir\BAN_2A.geojson") {
    if ($depts_disponibles -notcontains "2A") {
        $depts_disponibles = $depts_disponibles + "2A"
    }
}
if (Test-Path "$sourceDir\BAN_2B.geojson") {
    if ($depts_disponibles -notcontains "2B") {
        $depts_disponibles = $depts_disponibles + "2B"
    }
}
$depts_disponibles = $depts_disponibles | Sort-Object

# Identifier les departements manquants
$depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }

# Recuperer le total d'adresses
$totalResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
$totalAdresses = 0
if ($totalResult -match "(\d+)") {
    $totalAdresses = [int]($matches[1] -replace '\s', '')
}

# Afficher les resultats
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "RESULTATS FINAUX" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Nombre total de departements dans la base: $($depts_presents.Count)" -ForegroundColor Green
Write-Host "   Liste: $($depts_presents -join ', ')" -ForegroundColor Gray
Write-Host ""

Write-Host "Fichiers GeoJSON disponibles: $($depts_disponibles.Count)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total d'adresses dans la base: $($totalAdresses.ToString('N0'))" -ForegroundColor Cyan
Write-Host ""

if ($depts_manquants.Count -eq 0) {
    Write-Host "SUCCES: Tous les departements disponibles sont importes!" -ForegroundColor Green
    Write-Host "   Aucun departement manquant" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION: $($depts_manquants.Count) departement(s) manquant(s)" -ForegroundColor Yellow
    Write-Host "   Liste des departements manquants: $($depts_manquants -join ', ')" -ForegroundColor Yellow
    
    # Calculer la taille totale des fichiers manquants
    $totalSize = 0
    foreach ($dept in $depts_manquants) {
        $fichier = Get-Item "$sourceDir\BAN_$dept.geojson" -ErrorAction SilentlyContinue
        if ($fichier) {
            $totalSize += $fichier.Length
        }
    }
    if ($totalSize -gt 0) {
        $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
        Write-Host "   Taille totale des fichiers manquants: $totalSizeMB MB" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
