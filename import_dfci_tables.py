#!/usr/bin/env python3
"""
Script pour importer les fichiers GeoJSON DFCI dans la base de données PostgreSQL/PostGIS
À exécuter depuis l'hôte (pas dans le conteneur)
"""

import json
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text

# Configuration de la base de données (depuis l'hôte, utiliser localhost:5433)
DATABASE_URL = "postgresql://maincourante:maincourante_pass@localhost:5433/main_courante"

def create_table(engine, table_name, description):
    """Crée une table pour stocker les données DFCI"""
    with engine.connect() as conn:
        # Créer la table si elle n'existe pas
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            code_dfci VARCHAR(50) NOT NULL UNIQUE,
            geom Geometry(MultiPolygon, 4326) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_{table_name}_code_dfci ON {table_name}(code_dfci);
        CREATE INDEX IF NOT EXISTS idx_{table_name}_geom ON {table_name} USING GIST(geom);
        
        COMMENT ON TABLE {table_name} IS '{description}';
        """
        conn.execute(text(create_sql))
        conn.commit()
        print(f"✓ Table {table_name} créée")

def import_geojson(engine, geojson_path, table_name):
    """Importe un fichier GeoJSON dans la table"""
    print(f"\n📂 Import de {geojson_path.name} dans {table_name}...")
    
    # Lire le fichier GeoJSON
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    features = geojson_data.get('features', [])
    print(f"   {len(features)} features trouvées")
    
    # Préparer les données pour l'insertion
    with engine.connect() as conn:
        inserted = 0
        errors = 0
        
        for i, feature in enumerate(features):
            try:
                code_dfci = feature['properties'].get('name', '')
                geometry = json.dumps(feature['geometry'])
                
                # Insérer dans la table
                insert_sql = text(f"""
                    INSERT INTO {table_name} (code_dfci, geom)
                    VALUES (:code_dfci, ST_GeomFromGeoJSON(:geometry))
                    ON CONFLICT (code_dfci) DO NOTHING
                """)
                
                conn.execute(insert_sql, {
                    'code_dfci': code_dfci,
                    'geometry': geometry
                })
                inserted += 1
                
                if (i + 1) % 1000 == 0:
                    print(f"   {i + 1}/{len(features)} features traitées...")
                    conn.commit()
                    
            except Exception as e:
                errors += 1
                if errors <= 10:  # Afficher seulement les 10 premières erreurs
                    print(f"   ⚠ Erreur pour feature {i}: {e}")
        
        conn.commit()
        print(f"✓ {inserted} features importées, {errors} erreurs")

def get_table_structure(engine, table_name):
    """Récupère la structure d'une table"""
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position
        """))
        
        columns = []
        for row in result:
            col_type = row[1]
            if row[2]:  # Si character_maximum_length existe
                col_type += f"({row[2]})"
            columns.append({
                'name': row[0],
                'type': col_type,
                'nullable': row[3] == 'YES'
            })
        
        return columns

def main():
    # Chemin vers les fichiers GeoJSON (depuis l'hôte Windows)
    base_path = Path(__file__).parent
    geojson_dir = base_path / "cartographie" / "geojson"
    
    if not geojson_dir.exists():
        print(f"⚠ Répertoire non trouvé: {geojson_dir}")
        return
    
    # Mapping des fichiers aux tables
    files_to_tables = {
        "DFCI_1KM.geojson": {
            "table": "dfci_1km",
            "description": "Grille DFCI 1km x 1km"
        },
        "DFCI_2X2.geojson": {
            "table": "dfci_2x2",
            "description": "Grille DFCI 2km x 2km"
        },
        "DFCI_20X20.geojson": {
            "table": "dfci_20x20",
            "description": "Grille DFCI 20km x 20km"
        },
        "DFCI_100X100.geojson": {
            "table": "dfci_100x100",
            "description": "Grille DFCI 100km x 100km"
        }
    }
    
    # Créer l'engine SQLAlchemy
    engine = create_engine(DATABASE_URL)
    
    print("=" * 60)
    print("IMPORT DES FICHIERS GEOJSON DFCI DANS LA BASE DE DONNÉES")
    print("=" * 60)
    
    # Créer les tables et importer les données
    tables_created = {}
    
    for filename, config in files_to_tables.items():
        geojson_path = geojson_dir / filename
        
        if not geojson_path.exists():
            print(f"\n⚠ Fichier non trouvé: {geojson_path}")
            continue
        
        table_name = config["table"]
        description = config["description"]
        
        # Créer la table
        create_table(engine, table_name, description)
        
        # Importer les données
        import_geojson(engine, geojson_path, table_name)
        
        # Récupérer la structure de la table
        structure = get_table_structure(engine, table_name)
        tables_created[table_name] = {
            'description': description,
            'structure': structure
        }
    
    # Afficher le résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ DES TABLES CRÉÉES")
    print("=" * 60)
    
    for table_name, info in tables_created.items():
        print(f"\n📊 Table: {table_name}")
        print(f"   Description: {info['description']}")
        print(f"   Structure:")
        for col in info['structure']:
            nullable = "NULL" if col['nullable'] else "NOT NULL"
            print(f"     - {col['name']}: {col['type']} {nullable}")
        
        # Compter les enregistrements
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar()
            print(f"   Nombre d'enregistrements: {count}")

if __name__ == "__main__":
    main()

