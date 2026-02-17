#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script Python pour importer automatiquement un fichier GeoJSON dans Postgres avec PostGIS
Usage: python import_geojson_auto.py <fichier.geojson> [nom_table]
"""

import json
import sys
import os
from datetime import datetime

def geojson_to_sql(geojson_file, table_name='sar_geojson'):
    """Convertit un fichier GeoJSON en script SQL pour PostGIS"""
    
    # Lire le fichier GeoJSON
    with open(geojson_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if data.get('type') != 'FeatureCollection':
        print(f"❌ Erreur: Le fichier doit être une FeatureCollection GeoJSON")
        return
    
    features = data.get('features', [])
    print(f"📄 Lecture de {len(features)} features depuis {geojson_file}")
    
    # Générer le script SQL
    sql_file = os.path.splitext(geojson_file)[0] + '_import.sql'
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(f"""-- Script SQL généré automatiquement depuis {os.path.basename(geojson_file)}
-- Table créée: {table_name}
-- À exécuter dans DBeaver ou pgAdmin 4
-- Base de données: meshtastic (ou terrain_db selon tes besoins)

-- 1. Activer l'extension PostGIS si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS {table_name} (
    id SERIAL PRIMARY KEY,
    type_geometry VARCHAR(50),
    geom GEOMETRY(GEOMETRY, 4326),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer des index spatiaux pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_{table_name}_geom ON {table_name} USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_{table_name}_properties ON {table_name} USING GIN (properties);

-- 4. Insérer les données depuis le GeoJSON
""")
        
        for feature in features:
            geom = feature.get('geometry', {})
            props = feature.get('properties', {})
            geom_type = geom.get('type')
            coordinates = geom.get('coordinates')
            
            if not geom_type or not coordinates:
                continue
            
            # Convertir la géométrie en format PostGIS
            if geom_type == 'Point':
                lon, lat = coordinates
                geom_sql = f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)"
            elif geom_type == 'LineString':
                points = ', '.join([f"ST_MakePoint({coord[0]}, {coord[1]})" for coord in coordinates])
                geom_sql = f"ST_SetSRID(ST_MakeLine(ARRAY[{points}]), 4326)"
            elif geom_type == 'Polygon':
                # Pour Polygon, on prend le premier ring
                ring = coordinates[0]
                points = ', '.join([f"ST_MakePoint({coord[0]}, {coord[1]})" for coord in ring])
                geom_sql = f"ST_SetSRID(ST_MakePolygon(ST_MakeLine(ARRAY[{points}])), 4326)"
            else:
                # Pour les autres types, utiliser ST_GeomFromGeoJSON
                geom_json = json.dumps(geom).replace("'", "''")
                geom_sql = f"ST_SetSRID(ST_GeomFromGeoJSON('{geom_json}'), 4326)"
            
            # Convertir les propriétés en JSONB
            props_json = json.dumps(props, ensure_ascii=False).replace("'", "''")
            
            f.write(f"""INSERT INTO {table_name} (type_geometry, geom, properties)
VALUES ('{geom_type}', {geom_sql}, '{props_json}'::JSONB);

""")
        
        f.write(f"""
-- 5. Vérifier que les données ont été insérées
SELECT COUNT(*) AS nombre_features FROM {table_name};
SELECT 
    id, 
    type_geometry, 
    properties->>'type' AS type_feature,
    properties->>'activation' AS activation,
    properties->>'equipe' AS equipe,
    ST_AsText(geom) AS geom_text
FROM {table_name} 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Exporter toutes les features au format GeoJSON pour le rendu cartographique
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
-- FROM {table_name};
""")
    
    print(f"✅ Script SQL généré: {sql_file}")
    print(f"📊 {len(features)} features à importer")
    return sql_file

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python import_geojson_auto.py <fichier.geojson> [nom_table]")
        sys.exit(1)
    
    geojson_file = sys.argv[1]
    table_name = sys.argv[2] if len(sys.argv) > 2 else 'sar_geojson'
    
    if not os.path.exists(geojson_file):
        print(f"❌ Erreur: Le fichier {geojson_file} n'existe pas")
        sys.exit(1)
    
    geojson_to_sql(geojson_file, table_name)

