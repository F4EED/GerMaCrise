# Script PowerShell pour importer les fichiers GeoJSON dans Postgres avec ogr2ogr
# Utilisation: .\import_geojson_ogr2ogr.ps1
# Ou exécute les commandes individuellement dans PowerShell

# Configuration
$DBNAME = "meshtastic"
$DBUSER = "admin"
$DBPASS = "admin"
$DBHOST = "postgis"  # Nom du conteneur dans le réseau Docker
$GEOJSON_PATH = "C:\iot-terrain\germacrise\geojson"

# Vérifier que les fichiers existent
Write-Host "Vérification des fichiers GeoJSON..." -ForegroundColor Cyan
$files = @(
    "$GEOJSON_PATH\PR_Routier.geojson",
    "$GEOJSON_PATH\routes.geojson",
    "$GEOJSON_PATH\communes-42-loire.geojson"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ Trouvé: $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Introuvable: $file" -ForegroundColor Red
    }
}

Write-Host "`nImport des fichiers GeoJSON dans Postgres avec ogr2ogr..." -ForegroundColor Cyan

# Méthode 1: Utiliser un conteneur temporaire avec ogr2ogr qui monte le répertoire local
# Cette méthode copie les fichiers dans le conteneur postgis d'abord

Write-Host "`n1. Copie des fichiers dans le conteneur postgis..." -ForegroundColor Yellow
docker cp "$GEOJSON_PATH\PR_Routier.geojson" postgis:/tmp/PR_Routier.geojson
docker cp "$GEOJSON_PATH\routes.geojson" postgis:/tmp/routes.geojson
docker cp "$GEOJSON_PATH\communes-42-loire.geojson" postgis:/tmp/communes-42-loire.geojson

# Méthode 2: Utiliser ogr2ogr depuis un conteneur GDAL qui a accès aux fichiers montés
Write-Host "`n2. Import de PR_Routier.geojson..." -ForegroundColor Yellow
docker exec -i postgis ogr2ogr -f "PostgreSQL" `
  "PG:dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" `
  /tmp/PR_Routier.geojson `
  -nln pr_routier_geojson `
  -overwrite `
  -lco GEOMETRY_NAME=geom `
  -nlt PROMOTE_TO_MULTI

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PR_Routier.geojson importé avec succès" -ForegroundColor Green
} else {
    Write-Host "  ✗ Erreur lors de l'import de PR_Routier.geojson" -ForegroundColor Red
}

Write-Host "`n3. Import de routes.geojson..." -ForegroundColor Yellow
docker exec -i postgis ogr2ogr -f "PostgreSQL" `
  "PG:dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" `
  /tmp/routes.geojson `
  -nln routes_geojson `
  -overwrite `
  -lco GEOMETRY_NAME=geom `
  -nlt PROMOTE_TO_MULTI

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ routes.geojson importé avec succès" -ForegroundColor Green
} else {
    Write-Host "  ✗ Erreur lors de l'import de routes.geojson" -ForegroundColor Red
}

Write-Host "`n4. Import de communes-42-loire.geojson..." -ForegroundColor Yellow
docker exec -i postgis ogr2ogr -f "PostgreSQL" `
  "PG:dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" `
  /tmp/communes-42-loire.geojson `
  -nln communes_42_loire_geojson `
  -overwrite `
  -lco GEOMETRY_NAME=geom `
  -nlt PROMOTE_TO_MULTI

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ communes-42-loire.geojson importé avec succès" -ForegroundColor Green
} else {
    Write-Host "  ✗ Erreur lors de l'import de communes-42-loire.geojson" -ForegroundColor Red
}

Write-Host "`n5. Nettoyage des fichiers temporaires..." -ForegroundColor Yellow
docker exec -i postgis rm -f /tmp/PR_Routier.geojson /tmp/routes.geojson /tmp/communes-42-loire.geojson

Write-Host "`n6. Vérification des tables créées..." -ForegroundColor Cyan
docker exec -i postgis psql -U $DBUSER -d $DBNAME -c "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes FROM information_schema.tables t WHERE table_schema = 'public' AND table_name LIKE '%geojson' ORDER BY table_name;"

Write-Host "`nImport terminé !" -ForegroundColor Green
Write-Host "Tu peux maintenant vérifier les données dans DBeaver ou pgAdmin 4." -ForegroundColor Cyan

