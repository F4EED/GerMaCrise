# POC “testable par tout le monde” (Linux/Windows/macOS)

L’objectif : permettre à quelqu’un de tester GerMaCrise **sans installer Node/Python**, uniquement via **Docker + Docker Compose**.

Deux options :
- **Option A (simple, recommandé)** : code sur GitHub + les testeurs buildent localement via `docker compose`.
- **Option B (le plus fluide pour les testeurs)** : tu publies des **images Docker multi-architecture** (amd64/arm64) sur un registry (GHCR ou Docker Hub), et les testeurs ne font que `docker compose up`.

## 🚀 Publication sur GitHub + GHCR (Option B - Automatique)

### 1. Préparer le dépôt GitHub

1. Créer un dépôt GitHub (ex: `germacrise` ou `main-courante`)
2. Pousser le code :
   ```bash
   git remote add origin https://github.com/<owner>/<repo>.git
   git push -u origin main
   ```

### 2. Configurer GitHub Actions (automatique)

Le workflow `.github/workflows/docker-build.yml` est déjà configuré. Il va :
- ✅ Build automatiquement les images **multi-arch** (amd64 + arm64) à chaque push sur `main`
- ✅ Push vers **GHCR** (`ghcr.io/<owner>/germacrise-backend:latest` et `ghcr.io/<owner>/germacrise-frontend:latest`)
- ✅ Utiliser le token GitHub automatique (pas besoin de configurer de secret)

**Important** : Après le premier push, va dans **Settings → Actions → General** et active "Read and write permissions" pour le workflow.

### 3. Rendre les images publiques (optionnel)

Par défaut, les images GHCR sont privées. Pour les rendre publiques :
1. Va sur https://github.com/<owner>?tab=packages
2. Clique sur chaque package (`germacrise-backend`, `germacrise-frontend`)
3. **Package settings → Change visibility → Public**

### 4. Mettre à jour docker-compose.poc.yml avec les images GHCR

Une fois les images publiées, modifie `docker-compose.poc.yml` :

```yaml
backend:
  image: ghcr.io/<owner>/germacrise-backend:latest
  # Remplace "build:" par "image:" ci-dessus

frontend:
  image: ghcr.io/<owner>/germacrise-frontend:latest
  # Remplace "build:" par "image:" ci-dessus
```

Puis commit et push :
```bash
git add docker-compose.poc.yml
git commit -m "Configure POC avec images GHCR"
git push
```

### 5. Pour les testeurs (Option B)

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
cp env.example .env
docker compose -f docker-compose.poc.yml --env-file .env up -d
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

**C'est tout !** Les images sont téléchargées depuis GHCR (pas de build local).

---

## Prérequis testeur

- Docker Desktop (Windows/macOS) ou Docker Engine (Linux)
- Docker Compose v2 (`docker compose ...`)

---

## Option A — GitHub + build local (rapide à mettre en ligne)

1. Mettre le dépôt sur GitHub.
2. Le testeur clone puis lance :

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
cp env.example .env
docker compose -f docker-compose.poc.yml --env-file .env up -d
docker compose -f docker-compose.poc.yml --env-file .env run --rm seed
```

Accès :
- Frontend : `http://localhost:3000`
- API : `http://localhost:8000/docs`
- Cartographie : `http://localhost:3081/cartoff3.html`

Limite : le build peut être long sur certaines machines, et nécessite de télécharger les dépendances lors du build.

---

## 💾 Sauvegarde de la base de données complète (avec BAN)

Pour créer une sauvegarde complète incluant **toutes les tables + données + BAN** :

### Windows (PowerShell)
```powershell
.\scripts\backup.ps1 E:\
```

### Linux/Mac (Bash)
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

**Windows :**
```powershell
.\RESTORE_SCRIPTS\restore.ps1 "E:\main_courante_backup_20240101_120000" "C:\main_courante"
```

**Linux/Mac :**
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

---

## Notes importantes (POC vs “prod”)

- **`SECRET_KEY`** : change-le avant toute mise à dispo (même POC).
- **HTTPS** : pour une vraie expo Internet, mets un reverse-proxy TLS (Caddy/Traefik/Nginx) devant.
- **Exposition Internet** : si tu veux que des gens testent “sans installer Docker”, le plus simple est de déployer une instance (VM/VPS) et partager une URL.

