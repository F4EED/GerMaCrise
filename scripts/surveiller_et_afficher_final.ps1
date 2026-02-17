# Script pour surveiller l'import et afficher le resume final a la fin

$ErrorActionPreference = "Continue"

Write-Host "Surveillance de l'import BAN en cours..." -ForegroundColor Yellow
Write-Host ""

$sourceDir = "C:\Users\Admin\Documents\Export BAN"
$depts_disponibles = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson" -ErrorAction SilentlyContinue | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") {
        $matches[1]
    }
} | Sort-Object

# Ajouter 2A et 2B
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

$query = "SELECT DISTINCT LEFT((proprietes::json->>'INSEE_COM')::text, 2) FROM ban WHERE proprietes IS NOT NULL AND proprietes::json->>'INSEE_COM' IS NOT NULL AND LENGTH((proprietes::json->>'INSEE_COM')::text) >= 2 ORDER BY LEFT((proprietes::json->>'INSEE_COM')::text, 2);"

$dernierCompte = 0
$stabilite = 0
$maxStabilite = 10  # Attendre 10 verifications stables avant de considerer que c'est termine

while ($true) {
    Start-Sleep -Seconds 30
    
    $depts_presents = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
        Where-Object { $_.Trim() -ne '' } | 
        ForEach-Object { $_.Trim() } | 
        Sort-Object
    
    $depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }
    
    $compteActuel = $depts_presents.Count
    
    if ($compteActuel -eq $dernierCompte) {
        $stabilite++
    } else {
        $stabilite = 0
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Progression: $compteActuel departements importes, $($depts_manquants.Count) restants" -ForegroundColor Cyan
    }
    
    $dernierCompte = $compteActuel
    
    # Si le nombre est stable et qu'il n'y a plus de departements manquants, on a termine
    if ($stabilite -ge $maxStabilite -or $depts_manquants.Count -eq 0) {
        Write-Host ""
        Write-Host "Import termine ou stable. Affichage du resume final..." -ForegroundColor Green
        Write-Host ""
        break
    }
}

# Afficher le resume final
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "RESUME FINAL DE L'IMPORT BAN" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$depts_presents_final = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
    Where-Object { $_.Trim() -ne '' } | 
    ForEach-Object { $_.Trim() } | 
    Sort-Object

$depts_manquants_final = $depts_disponibles | Where-Object { $depts_presents_final -notcontains $_ }

$totalResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
$totalAdresses = 0
if ($totalResult -match "(\d+)") {
    $totalAdresses = [int]($matches[1] -replace '\s', '')
}

Write-Host "NOMBRE TOTAL DE DEPARTEMENTS DANS LA BASE: $($depts_presents_final.Count)" -ForegroundColor Green
Write-Host "   Liste: $($depts_presents_final -join ', ')" -ForegroundColor Gray
Write-Host ""

Write-Host "Total d'adresses dans la base: $($totalAdresses.ToString('N0'))" -ForegroundColor Cyan
Write-Host ""

if ($depts_manquants_final.Count -eq 0) {
    Write-Host "SUCCES: Tous les departements disponibles sont importes!" -ForegroundColor Green
    Write-Host "   Aucun departement manquant" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION: $($depts_manquants_final.Count) DEPARTEMENT(S) MANQUANT(S)" -ForegroundColor Yellow
    Write-Host "   Liste des departements manquants: $($depts_manquants_final -join ', ')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
