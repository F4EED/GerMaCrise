# Guide : Augmenter la taille de la base de données

Ce guide explique comment augmenter les capacités de la base de données PostgreSQL de votre application.

## 📋 Vue d'ensemble

L'augmentation de la "taille" de la base peut signifier plusieurs choses :

1. **Ressources système** : Mémoire RAM et CPU alloués au conteneur
2. **Paramètres PostgreSQL** : Configuration pour gérer plus de données et connexions
3. **Espace disque** : Taille du volume Docker (dépend de l'espace disponible sur votre machine)

## ✅ Modifications apportées

### 1. Ressources Docker (docker-compose.yml)

Les limites de ressources ont été augmentées pour le service `db` :

```yaml
deploy:
  resources:
    limits:
      cpus: '4'        # Maximum 4 CPU
      memory: 4G      # Maximum 4 Go de RAM
    reservations:
      cpus: '1'        # Minimum 1 CPU garanti
      memory: 1G       # Minimum 1 Go de RAM garanti
```

**Avant** : Aucune limite définie (utilisait les ressources par défaut)

### 2. Configuration PostgreSQL

Un fichier de configuration a été créé (`backend/configure_postgres.sql`) qui optimise :

- **Connexions** : `max_connections = 200` (au lieu de 100 par défaut)
- **Mémoire** :
  - `shared_buffers = 1GB` (cache partagé)
  - `effective_cache_size = 3GB` (cache effectif)
  - `work_mem = 16MB` (mémoire par opération)
  - `maintenance_work_mem = 256MB` (opérations de maintenance)
- **WAL** : `max_wal_size = 2GB` (réduit les checkpoints)
- **Parallélisme** : Optimisé pour utiliser plusieurs CPU
- **Autovacuum** : Optimisé pour le nettoyage automatique

## 🚀 Comment appliquer les modifications

### Option 1 : Nouvelle installation

Si vous créez une nouvelle base de données, les paramètres seront appliqués automatiquement lors de l'initialisation :

```powershell
# Arrêter et supprimer les conteneurs et volumes existants
docker-compose down -v

# Redémarrer avec la nouvelle configuration
docker-compose up -d
```

⚠️ **ATTENTION** : Cette méthode supprime toutes les données existantes !

### Option 2 : Base existante (recommandé)

Pour une base de données existante, utilisez le script PowerShell fourni :

```powershell
.\scripts\configure_database_size.ps1
```

Ce script :
1. Vérifie que le conteneur est en cours d'exécution
2. Affiche la configuration actuelle
3. Applique les nouveaux paramètres
4. Propose de redémarrer le conteneur si nécessaire

### Option 3 : Application manuelle

Si vous préférez appliquer manuellement :

```powershell
# 1. Copier le script dans le conteneur
docker cp backend\configure_postgres.sql main_courante_db:/tmp/configure.sql

# 2. Exécuter le script
docker exec main_courante_db psql -U maincourante -d main_courante -f /tmp/configure.sql

# 3. Redémarrer le conteneur pour appliquer tous les paramètres
docker restart main_courante_db
```

## 🔍 Vérifier la configuration

Pour vérifier que les paramètres ont été appliqués :

```powershell
# Vérifier les ressources allouées
docker stats main_courante_db

# Vérifier les paramètres PostgreSQL
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW max_connections;"
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW shared_buffers;"
docker exec main_courante_db psql -U maincourante -d main_courante -c "SHOW effective_cache_size;"
```

## 📊 Ajuster les valeurs

Si vous souhaitez ajuster les valeurs selon vos besoins :

### Modifier les ressources Docker

Éditez `docker-compose.yml` et modifiez les valeurs dans la section `deploy.resources` :

```yaml
deploy:
  resources:
    limits:
      cpus: '8'        # Augmenter selon vos besoins
      memory: 8G       # Augmenter selon votre RAM disponible
```

### Modifier les paramètres PostgreSQL

Éditez `backend/configure_postgres.sql` et ajustez les valeurs selon vos besoins.

**Formule recommandée pour la mémoire** :
- `shared_buffers` = 25% de la RAM allouée
- `effective_cache_size` = 75% de la RAM allouée
- `work_mem` = (RAM - shared_buffers) / (max_connections * 3)

## ⚠️ Notes importantes

1. **Redémarrage requis** : Certains paramètres (comme `shared_buffers`, `max_connections`) nécessitent un redémarrage de PostgreSQL pour être appliqués.

2. **Espace disque** : La taille du volume Docker (`postgres_data`) dépend de l'espace disque disponible sur votre machine. Pour augmenter l'espace disponible :
   - Libérez de l'espace sur votre disque
   - Ou déplacez le volume Docker vers un disque avec plus d'espace

3. **Performance** : Les valeurs proposées sont optimisées pour un système avec 4 Go de RAM alloués. Ajustez selon vos ressources disponibles.

4. **Sauvegarde** : Avant d'appliquer des modifications importantes, faites une sauvegarde :
   ```powershell
   .\scripts\backup.ps1
   ```

## 🐛 Dépannage

### Le conteneur ne démarre pas

Vérifiez les logs :
```powershell
docker logs main_courante_db
```

### Erreur "out of memory"

Réduisez les valeurs de mémoire dans `docker-compose.yml` ou `configure_postgres.sql`.

### Les paramètres ne s'appliquent pas

Assurez-vous d'avoir redémarré le conteneur :
```powershell
docker restart main_courante_db
```

## 📚 Ressources

- [Documentation PostgreSQL - Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
