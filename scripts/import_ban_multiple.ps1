# Script pour importer plusieurs fichiers BAN en mode ajout
$departements = @("13", "26", "30", "33", "43", "48", "38", "69", "76", "84", "83")

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Import multiple de fichiers BAN en mode ajout" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Vérifier le total avant
$total_avant = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" | Out-String
$total_avant = $total_avant.Trim()
Write-Host "`nTotal avant: $total_avant adresses" -ForegroundColor Yellow

$importes = 0
$ignores = 0

foreach ($dept in $departements) {
    $source = "C:\Users\Admin\Documents\Export BAN\BAN_$dept.geojson"
    
    if (Test-Path $source) {
        $size = [math]::Round((Get-Item $source).Length / 1MB, 2)
        Write-Host "`n📂 Traitement de BAN_$dept.geojson ($size MB)..." -ForegroundColor Green
        
        # Copier le fichier
        Copy-Item $source -Destination "json\BAN_$dept.geojson" -Force | Out-Null
        
        # Copier dans le conteneur
        docker cp "json\BAN_$dept.geojson" main_courante_backend:/json/BAN_$dept.geojson 2>&1 | Out-Null
        
        # Importer
        Write-Host "   Import en cours..." -ForegroundColor Gray
        $result = docker exec main_courante_backend python -m scripts.import_ban /json/BAN_$dept.geojson --yes --append 2>&1
        
        # Extraire le nombre d'adresses importées
        if ($result -match "(\d+,\d+|\d+) adresses importées") {
            $importes++
            Write-Host "   ✅ Import réussi" -ForegroundColor Green
        } else {
            $ignores++
            Write-Host "   ⚠️  Problème lors de l'import" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Fichier non trouvé: $source" -ForegroundColor Yellow
        $ignores++
    }
}

# Vérifier le total après
$total_apres = docker exec main_courante_db psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" | Out-String
$total_apres = $total_apres.Trim()
$ajoutees = [int]$total_apres - [int]$total_avant

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Résumé de l'import" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Total avant: $total_avant adresses" -ForegroundColor Yellow
Write-Host "Total après: $total_apres adresses" -ForegroundColor Green
Write-Host "Adresses ajoutées: $ajoutees" -ForegroundColor Green
Write-Host "Fichiers traités avec succès: $importes" -ForegroundColor Green
Write-Host "Fichiers ignorés/erreurs: $ignores" -ForegroundColor $(if ($ignores -gt 0) { "Yellow" } else { "Green" })
Write-Host "============================================================" -ForegroundColor Cyan
