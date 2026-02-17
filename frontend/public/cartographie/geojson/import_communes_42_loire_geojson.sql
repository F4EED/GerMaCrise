-- Script SQL pour importer communes-42-loire.geojson dans Postgres avec PostGIS
-- Table créée: communes_42_loire_geojson
-- À exécuter dans DBeaver ou pgAdmin 4
-- Base de données: meshtastic (ou terrain_db selon tes besoins)
-- IMPORTANT: La base de données doit avoir l'extension PostGIS activée
-- NOTE: Ce fichier contient probablement des Polygones (Polygon) pour les communes

-- 1. Activer l'extension PostGIS si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS communes_42_loire_geojson (
    id SERIAL PRIMARY KEY,
    type_geometry VARCHAR(50),
    geom GEOMETRY(GEOMETRY, 4326),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer des index spatiaux pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_communes_42_loire_geojson_geom ON communes_42_loire_geojson USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_communes_42_loire_geojson_properties ON communes_42_loire_geojson USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_communes_42_loire_nom ON communes_42_loire_geojson((properties->>'nom'));
CREATE INDEX IF NOT EXISTS idx_communes_42_loire_code_insee ON communes_42_loire_geojson((properties->>'code_insee'));

-- 4. Méthode recommandée pour les gros fichiers: Utiliser ogr2ogr via Docker
-- Commande à exécuter dans PowerShell (depuis C:\iot-terrain) :
-- docker exec -i postgis ogr2ogr -f "PostgreSQL" PG:"dbname=meshtastic user=admin password=admin host=localhost" /usr/share/nginx/html/geojson/communes-42-loire.geojson -nln communes_42_loire_geojson -overwrite -lco GEOMETRY_NAME=geom

-- 5. Méthode alternative: Fonction pour importer depuis JSONB (pour les petits extraits)
CREATE OR REPLACE FUNCTION import_communes_from_json(json_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    feature JSONB;
    geom_type TEXT;
    geom_json JSONB;
    props JSONB;
    count_inserted INTEGER := 0;
BEGIN
    FOR feature IN SELECT * FROM jsonb_array_elements(json_data->'features')
    LOOP
        geom_type := feature->'geometry'->>'type';
        geom_json := feature->'geometry';
        props := feature->'properties';
        
        INSERT INTO communes_42_loire_geojson (
            type_geometry, geom, properties
        ) VALUES (
            geom_type,
            ST_SetSRID(ST_GeomFromGeoJSON(geom_json::TEXT), 4326),
            props
        );
        
        count_inserted := count_inserted + 1;
    END LOOP;
    
    RETURN count_inserted;
END;
$$ LANGUAGE plpgsql;

-- 6. Vérifier que les données ont été insérées
SELECT COUNT(*) AS nombre_communes FROM communes_42_loire_geojson;
SELECT 
    id, 
    type_geometry, 
    properties->>'nom' AS nom_commune,
    properties->>'code_insee' AS code_insee,
    properties->>'population' AS population,
    ST_AsText(ST_Centroid(geom)) AS centroid,
    ST_Area(geom::GEOGRAPHY) / 1000000 AS surface_km2
FROM communes_42_loire_geojson 
ORDER BY properties->>'nom'
LIMIT 20;

-- 7. Exporter au format GeoJSON pour le rendu cartographique
-- SELECT json_build_object(
--     'type', 'FeatureCollection',
--     'features', json_agg(
--         json_build_object(
--             'type', 'Feature',
--             'geometry', ST_AsGeoJSON(geom)::json,
--             'properties', properties
--         )
--     )
-- ) AS geojson
-- FROM communes_42_loire_geojson;

-- 8. Requêtes spatiales utiles pour le rendu cartographique
-- Trouver toutes les communes dans une bounding box
-- SELECT * FROM communes_42_loire_geojson 
-- WHERE ST_Intersects(geom, ST_MakeEnvelope(4.0, 45.5, 4.5, 46.0, 4326));

-- Trouver la commune contenant un point donné
-- SELECT nom, code_insee FROM communes_42_loire_geojson 
-- WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(4.39, 45.44), 4326))
-- LIMIT 1;

