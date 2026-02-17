#!/bin/bash
# Script Bash pour importer les fichiers GeoJSON dans Postgres avec ogr2ogr
# Utilisation: ./import_geojson_ogr2ogr.sh
# Ou exécute les commandes individuellement dans PowerShell

# Configuration
DBNAME=meshtastic
DBUSER=admin
DBPASS=admin
DBHOST=localhost
GEOJSON_PATH=/usr/share/nginx/html/geojson

# Importer PR_Routier.geojson
echo "Import de PR_Routier.geojson..."
docker exec -i postgis ogr2ogr -f "PostgreSQL" \
  PG:"dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" \
  $GEOJSON_PATH/PR_Routier.geojson \
  -nln pr_routier_geojson \
  -overwrite \
  -lco GEOMETRY_NAME=geom

# Importer routes.geojson
echo "Import de routes.geojson..."
docker exec -i postgis ogr2ogr -f "PostgreSQL" \
  PG:"dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" \
  $GEOJSON_PATH/routes.geojson \
  -nln routes_geojson \
  -overwrite \
  -lco GEOMETRY_NAME=geom

# Importer communes-42-loire.geojson
echo "Import de communes-42-loire.geojson..."
docker exec -i postgis ogr2ogr -f "PostgreSQL" \
  PG:"dbname=$DBNAME user=$DBUSER password=$DBPASS host=$DBHOST" \
  $GEOJSON_PATH/communes-42-loire.geojson \
  -nln communes_42_loire_geojson \
  -overwrite \
  -lco GEOMETRY_NAME=geom

echo "Import terminé !"

