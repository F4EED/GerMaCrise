## Accès et identifiants – GerMaCrise

Ce document récapitule les accès aux principaux services utilisés par GerMaCrise (environnement de développement/POC par défaut).

> **Attention** : n’utilisez pas ces valeurs telles quelles en production, remplacez systématiquement les mots de passe et la `SECRET_KEY`.

> **Compatibilité** : GerMaCrise est prévu pour **ARM et Intel**, **Linux et Windows**. Voir `COMPATIBILITE_MULTI_ARCH_OFFLINE.md`. Le stack complet utilise `docker-compose.poc.yml` avec les Dockerfiles multi-arch (`Dockerfile.multiarch`).

---

### 1. Base de données PostgreSQL / PostGIS

- **Service Docker** : `db`
- **Image** : `postgis/postgis:16-3.4`
- **Base par défaut** : `main_courante`
- **Utilisateur** : `maincourante`
- **Mot de passe** : `maincourante_pass`
- **Port dans le conteneur** : `5432`
- **Port sur la machine hôte** :
  - POC / défaut : `${DB_PORT:-5433}` → généralement `5433`

**Depuis un autre service Docker** (backend, seed, scripts) :

- **Host** : `db`
- **Port** : `5432`
- **URL de connexion** :
  - `postgresql://maincourante:maincourante_pass@db:5432/main_courante`

**Depuis la machine hôte** (ex. `psql`, PgAdmin, QGIS, autre client PostGIS) :

- **Host** : `localhost`
- **Port** : `5433` (par défaut, ou valeur de `DB_PORT` dans `.env`)
- **Base** : `main_courante`
- **Utilisateur** : `maincourante`
- **Mot de passe** : `maincourante_pass`
- **URL type** : `postgresql://maincourante:maincourante_pass@localhost:5433/main_courante`

---

### 2. Backend FastAPI (API principale)

- **Service Docker** : `backend`
- **Port dans le conteneur** : `8000`
- **Port sur la machine hôte** :
  - Mode standard : `8000`
  - POC : `${BACKEND_PORT:-8000}` → généralement `8000`
- **URL locale** : `http://localhost:8000`

**Variables importantes** :

- `DATABASE_URL` :
  - `postgresql://maincourante:maincourante_pass@db:5432/main_courante`
- `SECRET_KEY` :
  - Défaut : `change-me-in-production`
- `ALGORITHM` :
  - `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` :
  - `1440` (24 h)

---

### 3. Frontend (interface web GerMaCrise)

- **Service Docker** : `frontend`
- **Port dans le conteneur** : `3000`
- **Port sur la machine hôte** :
  - Défaut : `${FRONTEND_PORT:-3000}` → généralement `3000`
- **URL locale** : `http://localhost:3000`

**Variables côté navigateur** (dans `env.example` ou `frontend/.env`) :

- `REACT_APP_API_URL` :
  - Défaut : `http://localhost:8000`
- `REACT_APP_API_URL_EXTERNAL` :
  - Défaut : `http://localhost:8000`
- `FAST_REFRESH` :
  - `false`

---

### 4. Interface visualisation (visu)

- **Service Docker** : `visu`
- **Image** : `nginx:alpine`
- **Port dans le conteneur** : `80`
- **Port sur la machine hôte** :
  - Défaut : `${VISU_PORT:-3080}` → généralement `3080`
- **URL locale** : `http://localhost:3080`
- **Authentification** : aucune (simple proxy / page statique)

---

### 5. Interface cartographie (cartographie)

- **Service Docker** : `cartographie`
- **Image** : `nginx:alpine`
- **Port dans le conteneur** : `80`
- **Port sur la machine hôte** :
  - Défaut : `${CARTO_PORT:-3081}` → généralement `3081`
- **URL locale** : `http://localhost:3081`
- **Authentification** : aucune (serveur de tuiles / fichiers statiques)

---

### 6. Stockage de documents (MinIO / S3 optionnel)

Activé via `docker-compose.documents.yml` (profil `s3`).

#### 6.1 Service MinIO

- **Service Docker** : `minio`
- **Image** : `minio/minio:latest`
- **Port dans le conteneur** :
  - API : `9000`
  - Console : `9001`
- **Ports sur la machine hôte** :
  - API : `9000`
  - Console : `9001`

**Identifiants par défaut** :

- `MINIO_ROOT_USER` :
  - Défaut : `${MINIO_ROOT_USER:-minioadmin}` → généralement `minioadmin`
- `MINIO_ROOT_PASSWORD` :
  - Défaut : `${MINIO_ROOT_PASSWORD:-minioadmin123}` → généralement `minioadmin123`

**URLs typiques** :

- **Console d’admin** : `http://localhost:9001`
- **Endpoint S3** : `http://minio:9000` (depuis les conteneurs Docker)  
  ou `http://localhost:9000` (depuis la machine hôte)

#### 6.2 Paramètres côté backend pour les documents

- `STORAGE_TYPE` :
  - Défaut : `${STORAGE_TYPE:-filesystem}` (`filesystem`, `s3`, `minio`)
- `STORAGE_PATH` :
  - `/app/storage/documents`
- `S3_ENDPOINT_URL` :
  - Défaut : `${S3_ENDPOINT_URL:-http://minio:9000}`
- `S3_BUCKET` :
  - Défaut : `${S3_BUCKET:-documents}`
- `S3_ACCESS_KEY` :
  - Défaut : `${S3_ACCESS_KEY:-minioadmin}`
- `S3_SECRET_KEY` :
  - Défaut : `${S3_SECRET_KEY:-minioadmin123}`
- `S3_REGION` :
  - Défaut : `${S3_REGION:-us-east-1}`

---

### 7. Récapitulatif rapide par service

| Service            | Type           | Host / URL                    | Port      | Identifiant / clé                 | Mot de passe / secret          |
|--------------------|----------------|-------------------------------|-----------|-----------------------------------|--------------------------------|
| PostgreSQL/PostGIS | Base de données| `localhost` / `db`           | `5433` / `5432` | `maincourante`                  | `maincourante_pass`            |
| Backend API        | HTTP API       | `http://localhost:8000`      | `8000`    | `SECRET_KEY`                      | `change-me-in-production`      |
| Frontend           | Web            | `http://localhost:3000`      | `3000`    | `REACT_APP_API_URL`              | *(sans mot de passe)*          |
| Visu               | Web statique   | `http://localhost:3080`      | `3080`    | *(aucun)*                         | *(aucun)*                      |
| Cartographie       | Web statique   | `http://localhost:3081`      | `3081`    | *(aucun)*                         | *(aucun)*                      |
| MinIO              | S3 / console   | `http://localhost:9000/9001` | `9000/9001` | `minioadmin` (root user)       | `minioadmin123`                |
| S3 (backend)       | Stockage docs  | `http://minio:9000`          | `9000`    | `S3_ACCESS_KEY` = `minioadmin`   | `S3_SECRET_KEY` = `minioadmin123` |

---

### 8. Remarques de sécurité

- **Production** :
  - Remplacer tous les mots de passe, `SECRET_KEY`, clés MinIO/S3 par des valeurs fortes et spécifiques à l’environnement.
  - Restreindre l’exposition des ports aux seules IP autorisées.
- **Postgis / SIG** :
  - Les accès QGIS / autres clients doivent idéalement utiliser un compte dédié en lecture / écriture limité aux schémas nécessaires.

