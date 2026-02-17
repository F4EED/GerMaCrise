# GerMaCrise V3

**Système de gestion de main courante multi-utilisateur pour la gestion de crises et les plans communaux/intercommunaux de sauvegarde (PICS)**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Multi-Arch](https://img.shields.io/badge/Arch-AMD64%20%7C%20ARM64-green)](COMPATIBILITE_MULTI_ARCH_OFFLINE.md)
[![Offline](https://img.shields.io/badge/Mode-100%25%20Offline-orange)](COMPATIBILITE_MULTI_ARCH_OFFLINE.md)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture technique](#architecture-technique)
4. [Prérequis](#prérequis)
5. [Installation](#installation)
   - [Windows](#installation-sous-windows)
   - [Linux](#installation-sous-linux)
   - [macOS](#installation-sous-macos)
6. [Déploiement](#déploiement)
   - [Déploiement local (Docker)](#déploiement-local-docker)
   - [POC partagé (GitHub + GHCR)](#poc-partagé-github--ghcr)
   - [Production](#production)
7. [Utilisation](#utilisation)
8. [Sauvegarde et restauration](#sauvegarde-et-restauration)
9. [Documentation complémentaire](#documentation-complémentaire)

---

## 🎯 Vue d'ensemble

**GerMaCrise V3** est une application web complète de gestion de main courante conçue pour la gestion de crises (climatiques, industrielles, transport, route) et les plans communaux/intercommunaux de sauvegarde (PICS).

### Cas d'usage principaux

- **Gestion de crise climatique** : Inondations, tempêtes, sécheresses
- **Gestion de crise industrielle** : Accidents industriels, pollutions
- **Gestion de crise transport** : Accidents de la route, incidents ferroviaires
- **Plans communaux de sauvegarde (PCS)** : Plans d'urgence municipaux
- **Plans intercommunaux de sauvegarde (PICS)** : Coordination intercommunale

### Points forts

- ✅ **100% Offline** : Fonctionne sans connexion internet
- ✅ **Multi-architecture** : Compatible Intel/AMD64 et ARM64 (Raspberry Pi, Apple Silicon)
- ✅ **Multi-plateforme** : Windows, Linux, macOS
- ✅ **Multi-utilisateur** : Gestion fine des rôles et permissions
- ✅ **Cartographie intégrée** : Base Adresse Nationale (BAN) avec recherche géographique
- ✅ **Docker Ready** : Déploiement simplifié via Docker Compose

---

## ✨ Fonctionnalités

### Gestion des ressources

- **Personnel** : Gestion complète du personnel (création, modification, recherche, statuts)
- **Moyens** : Gestion des moyens matériels disponibles
- **Véhicules** : Gestion de la flotte de véhicules
- **Recherche multi-critères** : Recherche avancée dans toutes les ressources

### Main courante

- **Événements** : Création et suivi des événements de crise
- **Engagements** : Association de personnel, moyens et véhicules aux événements
- **Historique** : Suivi complet de l'historique des interventions
- **Statuts en temps réel** : Suivi des statuts (disponible, engagé, indisponible)

### Cartographie

- **Base Adresse Nationale (BAN)** : Intégration complète avec recherche par adresse
- **Recherche géographique** : Recherche par département, commune, code postal
- **Cartographie interactive** : Visualisation sur carte avec PMTiles offline
- **Géolocalisation** : Support PostGIS pour requêtes géographiques

### Utilisateurs et sécurité

- **Multi-utilisateur** : Gestion de plusieurs utilisateurs avec rôles
- **Rôles** : Utilisateur, Administrateur, Super Administrateur
- **Authentification JWT** : Sécurisée avec tokens
- **Permissions granulaires** : Contrôle d'accès par fonctionnalité

### Synchronisation

- **Mode offline** : Fonctionnement 100% local
- **Synchronisation optionnelle** : Synchronisation vers base nationale (si configurée)
- **API de synchronisation** : Endpoint dédié pour la synchronisation

---

## 🏗️ Architecture technique

### Stack technologique

#### Backend
- **Framework** : FastAPI (Python 3.11+)
- **ORM** : SQLAlchemy
- **Validation** : Pydantic
- **Authentification** : JWT (JSON Web Tokens)
- **Base de données** : PostgreSQL 16 + PostGIS 3.4
- **API** : RESTful avec documentation automatique (Swagger/OpenAPI)

#### Frontend
- **Framework** : React 18.2+ avec TypeScript
- **Routing** : React Router DOM
- **HTTP Client** : Axios
- **State Management** : React Context API
- **Build Tool** : Create React App (react-scripts)

#### Infrastructure
- **Containerisation** : Docker + Docker Compose
- **Architectures supportées** : AMD64 (x86_64) et ARM64 (aarch64)
- **Réseau** : Bridge network Docker pour communication inter-conteneurs
- **Services** : Nginx pour cartographie et visualisation

### Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Web                          │
│                    (Navigateur - React)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Frontend (React)                        │
│              Port 3000 (Docker Container)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ API REST
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend (FastAPI)                       │
│              Port 8000 (Docker Container)                   │
│  - Authentification JWT                                     │
│  - Routes API (personnel, moyens, véhicules, etc.)          │
│  - Logique métier                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL + PostGIS                          │
│              Port 5433 (Docker Container)                   │
│  - Tables métier (personnel, moyens, véhicules, etc.)      │
│  - Table BAN (Base Adresse Nationale)                      │
│  - Extensions PostGIS pour données géographiques            │
└─────────────────────────────────────────────────────────────┘

Services additionnels :
┌──────────────────┐  ┌──────────────────┐
│  Cartographie    │  │   Visualisation  │
│  (Nginx)         │  │   (Nginx)        │
│  Port 3081       │  │   Port 3080      │
└──────────────────┘  └──────────────────┘
```

### Structure du projet

```
GerMaCrise/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── models.py          # Modèles SQLAlchemy
│   │   ├── schemas.py         # Schémas Pydantic
│   │   ├── routers/           # Routes API
│   │   │   ├── auth.py        # Authentification
│   │   │   ├── users.py       # Gestion utilisateurs
│   │   │   ├── personnel.py   # Gestion personnel
│   │   │   ├── moyens.py      # Gestion moyens
│   │   │   ├── vehicules.py   # Gestion véhicules
│   │   │   ├── main_courante.py # Main courante
│   │   │   └── evenements.py  # Gestion événements
│   │   ├── database.py        # Configuration DB
│   │   └── main.py           # Point d'entrée FastAPI
│   ├── scripts/               # Scripts utilitaires
│   ├── migrations/            # Migrations SQL
│   ├── Dockerfile             # Image Docker (dev)
│   └── Dockerfile.multiarch   # Image Docker (multi-arch)
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── pages/            # Pages de l'application
│   │   ├── components/       # Composants réutilisables
│   │   └── ...
│   ├── public/               # Fichiers statiques
│   ├── Dockerfile            # Image Docker (dev)
│   └── Dockerfile.multiarch  # Image Docker (multi-arch)
│
├── json/                      # Fichiers GeoJSON BAN
│   └── BAN_*.geojson         # Fichiers par département
│
├── scripts/                   # Scripts d'administration
│   ├── init.ps1 / init.sh    # Initialisation
│   ├── backup.ps1 / backup.sh # Sauvegarde
│   └── restore.ps1 / restore.sh # Restauration
│
├── docker-compose.yml         # Configuration Docker (développement)
├── docker-compose.poc.yml    # Configuration Docker (POC)
├── .github/
│   └── workflows/
│       └── docker-build.yml  # CI/CD GitHub Actions
│
└── README.md                  # Ce fichier
```

---

## 📦 Prérequis

### Obligatoires

- **Docker** : Version 20.10 ou supérieure
  - Windows : [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux : [Docker Engine](https://docs.docker.com/engine/install/)
  - macOS : [Docker Desktop](https://www.docker.com/products/docker-desktop)

- **Docker Compose** : Version 2.0 ou supérieure (inclus avec Docker Desktop)

### Optionnels (pour le développement)

- **Node.js** : Version 18+ (pour développement frontend)
- **Python** : Version 3.11+ (pour développement backend)
- **Git** : Pour cloner le dépôt

### Ressources système recommandées

- **RAM** : Minimum 4 GB (recommandé 8 GB)
- **Disque** : Minimum 10 GB d'espace libre
- **CPU** : 2 cœurs minimum (4 cœurs recommandés)

---

## 🚀 Installation

### Installation sous Windows

#### Méthode 1 : Script automatique (Recommandé)

1. **Installer Docker Desktop**
   - Télécharger depuis [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Installer et démarrer Docker Desktop
   - Vérifier : `docker --version`

2. **Cloner ou télécharger le projet**
   ```powershell
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```

3. **Lancer le script d'initialisation**
   ```powershell
   .\scripts\init.ps1
   ```

   Le script va :
   - Démarrer la base de données
   - Initialiser les tables
   - Créer l'utilisateur admin
   - Démarrer tous les services

#### Méthode 2 : Installation manuelle

```powershell
# 1. Démarrer la base de données
docker compose up -d db

# 2. Attendre que la base soit prête (environ 10 secondes)
Start-Sleep -Seconds 10

# 3. Initialiser la base de données
docker compose run --rm backend python -m app.init_db

# 4. Démarrer tous les services
docker compose up -d
```

#### Méthode 3 : Avec données pré-chargées (POC)

```powershell
# 1. Copier le fichier d'environnement
Copy-Item env.example .env

# 2. Démarrer les services
docker compose -f docker-compose.poc.yml --env-file .env up -d

# 3. Charger les données fictives + BAN
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

### Installation sous Linux

#### Méthode 1 : Script automatique (Recommandé)

1. **Installer Docker et Docker Compose**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Red Hat/CentOS
   sudo yum install -y docker docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **Cloner le projet**
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```

3. **Lancer le script d'initialisation**
   ```bash
   chmod +x scripts/init.sh
   ./scripts/init.sh
   ```

#### Méthode 2 : Installation manuelle

```bash
# 1. Démarrer la base de données
docker compose up -d db

# 2. Attendre que la base soit prête
sleep 10

# 3. Initialiser la base de données
docker compose run --rm backend python -m app.init_db

# 4. Démarrer tous les services
docker compose up -d
```

#### Méthode 3 : Avec données pré-chargées (POC)

```bash
# 1. Copier le fichier d'environnement
cp env.example .env

# 2. Démarrer les services
docker compose -f docker-compose.poc.yml --env-file .env up -d

# 3. Charger les données fictives + BAN
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

### Installation sous macOS

#### Méthode 1 : Script automatique (Recommandé)

1. **Installer Docker Desktop**
   - Télécharger depuis [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Installer et démarrer Docker Desktop

2. **Cloner le projet**
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```

3. **Lancer le script d'initialisation**
   ```bash
   chmod +x scripts/init.sh
   ./scripts/init.sh
   ```

#### Méthode 2 : Installation manuelle

Identique à Linux (voir section ci-dessus).

---

## 🌐 Déploiement

### Déploiement local (Docker)

**Utilisation** : Développement et tests locaux

**Configuration** : `docker-compose.yml`

```bash
# Démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down
```

**Accès** :
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- API Docs : http://localhost:8000/docs
- Cartographie : http://localhost:3081/cartoff3.html

### POC partagé (GitHub + GHCR)

**Utilisation** : Partage avec des testeurs externes

**Configuration** : `docker-compose.poc.yml`

#### 1. Publier sur GitHub

```bash
# Initialiser le dépôt Git
git init
git add .
git commit -m "Initial commit"

# Ajouter le remote GitHub
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

#### 2. Activer GitHub Actions

1. Aller dans **Settings → Actions → General**
2. Activer "Read and write permissions" pour les workflows
3. Les images seront buildées automatiquement à chaque push

#### 3. Rendre les images publiques (optionnel)

1. Aller sur https://github.com/<owner>?tab=packages
2. Pour chaque package (`germacrise-backend`, `germacrise-frontend`) :
   - Cliquer sur le package
   - **Package settings → Change visibility → Public**

#### 4. Mettre à jour docker-compose.poc.yml

Remplacer `build:` par `image:` :

```yaml
backend:
  image: ghcr.io/<owner>/germacrise-backend:latest

frontend:
  image: ghcr.io/<owner>/germacrise-frontend:latest
```

#### 5. Pour les testeurs

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
cp env.example .env
docker compose -f docker-compose.poc.yml --env-file .env up -d
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

Voir [README_POC.md](README_POC.md) pour plus de détails.

### Production

**Recommandations** :

1. **Sécurité**
   - Changer `SECRET_KEY` dans `.env`
   - Utiliser HTTPS (reverse-proxy : Nginx, Traefik, Caddy)
   - Configurer un pare-feu
   - Limiter l'accès réseau

2. **Performance**
   - Utiliser des images multi-arch optimisées
   - Configurer les limites de ressources Docker
   - Activer la compression pour les réponses API

3. **Sauvegarde**
   - Automatiser les sauvegardes de la base de données
   - Tester régulièrement la restauration

4. **Monitoring**
   - Configurer des logs centralisés
   - Surveiller les performances
   - Mettre en place des alertes

Exemple avec Nginx (reverse-proxy) :

```nginx
server {
    listen 80;
    server_name germacrise.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 💻 Utilisation

### Accès à l'application

Une fois les services démarrés :

- **Interface web** : http://localhost:3000
- **Documentation API** : http://localhost:8000/docs
- **Cartographie** : http://localhost:3081/cartoff3.html

### Compte administrateur par défaut

- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Important** : Changez le mot de passe après la première connexion !

### Charger des données fictives

Pour tester l'application avec des données de démonstration :

```bash
# Personnel fictif (15 personnes)
docker compose exec backend python /app/scripts/insert_personnel_fictif.py

# Moyens fictifs (10 moyens)
docker compose exec backend python /app/scripts/insert_moyens_fictifs.py

# Véhicules fictifs (10 véhicules)
docker compose exec backend python /app/scripts/insert_vehicules_fictifs.py

# Utilisateurs fictifs (10 utilisateurs)
docker compose exec backend python /app/scripts/insert_utilisateurs_fictifs.py
```

**Note** : Tous les utilisateurs fictifs ont le mot de passe `password123`

### Import de la Base Adresse Nationale (BAN)

Si vous avez des fichiers GeoJSON BAN (`BAN_*.geojson`) dans le dossier `json/` :

```bash
# Importer tous les départements manquants
docker compose exec backend python /app/scripts/import_ban_departements_manquants_avec_transformation.py --yes
```

### Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend

# Redémarrer un service
docker compose restart backend

# Arrêter tous les services
docker compose down

# Supprimer toutes les données (⚠️ attention)
docker compose down -v

# Reconstruire les images
docker compose build

# Vérifier l'état des services
docker compose ps
```

---

## 💾 Sauvegarde et restauration

### Sauvegarde complète

Pour créer une sauvegarde incluant **toutes les tables + données + BAN** :

#### Windows (PowerShell)
```powershell
.\scripts\backup.ps1 E:\
```

#### Linux/Mac (Bash)
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh /media/usb
```

Le script crée un dossier `main_courante_backup_YYYYMMDD_HHMMSS/` contenant :
- ✅ Code source complet
- ✅ **Base de données complète** (`database_backup.sql`) avec **toutes les tables, y compris BAN**
- ✅ Documents stockés
- ✅ Scripts de restauration

### Restauration sur une autre machine

Le dossier de sauvegarde contient tout ce qu'il faut. Sur la nouvelle machine :

#### Windows
```powershell
.\RESTORE_SCRIPTS\restore.ps1 "E:\main_courante_backup_20240101_120000" "C:\main_courante"
```

#### Linux/Mac
```bash
chmod +x RESTORE_SCRIPTS/restore.sh
./RESTORE_SCRIPTS/restore.sh "/media/usb/main_courante_backup_20240101_120000" ~/main_courante
```

La restauration va :
1. Copier tous les fichiers
2. Démarrer la base de données
3. **Restaurer la base complète** (toutes les tables + données + BAN)
4. Démarrer tous les services

**Note** : `pg_dump` sauvegarde **toutes les tables**, donc la table `ban` avec ses ~47M d'adresses est incluse automatiquement.

Voir [GUIDE_SAUVEGARDE_RESTAURATION.md](GUIDE_SAUVEGARDE_RESTAURATION.md) pour plus de détails.

---

## 📚 Documentation complémentaire

- **[QUICKSTART.md](QUICKSTART.md)** : Guide de démarrage rapide
- **[DOCUMENTATION_GENERALE.md](DOCUMENTATION_GENERALE.md)** : Documentation technique complète
- **[COMPATIBILITE_MULTI_ARCH_OFFLINE.md](COMPATIBILITE_MULTI_ARCH_OFFLINE.md)** : Compatibilité multi-architecture et mode offline
- **[README_POC.md](README_POC.md)** : Guide pour publier un POC partagé
- **[GUIDE_SAUVEGARDE_RESTAURATION.md](GUIDE_SAUVEGARDE_RESTAURATION.md)** : Sauvegarde et restauration détaillées
- **[SCHEMA_DATABASE.md](SCHEMA_DATABASE.md)** : Schéma de la base de données
- **[MAINTENANCE.md](MAINTENANCE.md)** : Guide de maintenance

---

## 🐛 Dépannage

### Le frontend ne se charge pas

```bash
# Vérifier les logs
docker compose logs frontend

# Redémarrer le frontend
docker compose restart frontend
```

### Le backend ne répond pas

```bash
# Vérifier les logs
docker compose logs backend

# Vérifier la connexion à la base de données
docker compose exec backend python -c "from app.database import engine; engine.connect()"
```

### La base de données ne démarre pas

```bash
# Vérifier les logs
docker compose logs db

# Réinitialiser la base de données
docker compose down
docker volume rm main_courante_postgres_data
docker compose up -d db
sleep 10
docker compose run --rm backend python -m app.init_db
```

### Réinitialiser complètement

```bash
# ⚠️ ATTENTION : Supprime toutes les données
docker compose down -v
docker compose up -d db
sleep 10
docker compose run --rm backend python -m app.init_db
docker compose up -d
```

### Ports déjà utilisés

Si les ports sont déjà utilisés, modifiez `docker-compose.yml` :

```yaml
services:
  db:
    ports:
      - "5434:5432"  # Au lieu de 5433
  backend:
    ports:
      - "8001:8000"  # Au lieu de 8000
  frontend:
    ports:
      - "3001:3000"  # Au lieu de 3000
```

---

## 🔐 Sécurité

### Recommandations de sécurité

1. **Changer le mot de passe admin par défaut** immédiatement après l'installation
2. **Configurer un `SECRET_KEY` fort** dans les variables d'environnement
3. **Utiliser HTTPS en production** (reverse-proxy avec certificat SSL)
4. **Configurer un pare-feu** pour limiter l'accès réseau
5. **Ne pas exposer les ports directement** sur Internet sans protection
6. **Sauvegarder régulièrement** la base de données
7. **Mettre à jour régulièrement** les dépendances et images Docker

### Variables d'environnement sensibles

Créez un fichier `.env` (non versionné) :

```env
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire
POSTGRES_PASSWORD=mot-de-passe-securise
POSTGRES_USER=maincourante
```

---

## 🤝 Contribution

Ce projet est développé pour la gestion de crises et la sécurité civile.

Pour contribuer :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est développé pour la gestion de crises et la sécurité civile.

---

## 📞 Support

Pour toute question ou problème :
1. Consulter la [documentation](DOCUMENTATION_GENERALE.md)
2. Vérifier les [guides de dépannage](#-dépannage)
3. Consulter les logs : `docker compose logs -f`

---

**GerMaCrise V3** - Système de gestion de main courante pour la gestion de crises
