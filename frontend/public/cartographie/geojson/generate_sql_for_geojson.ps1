# Script PowerShell pour générer automatiquement les scripts SQL pour les fichiers GeoJSON
# Utilisation: .\generate_sql_for_geojson.ps1
# Génère les scripts SQL pour routes.geojson, PR_Routier.geojson et communes-42-loire.geojson

$GEOJSON_PATH = "C:\iot-terrain\germacrise\geojson"
$PYTHON_SCRIPT = "$GEOJSON_PATH\import_geojson_auto.py"

Write-Host "Génération des scripts SQL pour les fichiers GeoJSON..." -ForegroundColor Cyan

# Fichiers à traiter avec leur nom de table correspondant
$files = @(
    @{ File = "$GEOJSON_PATH\routes.geojson"; Table = "routes_geojson" },
    @{ File = "$GEOJSON_PATH\PR_Routier.geojson"; Table = "pr_routier_geojson" },
    @{ File = "$GEOJSON_PATH\communes-42-loire.geojson"; Table = "communes_42_loire_geojson" }
)

foreach ($item in $files) {
    $file = $item.File
    $table = $item.Table
    
    if (Test-Path $file) {
        Write-Host "`nGénération du script SQL pour $file..." -ForegroundColor Yellow
        python $PYTHON_SCRIPT $file $table
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Script SQL généré avec succès pour $table" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Erreur lors de la génération du script SQL pour $file" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✗ Fichier introuvable: $file" -ForegroundColor Red
    }
}

Write-Host "`nGénération terminée !" -ForegroundColor Green
Write-Host "Tu peux maintenant exécuter les scripts SQL générés dans DBeaver ou pgAdmin 4." -ForegroundColor Cyan

