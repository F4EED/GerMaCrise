# Documentation - Module de Gestion de Documents

## Table des matières

1. [Architecture](#architecture)
2. [Modèle de données](#modèle-de-données)
3. [API](#api)
4. [Flux de travail](#flux-de-travail)
5. [Sécurité](#sécurité)
6. [Déploiement](#déploiement)
7. [Tests](#tests)
8. [Guide d'utilisation](#guide-dutilisation)

---

## Architecture

### Vue d'ensemble

Le module de gestion de documents est conçu pour être:

- **Agnostique** sur la stack de stockage (filesystem, S3, MinIO)
- **Multi-architecture** (amd64/arm64)
- **Conteneurisé** avec Docker
- **Déployable** via docker-compose (POC) et Kubernetes (production)

### Composants

```text
┌─────────────────┐
│   Frontend      │  React/TypeScript
│   (Upload UI)   │
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│   Backend API   │  FastAPI/Python
│   (FastAPI)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  DB   │ │Storage│
│Postgres│ │FS/S3 │
└───────┘ └───────┘
```

### Services

1. **Backend API** (`backend/app/routers/documents.py`)
   - Gestion des uploads (local et URL)
   - Recherche multicritères
   - Versioning
   - Gestion des tags et taxonomie

2. **Service de stockage** (`backend/app/services/storage.py`)
   - Interface abstraite `StorageBackend`
   - Implémentations: `FilesystemStorage`, `S3Storage`
   - Factory pattern pour sélection automatique

3. **Service d'indexation** (`backend/app/services/indexation.py`)
   - Extraction de texte (PDF, Word, Excel)
   - Indexation PostgreSQL FTS
   - Recherche plein texte avec `pg_trgm` et `unaccent`

---

## Modèle de données

### Tables principales

#### `documents`

Table principale contenant les métadonnées des documents.

**Champs clés:**

- `titre`, `auteur` (obligatoires)
- `isbn`, `description`, `date_publication`
- `type_document` (PDF, Word, Excel, Image, Texte, Autre)
- `statut` (Brouillon, Valide, Archive, Supprimé)
- `chemin_stockage`, `checksum_sha256` (intégrité)
- `contenu_texte` (pour recherche plein texte)

#### `versions_documents`

Versioning immuable des documents.

#### `tags_documents`

Tags libres et contrôlés.

#### `taxonomie_documents`

Taxonomie contrôlée (catégories structurées).

#### `activites_documents`

Journalisation complète (audit).

### Index

- **Recherche plein texte**: Index GIN sur `contenu_texte`
- **Recherche partielle**: Index trigram (`pg_trgm`) sur `titre` et `auteur`
- **Performance**: Index sur `checksum_sha256`, `createur_id`, `structure_id`

---

## API

### Endpoints principaux

#### `POST /api/documents/upload`

Upload un document depuis le système local (drag & drop).

**Paramètres:**

- `file`: Fichier (multipart/form-data)
- `titre`: String (obligatoire)
- `auteur`: String (obligatoire)
- `description`: String (optionnel)
- `isbn`: String (optionnel)
- `tags`: JSON array (optionnel)

**Validation:**

- MIME type autorisé
- Taille max: 100MB
- Calcul checksum SHA256

#### `POST /api/documents/upload-from-url`

Télécharge et upload un document depuis une URL.

**Body:**

```json
{
  "url": "https://example.com/document.pdf",
  "titre": "Document",
  "auteur": "Auteur",
  "description": "Description",
  "tags": ["tag1", "tag2"]
}
```

#### `GET /api/documents/`

Liste les documents avec pagination.

**Query params:**

- `skip`: int (défaut: 0)
- `limit`: int (défaut: 50)
- `structure_id`: int (optionnel)
- `statut`: enum (optionnel)

#### `POST /api/documents/search`

Recherche multicritères.

**Body:**

```json
{
  "q": "recherche plein texte",
  "auteur": "Nom Auteur",
  "titre": "Titre",
  "isbn": "978-...",
  "date_publication_debut": "2024-01-01",
  "date_publication_fin": "2024-12-31",
  "type_document": "pdf",
  "tags": ["tag1", "tag2"],
  "skip": 0,
  "limit": 50
}
```

#### `GET /api/documents/{document_id}`

Récupère un document par son ID.

#### `GET /api/documents/{document_id}/download`

Télécharge un document (ou une version spécifique).

**Query params:**

- `version`: int (optionnel, version à télécharger)

#### `PUT /api/documents/{document_id}`

Met à jour les métadonnées d'un document.

#### `DELETE /api/documents/{document_id}`

Supprime un document (soft delete).

#### `POST /api/documents/{document_id}/tags`

Ajoute un tag à un document.

#### `DELETE /api/documents/{document_id}/tags/{tag_id}`

Supprime un tag d'un document.

---

## Flux de travail

### Upload local

```text
1. Validation MIME type et taille
   ↓
2. Calcul checksum SHA256
   ↓
3. Vérification doublon (même checksum)
   ↓
4. Extraction métadonnées (texte pour indexation)
   ↓
5. Stockage fichier (filesystem/S3)
   ↓
6. Enregistrement métadonnées en DB
   ↓
7. Création version initiale
   ↓
8. Indexation pour recherche
   ↓
9. Journalisation activité
```

### Upload depuis URL

```text
1. Téléchargement HTTP (timeout 30s)
   ↓
2. Validation MIME type et taille
   ↓
3. Calcul checksum
   ↓
4. (même flux que upload local)
```

### Recherche

```text
1. Recherche plein texte (PostgreSQL FTS)
   ↓
2. Filtres par critères (auteur, titre, etc.)
   ↓
3. Filtres par tags
   ↓
4. Tri par pertinence (ts_rank)
   ↓
5. Pagination
```

---

## Sécurité

### Authentification et autorisation

- **JWT** pour l'authentification
- **Rôles**:
  - `super_admin`, `admin`: Accès complet
  - `operateur`: Upload, modification, tags
  - `utilisateur`: Lecture seule

### Contrôles d'accès

- Les utilisateurs ne voient que leurs documents ou ceux de leur structure
- Vérification des permissions sur chaque opération
- Journalisation de toutes les activités (audit)

### Validation

- **MIME types** autorisés uniquement
- **Taille max**: 100MB
- **Checksum** pour détecter les doublons et garantir l'intégrité
- **Timeout** pour les téléchargements URL (30s)

### Stockage

- **Utilisateur non-root** dans les conteneurs
- **ReadOnlyRootFilesystem** (Kubernetes)
- **Secrets** pour les credentials S3/MinIO

---

## Déploiement

### Docker Compose (POC)

#### Configuration de base (filesystem)

```bash
docker-compose -f docker-compose.yml -f docker-compose.documents.yml up -d
```

#### Avec MinIO (S3-compatible)

```bash
docker-compose -f docker-compose.yml -f docker-compose.documents.yml --profile s3 up -d
```

**Variables d'environnement:**

```env
STORAGE_TYPE=minio
S3_ENDPOINT_URL=http://minio:9000
S3_BUCKET=documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
```

### Kubernetes

#### Manifestes

Voir `k8s/documents/` pour les manifestes complets.

**Déploiement:**

```bash
kubectl apply -f k8s/documents/
```

#### Configuration Kubernetes

- **ConfigMap** pour la configuration
- **Secrets** pour les credentials
- **PersistentVolume** pour le stockage filesystem
- **Resource limits**: CPU 2, RAM 2Gi

### Multi-architecture

#### Construction des images

**Linux/Mac:**

```bash
./scripts/build-multiarch.sh
```

**Windows:**

```powershell
.\scripts\build-multiarch.ps1
```

**Manuel:**

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --file backend/Dockerfile.multiarch \
  --tag maincourante/backend:latest \
  --push \
  ./backend
```

---

## Tests

### Tests unitaires

```bash
cd backend
pytest tests/unit/test_documents.py -v
```

### Tests d'intégration

```bash
pytest tests/integration/test_documents_api.py -v
```

### Tests de stockage

```bash
pytest tests/integration/test_storage.py -v
```

---

## Guide d'utilisation

### Upload d'un document

#### Via l'interface web

1. Accéder à la page "Base Documentaire"
2. Cliquer sur "Upload"
3. Glisser-déposer le fichier ou sélectionner
4. Remplir les métadonnées (titre, auteur, etc.)
5. Ajouter des tags (optionnel)
6. Valider

#### Via l'API

```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "titre=Mon Document" \
  -F "auteur=John Doe" \
  -F "tags=[\"tag1\",\"tag2\"]"
```

### Recherche de documents

#### Interface web

1. Accéder à "Base Documentaire"
2. Utiliser la barre de recherche
3. Filtrer par critères (auteur, type, etc.)
4. Consulter les résultats

#### Via l'API (recherche)

```bash
curl -X POST "http://localhost:8000/api/documents/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "recherche",
    "auteur": "Doe",
    "type_document": "pdf"
  }'
```

### Téléchargement

```bash
curl -X GET "http://localhost:8000/api/documents/1/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o document.pdf
```

---

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
| --- | --- | --- |
| `STORAGE_TYPE` | Type de stockage (filesystem, s3, minio) | `filesystem` |
| `STORAGE_PATH` | Chemin de stockage (filesystem) | `/app/storage/documents` |
| `S3_ENDPOINT_URL` | URL endpoint S3/MinIO | - |
| `S3_BUCKET` | Nom du bucket S3 | `documents` |
| `S3_ACCESS_KEY` | Clé d'accès S3 | - |
| `S3_SECRET_KEY` | Clé secrète S3 | - |
| `S3_REGION` | Région S3 | `us-east-1` |

### Fichier de configuration

Les spécifications complètes sont dans `gestion_documents.json`.

---

## Maintenance

### Migration de la base de données

```bash
docker-compose exec db psql -U maincourante -d main_courante -f /migrations/create_documents_tables.sql
```

### Backup

Les documents sont stockés dans:

- **Filesystem**: `/app/storage/documents`
- **S3/MinIO**: Bucket configuré

**Backup filesystem:**

```bash
docker-compose exec backend tar -czf /backup/documents-$(date +%Y%m%d).tar.gz /app/storage/documents
```

**Backup S3:**

```bash
aws s3 sync s3://documents s3://backup-bucket/documents/
```

---

## Support

Pour toute question ou problème, consulter:

- `gestion_documents.json` pour les spécifications
- Les logs: `docker-compose logs backend`
- La documentation API: `http://localhost:8000/docs`

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2024
