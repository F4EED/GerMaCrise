# Guide de Compatibilité Multi-Architecture et Mode Offline

Ce document décrit comment GerMaCrise V3 est conçu pour fonctionner sur différentes architectures (Intel/AMD64 et ARM) et en mode 100% offline.

## Table des matières

1. [Compatibilité Multi-Architecture](#compatibilité-multi-architecture)
2. [Mode Offline](#mode-offline)
3. [Déploiement sur différentes plateformes](#déploiement-sur-différentes-plateformes)
4. [Construction des images multi-architecture](#construction-des-images-multi-architecture)

---

## Compatibilité Multi-Architecture

GerMaCrise V3 supporte nativement les architectures suivantes :
- **AMD64 (x86_64)** : Processeurs Intel et AMD 64 bits
- **ARM64 (aarch64)** : Processeurs ARM 64 bits (Raspberry Pi 4+, Apple Silicon M1/M2, etc.)

### Architecture supportée

- ✅ **Linux AMD64** : Serveurs x86_64, stations de travail
- ✅ **Linux ARM64** : Raspberry Pi 4+, serveurs ARM, NanoPi, etc.
- ✅ **Windows** : Via Docker Desktop (qui supporte les deux architectures)
- ✅ **macOS** : Intel et Apple Silicon (M1/M2/M3)

### Images Docker multi-architecture

Les images Docker sont construites avec Docker Buildx pour supporter les deux architectures simultanément :

- `backend/Dockerfile.multiarch` : Backend FastAPI (Python)
- `frontend/Dockerfile.multiarch` : Frontend React (Node.js + Nginx)

### Base de données

L'image PostgreSQL/PostGIS utilisée (`postgis/postgis:16-3.4`) supporte nativement les deux architectures.

---

## Mode Offline

GerMaCrise V3 est conçu pour fonctionner **100% en mode offline**, sans dépendance à des services externes.

### Aucune dépendance externe

✅ **Toutes les bibliothèques JavaScript sont locales** :
- Leaflet (cartographie)
- React et ses dépendances
- Toutes les bibliothèques sont incluses dans `node_modules` ou `public/`

✅ **Toutes les bibliothèques Python sont locales** :
- FastAPI et ses dépendances
- Toutes les bibliothèques sont installées dans les conteneurs Docker

✅ **Cartographie offline** :
- Fichier PMTiles local (`cartographie/pmtiles/mymap.pmtiles`)
- Toutes les bibliothèques de cartographie sont locales
- Aucune dépendance à des services de cartes en ligne (OpenStreetMap, Google Maps, etc.)

✅ **Base de données locale** :
- PostgreSQL/PostGIS fonctionne entièrement en local
- Aucune connexion à des services cloud

✅ **API interne uniquement** :
- Le frontend communique uniquement avec le backend local
- Aucun appel à des APIs externes (sauf si explicitement configuré)

### Vérification du mode offline

Pour vérifier qu'aucune dépendance externe n'est utilisée :

1. **Frontend** : Tous les scripts et styles sont dans `frontend/public/` ou `frontend/src/`
2. **Cartographie** : Tous les fichiers sont dans `frontend/public/cartographie/`
3. **Backend** : Toutes les dépendances sont dans `requirements.txt` et installées localement
4. **Base de données** : PostgreSQL fonctionne en local dans Docker

---

## Déploiement sur différentes plateformes

### Linux (AMD64)

```bash
# Installation standard
docker-compose up -d

# Les images seront automatiquement téléchargées pour amd64
```

### Linux (ARM64 - Raspberry Pi, etc.)

```bash
# Installation standard
docker-compose up -d

# Docker sélectionnera automatiquement les images arm64
```

### Windows

**Prérequis** : Docker Desktop pour Windows

```powershell
# Installation standard
docker-compose up -d

# Docker Desktop gère automatiquement l'architecture
```

**Note** : Sur Windows, Docker Desktop utilise WSL2 qui supporte les deux architectures.

### macOS

**Intel Mac** :
```bash
docker-compose up -d
# Utilise automatiquement les images amd64
```

**Apple Silicon (M1/M2/M3)** :
```bash
docker-compose up -d
# Utilise automatiquement les images arm64
```

---

## Construction des images multi-architecture

### Prérequis

- Docker avec Buildx activé
- Pour pousser les images : accès à un registry Docker (Docker Hub, etc.)

### Construction pour les deux architectures

#### Linux/Mac

```bash
./scripts/build-multiarch.sh
```

Ce script :
1. Crée un builder multi-architecture si nécessaire
2. Construit les images backend et frontend pour amd64 et arm64
3. Pousse les images vers le registry (avec `--push`)

#### Windows (PowerShell)

```powershell
.\scripts\build-multiarch.ps1
```

### Construction pour une architecture spécifique (test local)

#### Backend (AMD64)

```bash
docker buildx build \
    --platform linux/amd64 \
    --load \
    -t maincourante/backend:latest \
    -f backend/Dockerfile.multiarch \
    ./backend
```

#### Backend (ARM64)

```bash
docker buildx build \
    --platform linux/arm64 \
    --load \
    -t maincourante/backend:latest \
    -f backend/Dockerfile.multiarch \
    ./backend
```

#### Frontend (AMD64)

```bash
docker buildx build \
    --platform linux/amd64 \
    --load \
    -t maincourante/frontend:latest \
    -f frontend/Dockerfile.multiarch \
    ./frontend
```

#### Frontend (ARM64)

```bash
docker buildx build \
    --platform linux/arm64 \
    --load \
    -t maincourante/frontend:latest \
    -f frontend/Dockerfile.multiarch \
    ./frontend
```

### Construction sans push (pour test local)

Si vous voulez construire sans pousser vers un registry, utilisez `--load` au lieu de `--push` :

```bash
# Backend
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file backend/Dockerfile.multiarch \
    --tag maincourante/backend:latest \
    --load \
    ./backend

# Frontend
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file frontend/Dockerfile.multiarch \
    --tag maincourante/frontend:latest \
    --load \
    ./frontend
```

**Note** : `--load` ne fonctionne que pour une seule architecture à la fois. Pour plusieurs architectures, utilisez `--push` vers un registry.

---

## Utilisation avec docker-compose

### Utilisation des images multi-architecture

Pour utiliser les images multi-architecture construites avec buildx, modifiez `docker-compose.yml` :

```yaml
services:
  backend:
    image: maincourante/backend:latest
    # Au lieu de build:
    # build:
    #   context: ./backend
    #   dockerfile: Dockerfile.multiarch
    ...
  
  frontend:
    image: maincourante/frontend:latest
    # Au lieu de build:
    # build:
    #   context: ./frontend
    #   dockerfile: Dockerfile.multiarch
    ...
```

Docker Compose sélectionnera automatiquement l'image appropriée pour votre architecture.

### Utilisation locale (développement)

Pour le développement, utilisez les Dockerfiles standards qui construisent pour l'architecture locale :

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ...
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ...
```

---

## Vérification de l'architecture

Pour vérifier l'architecture d'un conteneur en cours d'exécution :

```bash
# Vérifier l'architecture du système hôte
docker info | grep Architecture

# Vérifier l'architecture d'un conteneur
docker inspect <container_name> | grep Architecture

# Ou depuis l'intérieur du conteneur
docker exec <container_name> uname -m
```

---

## Dépannage

### Problème : Image non trouvée pour l'architecture

**Symptôme** : `no matching manifest for linux/arm64/v8 in the manifest list`

**Solution** : Construisez les images pour votre architecture ou utilisez buildx pour créer des images multi-architecture.

### Problème : Performance lente sur ARM

**Symptôme** : L'application est plus lente sur Raspberry Pi ou autre ARM

**Solution** : C'est normal, les processeurs ARM sont généralement moins puissants. Considérez :
- Utiliser un Raspberry Pi 4+ (minimum recommandé)
- Augmenter la RAM allouée à Docker
- Utiliser un stockage rapide (SSD au lieu de carte SD)

### Problème : Buildx non disponible

**Symptôme** : `docker buildx: command not found`

**Solution** :
- Docker Buildx est inclus dans Docker Desktop
- Pour Docker sur Linux, installez la version récente (20.10+)
- Pour activer buildx : `docker buildx create --use`

---

## Résumé

✅ **Multi-architecture** : Support complet AMD64 et ARM64  
✅ **Multi-plateforme** : Linux, Windows, macOS  
✅ **100% Offline** : Aucune dépendance externe  
✅ **Docker Buildx** : Construction d'images multi-architecture  
✅ **Cartographie offline** : PMTiles local, aucune API externe  

GerMaCrise V3 est prêt pour le déploiement sur n'importe quelle plateforme, avec ou sans connexion internet.

