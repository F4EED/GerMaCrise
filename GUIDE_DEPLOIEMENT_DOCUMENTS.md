# Guide de Déploiement - Module de Gestion de Documents

## Prérequis

- Docker et Docker Compose installés
- PostgreSQL avec extensions `pg_trgm` et `unaccent`
- (Optionnel) MinIO pour stockage S3-compatible

## Installation

### 1. Migration de la base de données

```bash
# Appliquer la migration SQL
docker-compose exec db psql -U maincourante -d main_courante -f /migrations/create_documents_tables.sql

# Ou depuis l'extérieur
psql -h localhost -U maincourante -d main_courante -f backend/migrations/create_documents_tables.sql
```

### 2. Configuration

#### Variables d'environnement

Créer un fichier `.env` ou modifier `docker-compose.yml`:

```env
# Stockage
STORAGE_TYPE=filesystem  # ou 's3' ou 'minio'
STORAGE_PATH=/app/storage/documents

# Pour S3/MinIO
S3_ENDPOINT_URL=http://minio:9000
S3_BUCKET=documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_REGION=us-east-1
```

### 3. Démarrage

#### Avec stockage filesystem (par défaut)

```bash
docker-compose -f docker-compose.yml -f docker-compose.documents.yml up -d
```

#### Avec MinIO (S3-compatible)

```bash
docker-compose -f docker-compose.yml -f docker-compose.documents.yml --profile s3 up -d
```

### 4. Vérification

```bash
# Vérifier que les services sont démarrés
docker-compose ps

# Vérifier les logs
docker-compose logs backend

# Tester l'API
curl http://localhost:8000/api/documents/
```

## Déploiement Multi-Architecture

### Construction des images

```bash
# Linux/Mac
./scripts/build-multiarch.sh

# Windows
.\scripts\build-multiarch.ps1
```

### Test local

```bash
docker buildx build --platform linux/amd64 --load -t maincourante/backend:latest ./backend
```

## Kubernetes

### Préparation des manifestes

Les manifestes Kubernetes sont dans `k8s/documents/` (à créer selon vos besoins).

### Déploiement

```bash
kubectl apply -f k8s/documents/configmap.yaml
kubectl apply -f k8s/documents/secrets.yaml
kubectl apply -f k8s/documents/deployment.yaml
kubectl apply -f k8s/documents/service.yaml
```

### Configuration

- **ConfigMap**: Variables d'environnement
- **Secrets**: Credentials S3/MinIO
- **PersistentVolume**: Stockage filesystem (si utilisé)
- **Resource limits**: CPU 2, RAM 2Gi

## Maintenance

### Backup

#### Filesystem

```bash
docker-compose exec backend tar -czf /backup/documents-$(date +%Y%m%d).tar.gz /app/storage/documents
```

#### S3/MinIO

```bash
# Avec aws-cli
aws s3 sync s3://documents s3://backup-bucket/documents/ --endpoint-url http://localhost:9000
```

### Monitoring

- Logs: `docker-compose logs -f backend`
- Santé: `curl http://localhost:8000/health`
- Métriques: Intégrer Prometheus/Grafana si nécessaire

## Dépannage

### Problèmes courants

1. **Erreur de migration**: Vérifier que les extensions PostgreSQL sont installées
2. **Erreur de stockage**: Vérifier les permissions sur `/app/storage/documents`
3. **Erreur S3**: Vérifier les credentials et l'endpoint URL

### Logs

```bash
# Backend
docker-compose logs backend

# Base de données
docker-compose logs db

# MinIO (si utilisé)
docker-compose logs minio
```

## Mise à jour

1. Arrêter les services
2. Backup des données
3. Mettre à jour le code
4. Reconstruire les images
5. Redémarrer les services

```bash
docker-compose down
# Backup...
docker-compose build
docker-compose up -d
```

