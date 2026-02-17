# Guide de Sauvegarde et Restauration - Main Courante

Ce guide explique comment sauvegarder complètement le projet Main Courante (code source + base de données) sur une clé USB et restaurer le tout sur un autre PC.

## 📋 Table des matières

1. [Sauvegarde](#sauvegarde)
2. [Restauration](#restauration)
3. [Compatibilité cross-platform](#compatibilité-cross-platform)
4. [Vérifications](#vérifications)
5. [Dépannage](#dépannage)

---

## 🔄 Compatibilité cross-platform

### ✅ Sauvegarde sous Windows → Restauration sous Linux (et vice-versa)

**OUI, c'est totalement compatible !** Vous pouvez sauvegarder votre projet sous Windows et le restaurer sous Linux (ou l'inverse).

#### Pourquoi cela fonctionne ?

1. **Fichiers texte** : Tous les fichiers du projet (code Python, TypeScript, JSON, SQL, etc.) sont en texte brut et sont compatibles entre systèmes
2. **Base de données** : L'export SQL est un fichier texte standard, compatible sur tous les systèmes
3. **Docker** : Docker gère automatiquement les différences de systèmes de fichiers entre Windows et Linux
4. **Fichiers binaires** : Les documents (PDF, images) sont compatibles sur tous les systèmes

#### Comment procéder ?

**Scénario 1 : Sauvegarde Windows → Restauration Linux**

1. **Sur Windows** : Utilisez le script PowerShell
   ```powershell
   .\scripts\backup.ps1 E:\
   ```

2. **Sur Linux** : Utilisez le script Bash (pas le PowerShell !)
   ```bash
   ./scripts/restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante
   ```

**Scénario 2 : Sauvegarde Linux → Restauration Windows**

1. **Sur Linux** : Utilisez le script Bash
   ```bash
   ./scripts/backup.sh /media/usb
   ```

2. **Sur Windows** : Utilisez le script PowerShell (pas le Bash !)
   ```powershell
   .\scripts\restore.ps1 E:\main_courante_backup_20240101_120000 C:\main_courante
   ```

#### Points d'attention

- ✅ **Format de clé USB** : Utilisez FAT32 ou exFAT pour la compatibilité maximale (évitez NTFS si vous utilisez Linux)
- ✅ **Fins de ligne** : Git et les éditeurs modernes gèrent automatiquement les différences CRLF (Windows) / LF (Linux)
- ✅ **Permissions** : Sous Linux, vous devrez peut-être ajuster les permissions après la restauration :
  ```bash
  chmod +x scripts/*.sh
  ```
- ✅ **Chemins** : Les scripts gèrent automatiquement les différences de chemins (backslash vs slash)

#### Exemple complet : Windows → Linux

```powershell
# 1. Sur Windows, sauvegarder
.\scripts\backup.ps1 E:\
# → Crée E:\main_courante_backup_20240101_120000\

# 2. Débrancher la clé USB et la brancher sur le PC Linux

# 3. Sur Linux, restaurer
chmod +x scripts/restore.sh
./scripts/restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante
```

---

## 💾 Sauvegarde

### Prérequis

- Docker et Docker Compose installés et fonctionnels
- Clé USB avec suffisamment d'espace (recommandé: au moins 5 GB)
- Le projet doit être démarré (au moins la base de données) pour sauvegarder les données

### Méthode 1 : Script automatique (Recommandé)

#### Sur Windows (PowerShell)

```powershell
# Méthode 1 : Spécifier le chemin de la clé USB
.\scripts\backup.ps1 E:\

# Méthode 2 : Le script vous demandera le chemin
.\scripts\backup.ps1
```

#### Sur Linux/Mac

```bash
# Rendre le script exécutable (première fois seulement)
chmod +x scripts/backup.sh

# Méthode 1 : Spécifier le chemin de la clé USB
./scripts/backup.sh /media/usb

# Méthode 2 : Le script vous demandera le chemin
./scripts/backup.sh
```

### Contenu de la sauvegarde

Le script sauvegarde automatiquement :

- ✅ **Code source complet** (backend, frontend, scripts, etc.)
- ✅ **Fichiers de configuration** (docker-compose.yml, Dockerfile, etc.)
- ✅ **Documents stockés** (backend/storage/documents/)
- ✅ **Base de données PostgreSQL** (export SQL complet)
- ✅ **Fichiers JSON de configuration** (json/)
- ✅ **Migrations de base de données** (migrations/)

### Exclusions automatiques

Les éléments suivants ne sont **pas** sauvegardés (pour économiser l'espace) :

- `node_modules/` (sera réinstallé lors de la restauration)
- `__pycache__/` et `.pyc` (fichiers Python compilés)
- `.git/` (historique Git, si présent)
- `venv/`, `env/`, `.venv/` (environnements Python virtuels)
- `.env` (fichiers d'environnement sensibles)
- `build/`, `dist/` (fichiers de compilation)
- `*.log` (fichiers de logs)
- `.vscode/`, `.idea/` (configurations IDE)

### Résultat

Après l'exécution du script, vous obtiendrez un dossier nommé :

```
main_courante_backup_YYYYMMDD_HHMMSS/
```

Contenant :
- Tous les fichiers du projet
- `database_backup.sql` : Export complet de la base de données
- `BACKUP_INFO.txt` : Informations sur la sauvegarde

---

## 🔄 Restauration

### Prérequis sur le PC de destination

- Docker et Docker Compose installés
- Au moins 10 GB d'espace disque disponible
- Ports disponibles : 5433, 8000, 3001

### Méthode 1 : Script automatique (Recommandé)

#### Sur Windows (PowerShell)

```powershell
# Méthode 1 : Spécifier les chemins
.\scripts\restore.ps1 E:\main_courante_backup_20240101_120000 C:\main_courante

# Méthode 2 : Le script vous demandera les chemins
.\scripts\restore.ps1
```

#### Sur Linux/Mac

```bash
# Rendre le script exécutable (première fois seulement)
chmod +x scripts/restore.sh

# Méthode 1 : Spécifier les chemins
./scripts/restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante

# Méthode 2 : Le script vous demandera les chemins
./scripts/restore.sh
```

### Processus de restauration

Le script de restauration effectue automatiquement :

1. ✅ **Vérifications préalables**
   - Vérification de Docker et Docker Compose
   - Vérification que Docker est en cours d'exécution

2. ✅ **Copie des fichiers**
   - Copie de tous les fichiers du projet dans le dossier de destination

3. ✅ **Arrêt des conteneurs existants**
   - Arrêt propre des conteneurs s'ils existent déjà

4. ✅ **Construction des images Docker**
   - Construction des images backend et frontend
   - Cela peut prendre plusieurs minutes la première fois

5. ✅ **Démarrage de la base de données**
   - Démarrage du conteneur PostgreSQL/PostGIS
   - Attente que la base soit prête

6. ✅ **Restauration de la base de données**
   - Import du fichier `database_backup.sql`
   - Restauration complète de toutes les données

7. ✅ **Démarrage de tous les services**
   - Démarrage du backend et du frontend

### Après la restauration

Une fois la restauration terminée, vous pouvez accéder à l'application :

- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:8000
- **API Docs** : http://localhost:8000/docs

---

## ✅ Vérifications

### Vérifier que la sauvegarde a réussi

1. Vérifier que le dossier de sauvegarde existe
2. Vérifier la présence de `database_backup.sql` dans le dossier
3. Vérifier la taille du dossier (devrait être d'au moins quelques centaines de MB)

### Vérifier que la restauration a réussi

```bash
# Vérifier que les conteneurs sont en cours d'exécution
docker-compose ps

# Vérifier les logs
docker-compose logs -f

# Tester l'API
curl http://localhost:8000/docs
```

### Vérifier la base de données

```bash
# Se connecter à la base de données
docker-compose exec db psql -U maincourante -d main_courante

# Lister les tables
\dt

# Compter les enregistrements dans une table (exemple)
SELECT COUNT(*) FROM utilisateurs;

# Quitter
\q
```

---

## 🔧 Dépannage

### Problème : "Port already allocated"

**Symptôme** : Erreur lors du démarrage des conteneurs indiquant qu'un port est déjà utilisé.

**Solution** :
1. Vérifier quels ports sont utilisés :
   ```bash
   # Windows
   netstat -ano | findstr :5433
   netstat -ano | findstr :8000
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :5433
   lsof -i :8000
   lsof -i :3001
   ```

2. Arrêter les services qui utilisent ces ports, ou modifier les ports dans `docker-compose.yml`

### Problème : "Docker not running"

**Symptôme** : Erreur indiquant que Docker n'est pas en cours d'exécution.

**Solution** :
1. Démarrer Docker Desktop (Windows/Mac) ou le service Docker (Linux)
2. Attendre que Docker soit complètement démarré
3. Relancer le script

### Problème : "Database connection refused"

**Symptôme** : Le backend ne peut pas se connecter à la base de données.

**Solution** :
1. Vérifier que le conteneur de base de données est en cours d'exécution :
   ```bash
   docker-compose ps db
   ```

2. Vérifier les logs de la base de données :
   ```bash
   docker-compose logs db
   ```

3. Redémarrer la base de données :
   ```bash
   docker-compose restart db
   ```

### Problème : Sauvegarde de base de données vide ou corrompue

**Symptôme** : Le fichier `database_backup.sql` est vide ou la restauration échoue.

**Solution** :
1. Vérifier que le conteneur de base de données était en cours d'exécution lors de la sauvegarde
2. Vérifier la taille du fichier `database_backup.sql`
3. Essayer de sauvegarder manuellement :
   ```bash
   docker exec main_courante_db pg_dump -U maincourante main_courante > backup_manual.sql
   ```

### Problème : Restauration prend trop de temps

**Symptôme** : La restauration semble bloquée.

**Solution** :
1. C'est normal pour de grandes bases de données (plusieurs minutes)
2. Vérifier les logs en temps réel :
   ```bash
   docker-compose logs -f db
   ```
3. Si vraiment bloqué, arrêter (Ctrl+C) et relancer la restauration

### Problème : Erreur de permissions (Linux/Mac)

**Symptôme** : "Permission denied" lors de l'exécution des scripts.

**Solution** :
```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

---

## 📝 Sauvegarde manuelle (alternative)

Si les scripts automatiques ne fonctionnent pas, vous pouvez effectuer une sauvegarde manuelle :

### 1. Sauvegarder la base de données

```bash
docker exec main_courante_db pg_dump -U maincourante main_courante > database_backup.sql
```

### 2. Copier les fichiers du projet

Copiez manuellement tous les fichiers du projet sur votre clé USB, en excluant :
- `node_modules/`
- `__pycache__/`
- `.git/` (optionnel)
- `venv/`, `env/`, `.venv/`

### 3. Restaurer manuellement

Sur le nouveau PC :

1. Copier les fichiers du projet
2. Démarrer la base de données : `docker-compose up -d db`
3. Attendre que la base soit prête
4. Restaurer la base : `cat database_backup.sql | docker exec -i main_courante_db psql -U maincourante -d main_courante`
5. Démarrer tous les services : `docker-compose up -d`

---

## 🔐 Notes de sécurité

- Les fichiers `.env` ne sont pas sauvegardés par défaut (ils peuvent contenir des secrets)
- Si vous avez des secrets dans votre projet, sauvegardez-les séparément et de manière sécurisée
- Le mot de passe de la base de données est dans `docker-compose.yml` (par défaut: `maincourante_pass`)
- Changez les mots de passe par défaut en production

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs Docker : `docker-compose logs`
2. La documentation : `README.md`
3. Le guide de maintenance : `MAINTENANCE.md`

