# Optimisation du Chargement de la Cartographie

## Problème identifié

Le fichier PMTiles (`mymap.pmtiles`) fait **~9.6 GB**, ce qui cause un chargement très lent lorsque servi via le serveur de développement React (`npm start`).

### Causes du ralentissement

1. **Serveur de développement React non optimisé** : `react-scripts start` n'est pas conçu pour servir de très gros fichiers
2. **Pas de support HTTP Range Requests optimal** : PMTiles nécessite des requêtes HTTP Range pour charger uniquement les parties nécessaires du fichier
3. **Pas de compression/cache optimisé** : Le serveur dev React ne gère pas efficacement le cache pour les gros fichiers
4. **Pas de sendfile/optimisations serveur** : Les optimisations serveur (sendfile, tcp_nopush) ne sont pas activées

## Solution : Serveur Nginx dédié

Un service nginx dédié a été créé pour servir la cartographie de manière optimale.

### Configuration

1. **Service nginx** : `cartographie` dans `docker-compose.yml`
   - Port : `3081`
   - Montage : `./frontend/public/cartographie` → `/usr/share/nginx/html`
   - Configuration : `nginx-cartographie.conf`

2. **Optimisations activées** :
   - ✅ Support HTTP Range Requests (essentiel pour PMTiles)
   - ✅ Compression gzip pour les fichiers texte (GeoJSON, CSS, JS)
   - ✅ Cache optimisé (30 jours pour PMTiles, 1 an pour les autres)
   - ✅ Headers CORS corrects
   - ✅ sendfile et optimisations TCP
   - ✅ Timeouts augmentés pour les gros fichiers

### Utilisation

#### Option 1 : Utiliser le serveur nginx dédié (recommandé)

1. Démarrer le service :
   ```bash
   docker-compose up -d cartographie
   ```

2. Modifier l'URL dans `cartoff3.html` ou utiliser directement :
   ```
   http://localhost:3081/cartoff3.html
   ```

#### Option 2 : Modifier les chemins dans cartoff.js

Si vous voulez que la cartographie s'ouvre depuis l'application React mais utilise nginx :

1. Démarrer le service cartographie
2. Modifier le lien dans `Layout.tsx` pour pointer vers `http://localhost:3081/cartoff3.html`

#### Option 3 : Servir via le même nginx que l'application React (production)

En production avec `Dockerfile.multiarch`, nginx sert déjà les fichiers statiques. La configuration nginx incluse dans le Dockerfile multiarch devrait déjà gérer correctement les PMTiles.

### Vérification

Pour vérifier que nginx fonctionne correctement :

```bash
# Vérifier que le service est démarré
docker-compose ps cartographie

# Tester une requête Range Request (essentiel pour PMTiles)
curl -I -H "Range: bytes=0-1023" http://localhost:3081/pmtiles/mymap.pmtiles

# Devrait retourner : HTTP/1.1 206 Partial Content
```

### Performances attendues

Avec nginx :
- ✅ Chargement progressif des tuiles (PMTiles charge uniquement ce qui est visible)
- ✅ Cache navigateur efficace (30 jours pour PMTiles)
- ✅ Compression pour les fichiers texte
- ✅ Support optimal des Range Requests

**Note** : Le premier chargement peut toujours être un peu long car PMTiles doit lire l'index du fichier, mais ensuite le chargement est progressif et optimisé.

## Recherche géographique

### Fonctionnalités

La cartographie (`cartoff3.html`) propose un menu de recherche géographique dans la sidebar :

#### Recherche par département

- Liste déroulante de tous les départements français (chargée depuis l'API `/api/geographie/departements`)
- Zoom automatique sur le département sélectionné
- Affichage temporaire du contour du département (calque bleu, 8 secondes)
- Transformation automatique des coordonnées Lambert 93 → WGS84

#### Recherche par commune

- Liste déroulante des communes du département sélectionné (chargée depuis `/api/geographie/communes/departement/{code}`)
- Zoom automatique sur la commune sélectionnée
- Affichage temporaire du contour de la commune (calque bleu, 8 secondes)
- Transformation automatique des coordonnées Lambert 93 → WGS84

#### Recherche par adresse

- Champ de recherche d'adresse (actuellement désactivé, à venir)
- Géocodage d'adresses pour localisation

### API géographique

Les endpoints suivants sont disponibles :

- `GET /api/geographie/departements` : Liste de tous les départements
- `GET /api/geographie/departements/{code_insee}` : Département avec géométrie GeoJSON
- `GET /api/geographie/communes` : Liste de toutes les communes
- `GET /api/geographie/communes/{code_insee}` : Commune avec géométrie GeoJSON
- `GET /api/geographie/communes/departement/{code_departement}` : Communes d'un département

### Transformation des coordonnées

**Problème résolu** : Les données géographiques sont stockées en Lambert 93 (SRID 2154) dans la base, mais doivent être transformées en WGS84 (SRID 4326) pour Leaflet.

**Solution implémentée** :
- Détection automatique du SRID réel dans la base
- Transformation explicite depuis Lambert 93 (2154) vers WGS84 (4326) via requête SQL directe
- Validation des coordonnées transformées (vérification que les valeurs sont en degrés, pas en mètres)
- Logs de débogage pour diagnostiquer les problèmes de transformation

**Code backend** (`backend/app/routers/geographie.py`) :
```python
# Transformation explicite Lambert 93 → WGS84
sql_query = text("""
    SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 2154), 4326)) as geom_json
    FROM communes
    WHERE code_insee = :code_insee
""")
```

### Validation frontend

Le script `recherche-geographique.js` valide les coordonnées avant le zoom :

- Vérification que les coordonnées sont en degrés (entre -180 et 180 pour la longitude, -90 et 90 pour la latitude)
- Détection des coordonnées inversées (lat/lon au lieu de lon/lat)
- Vérification que les bounds sont dans la France métropolitaine
- Limite de zoom maximum (18) pour éviter la disparition du fond de carte
- Validation de la taille des bounds (éviter les zooms trop extrêmes)

### Intégration avec les activations

Lors de la création ou modification d'une activation dans l'application React :

1. Sélection d'un département et d'une commune
2. Ouverture automatique de la cartographie dans un nouvel onglet
3. Passage du `code_commune` en paramètre URL (`?code_commune=XXXXX`)
4. Zoom automatique sur la commune sélectionnée

**Code frontend** (`frontend/src/components/ActivationModal.tsx`) :
```typescript
const cartoUrl = `http://localhost:3081/cartoff3.html?code_commune=${formData.code_commune}`;
window.open(cartoUrl, '_blank');
```

## Alternatives (si le problème persiste)

1. **Réduire la taille du PMTiles** : Utiliser un PMTiles avec une couverture géographique plus restreinte
2. **Utiliser plusieurs fichiers PMTiles** : Découper en plusieurs fichiers par région
3. **Préchargement** : Précharger les tuiles les plus utilisées
4. **Service Worker** : Implémenter un cache côté client



