# Guide d’installation GerMaCrise

Ce document décrit comment installer et lancer GerMaCrise sur votre machine (Windows, Linux ou macOS).

---

## Prérequis

- **Docker** : version 20.10 ou supérieure  
  - Windows / macOS : [Docker Desktop](https://www.docker.com/products/docker-desktop)  
  - Linux : [Docker Engine](https://docs.docker.com/engine/install/)
- **Docker Compose** : version 2.0 ou supérieure (inclus avec Docker Desktop)

Vérification :
```bash
docker --version
docker compose version
```

Recommandations machine : 4 Go RAM minimum (8 Go conseillé), 10 Go d’espace disque.

---

## Quel fichier utiliser ?

| Fichier | Usage |
|--------|--------|
| **`docker-compose.poc.yml`** | **POC GerMaCrise complet** : base + backend + frontend + données fictives + BAN + visu + cartographie. À utiliser pour une démo ou un test complet. |
| `docker-compose.yml` | Environnement de développement (volumes montés, hot-reload). |
| `docker-compose.dev.yml` | Variante développement. |
| `docker-compose.documents.yml` | Extension pour la gestion des documents. |

Pour avoir le **POC complet**, utilisez **`docker-compose.poc.yml`**.

---

## Installation du POC complet (recommandé)

### 1. Se placer à la racine du projet

```bash
cd C:\GerMaCrise   # ou le chemin de votre dépôt
```

### 2. Fichier d’environnement

Créez un fichier `.env` à la racine (copie de `env.example`) :

**Windows (PowerShell) :**
```powershell
Copy-Item env.example .env
```

**Linux / macOS :**
```bash
cp env.example .env
```

Vous pouvez modifier `.env` (ports, `SECRET_KEY`, etc.). Les valeurs par défaut suffisent pour un premier test.

### 3. Démarrer les services

**Windows (PowerShell) :**
```powershell
docker compose -f docker-compose.poc.yml --env-file .env up -d
```

**Linux / macOS :**
```bash
docker compose -f docker-compose.poc.yml --env-file .env up -d
```

### 4. Charger les données (première fois uniquement)

Après le premier démarrage, exécutez **une fois** le service `seed` pour initialiser la base, les données fictives et l’import BAN :

**Windows (PowerShell) :**
```powershell
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

**Linux / macOS :**
```bash
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

### 5. Accès à l’application

Une fois les services démarrés (et `seed` exécuté) :

| Service | URL |
|--------|-----|
| **Application (frontend)** | http://localhost:3000 |
| **API / documentation** | http://localhost:8000/docs |
| **Cartographie** | http://localhost:3081/cartoff3.html |
| **Visualisation** | http://localhost:3080 |

**Compte par défaut :**
- Utilisateur : `admin`
- Mot de passe : `admin123`

À modifier après la première connexion.

---

## Restauration à partir d’un dump existant

Si vous disposez d’un fichier de dump PostgreSQL (par ex. `data/germacrise.dump` ou `database_backup.sql`) :

1. Démarrer la stack POC (au moins la base) :
   ```bash
   docker compose -f docker-compose.poc.yml up -d db
   ```

2. Attendre que le conteneur soit prêt, puis restaurer :
   - **Dump au format custom (`.dump`)** — copier dans le conteneur puis restaurer :
     ```bash
     docker cp data/germacrise.dump germacrise_db:/tmp/germacrise.dump
     docker exec germacrise_db pg_restore -U maincourante -d main_courante /tmp/germacrise.dump
     ```
   - **Dump au format SQL (`.sql`)** :
     ```bash
     cat data/germacrise.sql | docker exec -i germacrise_db psql -U maincourante -d main_courante
     ```
     Windows PowerShell (une seule ligne) :
     ```powershell
     Get-Content data\germacrise.sql -Raw | docker exec -i germacrise_db psql -U maincourante -d main_courante
     ```

3. Démarrer le reste des services :
   ```bash
   docker compose -f docker-compose.poc.yml up -d
   ```

---

## Installation avec script d’initialisation (docker-compose standard)

Pour un environnement de type développement avec `docker-compose.yml` :

**Windows (PowerShell) :**
```powershell
.\scripts\init.ps1
```

**Linux / macOS :**
```bash
chmod +x scripts/init.sh
./scripts/init.sh
```

Le script démarre la base, initialise les tables, crée l’admin et lance les services.

---

## Construction des images multi-architecture (optionnel)

Si vous construisez vous-même les images pour amd64/arm64 :

**Windows (PowerShell), depuis la racine du dépôt :**
```powershell
.\scripts\build-multiarch.ps1
```

**Linux / macOS :**
```bash
chmod +x scripts/build-multiarch.sh
./scripts/build-multiarch.sh
```

---

## Commandes utiles

```bash
# Arrêter le POC
docker compose -f docker-compose.poc.yml down

# Voir les logs
docker compose -f docker-compose.poc.yml logs -f

# État des conteneurs
docker compose -f docker-compose.poc.yml ps
```

---

## Sauvegarde et restauration

- **Sauvegarde POC** : `.\scripts\backup-poc.ps1` (Windows) ou `./scripts/backup-poc.sh` (Linux/macOS).
- **Sauvegarde standard** : `.\scripts\backup.ps1` / `./scripts/backup.sh`.
- **Restauration** : voir [GUIDE_SAUVEGARDE_RESTAURATION.md](GUIDE_SAUVEGARDE_RESTAURATION.md) et `scripts/README_RESTORE.md`.

---

## Dépannage

- **Port déjà utilisé** : modifier les ports dans `.env` (ex. `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`).
- **Frontend ou backend ne répond pas** :  
  `docker compose -f docker-compose.poc.yml logs frontend`  
  `docker compose -f docker-compose.poc.yml logs backend`
- **Base non initialisée** : relancer le `seed` (étape 4) ou restaurer un dump (section ci-dessus).
- **Tout réinitialiser (données perdues)** :  
  `docker compose -f docker-compose.poc.yml down -v`  
  Puis refaire les étapes 3 et 4.

---

## Documentation complémentaire

- [README.md](README.md) — Vue d’ensemble et fonctionnalités
- [QUICKSTART.md](QUICKSTART.md) — Démarrage rapide
- [README_POC.md](README_POC.md) — Partager le POC (images, testeurs)
- [GUIDE_SAUVEGARDE_RESTAURATION.md](GUIDE_SAUVEGARDE_RESTAURATION.md) — Sauvegarde et restauration
