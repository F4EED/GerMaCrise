# Import des données géographiques (Communes et Départements)

Ce document explique comment importer les données géographiques depuis les fichiers GeoJSON vers la base de données PostgreSQL avec PostGIS.

## Prérequis

1. **PostgreSQL avec PostGIS** : La base de données doit avoir l'extension PostGIS activée
2. **Python dépendances** : Installer les dépendances Python nécessaires
3. **Fichiers GeoJSON** : Les fichiers doivent être présents dans `json/svg/`

## Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

La dépendance `shapely` est nécessaire pour le traitement des géométries.

## Création des tables

Avant d'importer les données, vous devez créer les tables dans la base de données :

```bash
# Se connecter à PostgreSQL
psql -U maincourante -d main_courante

# Exécuter la migration
\i backend/migrations/create_communes_departements.sql
```

Ou via Docker :

```bash
docker exec -i main_courante_db psql -U maincourante -d main_courante < backend/migrations/create_communes_departements.sql
```

## Vérification de PostGIS

Assurez-vous que PostGIS est activé :

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Import des données

### Méthode 1 : Via Python (recommandé)

```bash
cd backend
python -m scripts.import_geojson
```

Le script va :
1. Charger les fichiers GeoJSON (`Departements_France.geojson` et `Communes_France.geojson`)
2. Importer d'abord les départements
3. Puis importer les communes avec leurs relations vers les départements
4. Convertir les géométries GeoJSON en format PostGIS (SRID 4326)

### Méthode 2 : Via Docker

Si vous utilisez Docker, vous pouvez exécuter le script depuis le conteneur :

```bash
docker exec -it main_courante_backend python -m scripts.import_geojson
```

## Structure des tables

### Table `departements`

- `id` : Identifiant unique
- `code_insee` : Code INSEE du département (ex: "01", "2A", "2B", "75")
- `nom` : Nom du département
- `nom_majuscules` : Nom en majuscules
- `code_region` : Code INSEE de la région
- `geom` : Géométrie MultiPolygon (PostGIS, SRID 4326)
- `created_at` / `updated_at` : Timestamps

### Table `communes`

- `id` : Identifiant unique
- `code_insee` : Code INSEE de la commune (ex: "01001")
- `nom` : Nom de la commune
- `nom_majuscules` : Nom en majuscules
- `statut` : Statut de la commune (ex: "Commune simple")
- `code_arrondissement` : Code arrondissement
- `code_departement` : Code département (clé étrangère)
- `code_region` : Code région
- `siren_epci` : Code SIREN de l'EPCI
- `geom` : Géométrie MultiPolygon (PostGIS, SRID 4326)
- `created_at` / `updated_at` : Timestamps

## API REST

Une fois les données importées, vous pouvez accéder aux communes et départements via l'API REST :

### Endpoints disponibles

- `GET /api/geographie/departements` : Liste des départements
- `GET /api/geographie/departements/{code_insee}` : Détails d'un département
- `GET /api/geographie/communes` : Liste des communes
- `GET /api/geographie/communes/{code_insee}` : Détails d'une commune
- `GET /api/geographie/communes/departement/{code_departement}` : Communes d'un département
- `GET /api/geographie/communes/recherche?q={terme}` : Recherche de communes

### Exemples

```bash
# Liste des départements
curl http://localhost:8000/api/geographie/departements

# Recherche de communes
curl "http://localhost:8000/api/geographie/communes/recherche?q=Paris"

# Communes d'un département
curl http://localhost:8000/api/geographie/communes/departement/75
```

## Utilisation des géométries PostGIS

Les géométries sont stockées en format PostGIS (SRID 4326 - WGS84). Vous pouvez utiliser les fonctions PostGIS pour :

- Calculer des distances
- Vérifier si un point est dans une commune/département
- Calculer des intersections
- Créer des cartes

### Exemple SQL

```sql
-- Trouver la commune contenant un point
SELECT nom, code_insee 
FROM communes 
WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326));

-- Calculer la distance entre deux communes
SELECT 
    c1.nom as commune1,
    c2.nom as commune2,
    ST_Distance(c1.geom, c2.geom) as distance_metres
FROM communes c1, communes c2
WHERE c1.code_insee = '75056' AND c2.code_insee = '13055';
```

## Notes importantes

- Les fichiers GeoJSON sont volumineux (plusieurs centaines de MB)
- L'import peut prendre plusieurs minutes selon la taille des fichiers
- Les géométries sont stockées en format binaire PostGIS pour optimiser les performances
- Les index GIST sont créés automatiquement sur les colonnes géométriques

## Dépannage

### Erreur : "Extension PostGIS non trouvée"

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Erreur : "Module shapely non trouvé"

```bash
pip install shapely==2.0.2
```

### Erreur : "Fichier GeoJSON introuvable"

Vérifiez que les fichiers sont bien présents dans `json/svg/` :
- `Departements_France.geojson`
- `Communes_France.geojson`

