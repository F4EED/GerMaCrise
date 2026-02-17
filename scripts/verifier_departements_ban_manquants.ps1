# Script PowerShell pour vérifier les départements BAN manquants
# Affiche la liste des départements présents et manquants

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "VÉRIFICATION DES DÉPARTEMENTS BAN" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le répertoire source existe
$sourceDir = "C:\Users\Admin\Documents\Export BAN"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Répertoire source non trouvé: $sourceDir" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion à la base de données
Write-Host "🔍 Connexion à la base de données..." -ForegroundColor Yellow
try {
    $testConn = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT 1;" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Impossible de se connecter à la base de données Docker" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la connexion: $_" -ForegroundColor Red
    exit 1
}

# Récupérer les départements présents dans la base
Write-Host "📊 Récupération des départements présents dans la table BAN..." -ForegroundColor Yellow
$query = @"
SELECT DISTINCT
    LEFT(
        (proprietes::json->>'INSEE_COM')::text, 
        2
    ) as departement
FROM ban
WHERE proprietes IS NOT NULL
    AND proprietes::json->>'INSEE_COM' IS NOT NULL
    AND LENGTH((proprietes::json->>'INSEE_COM')::text) >= 2
ORDER BY departement;
"@

$depts_presents = docker exec main_courante_db psql -U maincourante -d main_courante -t -c $query 2>&1 | 
    Where-Object { $_.Trim() -ne '' } | 
    ForEach-Object { $_.Trim() }

# Récupérer les fichiers disponibles
Write-Host "📁 Recherche des fichiers GeoJSON disponibles..." -ForegroundColor Yellow
$fichiers = Get-ChildItem -Path $sourceDir -Filter "BAN_*.geojson"
$depts_disponibles = $fichiers | ForEach-Object { 
    if ($_.Name -match "BAN_(\d{2}[AB]?)\.geojson") {
        $matches[1]
    }
} | Sort-Object

# Identifier les départements manquants
$depts_manquants = $depts_disponibles | Where-Object { $depts_presents -notcontains $_ }

# Afficher les résultats
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "RÉSULTATS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Départements présents dans la base: $($depts_presents.Count)" -ForegroundColor Green
if ($depts_presents.Count -gt 0) {
    Write-Host "   $($depts_presents -join ', ')" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📁 Fichiers GeoJSON disponibles: $($depts_disponibles.Count)" -ForegroundColor Cyan

Write-Host ""
if ($depts_manquants.Count -eq 0) {
    Write-Host "✅ Tous les départements disponibles sont déjà importés!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Départements manquants: $($depts_manquants.Count)" -ForegroundColor Yellow
    Write-Host "   $($depts_manquants -join ', ')" -ForegroundColor Gray
    
    # Calculer la taille totale des fichiers manquants
    $totalSize = 0
    foreach ($dept in $depts_manquants) {
        $fichier = Get-Item "$sourceDir\BAN_$dept.geojson" -ErrorAction SilentlyContinue
        if ($fichier) {
            $totalSize += $fichier.Length
        }
    }
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host ""
    Write-Host "📦 Taille totale des fichiers manquants: $totalSizeMB MB" -ForegroundColor Gray
}

# Afficher le total d'adresses dans la base
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
$totalResult = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>&1
if ($totalResult -match "(\d+)") {
    $total = $matches[1] -replace '\s', ''
    $totalFormatted = [int]$total
    $totalStr = $totalFormatted.ToString('N0')
    Write-Host "📊 Total d'adresses dans la base: $totalStr" -ForegroundColor Cyan
}
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
