-- Script SQL pour importer PR_Routier.geojson dans Postgres avec PostGIS
-- Table créée: pr_routier_geojson
-- À exécuter dans DBeaver ou pgAdmin 4
-- Base de données: meshtastic (ou terrain_db selon tes besoins)
-- IMPORTANT: La base de données doit avoir l'extension PostGIS activée
-- NOTE: Ce fichier contient 3580 features (Points de repère routiers)

-- 1. Activer l'extension PostGIS si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS pr_routier_geojson (
    id SERIAL PRIMARY KEY,
    gid INTEGER,
    pr VARCHAR(50),
    voie VARCHAR(255),
    cumul INTEGER,
    type_geometry VARCHAR(50),
    geom GEOMETRY(GEOMETRY, 4326),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer des index spatiaux pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pr_routier_geojson_geom ON pr_routier_geojson USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_pr_routier_geojson_properties ON pr_routier_geojson USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_pr_routier_geojson_voie ON pr_routier_geojson(voie);
CREATE INDEX IF NOT EXISTS idx_pr_routier_geojson_pr ON pr_routier_geojson(pr);

-- 4. Méthode recommandée pour les gros fichiers: Utiliser ogr2ogr via Docker
-- Commande à exécuter dans PowerShell (depuis C:\iot-terrain) :
-- docker exec -i postgis ogr2ogr -f "PostgreSQL" PG:"dbname=meshtastic user=admin password=admin host=localhost" /usr/share/nginx/html/geojson/PR_Routier.geojson -nln pr_routier_geojson -overwrite -lco GEOMETRY_NAME=geom

-- 5. Méthode alternative: Fonction pour importer depuis JSONB (pour les petits extraits)
CREATE OR REPLACE FUNCTION import_pr_routier_from_json(json_data JSONB)
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
        
        INSERT INTO pr_routier_geojson (
            gid, pr, voie, cumul, type_geometry, geom, properties
        ) VALUES (
            (props->>'gid')::INTEGER,
            props->>'pr',
            props->>'voie',
            (props->>'cumul')::INTEGER,
            geom_type,
            ST_SetSRID(ST_GeomFromGeoJSON(geom_json::TEXT), 4326),
            props
        );
        
        count_inserted := count_inserted + 1;
    END LOOP;
    
    RETURN count_inserted;
END;
$$ LANGUAGE plpgsql;

-- 6. Exemple d'insertion manuelle pour les premiers points (pour tester)
-- INSERT INTO pr_routier_geojson (gid, pr, voie, cumul, type_geometry, geom, properties) VALUES
-- (0, '0', 'D100-4', 47, 'Point', ST_SetSRID(ST_MakePoint(4.297347976498472, 45.525940870012093), 4326),
--  '{"gid": 0, "pr": "0", "voie": "D100-4", "cumul": 47}'::JSONB),
-- (1, '0', 'D93', 1, 'Point', ST_SetSRID(ST_MakePoint(3.808871610492808, 46.218684134856815), 4326),
--  '{"gid": 1, "pr": "0", "voie": "D93", "cumul": 1}'::JSONB);

-- 7. Vérifier que les données ont été insérées
SELECT COUNT(*) AS nombre_pr FROM pr_routier_geojson;
SELECT 
    id, 
    gid, 
    pr, 
    voie, 
    cumul,
    ST_AsText(geom) AS geom_text
FROM pr_routier_geojson 
ORDER BY voie, cumul
LIMIT 20;

-- 8. Exporter au format GeoJSON pour le rendu cartographique
-- SELECT json_build_object(
--     'type', 'FeatureCollection',
--     'name', 'PR_Routier',
--     'features', json_agg(
--         json_build_object(
--             'type', 'Feature',
--             'geometry', ST_AsGeoJSON(geom)::json,
--             'properties', json_build_object(
--                 'gid', gid,
--                 'pr', pr,
--                 'voie', voie,
--                 'cumul', cumul
--             )
--         )
--     )
-- ) AS geojson
-- FROM pr_routier_geojson
-- WHERE voie = 'D63';

