# Import des Départements BAN Manquants

Ce dossier contient les scripts pour importer automatiquement les départements manquants de la Base Adresse Nationale (BAN) dans la table `ban` de la base de données.

## 📋 Prérequis

1. **Docker** doit être démarré avec les conteneurs `main_courante_db` et `main_courante_backend` en cours d'exécution
2. **Python** doit être installé et accessible dans le PATH
3. Le répertoire `C:\Users\Admin\Documents\Export BAN` doit contenir les fichiers GeoJSON BAN (format: `BAN_XX.geojson`)

## 🚀 Utilisation

### Option 1: Script PowerShell (Recommandé)

Le script PowerShell automatise tout le processus :

```powershell
.\scripts\import_ban_departements_manquants.ps1
```

Ce script :
- ✅ Vérifie que le répertoire source existe
- ✅ Vérifie la connexion à la base de données
- ✅ Identifie automatiquement les départements manquants
- ✅ Importe tous les départements manquants
- ✅ Affiche le nombre de départements restants au fur et à mesure

### Option 2: Script Python Direct

Pour exécuter directement le script Python :

```powershell
python backend\scripts\import_ban_departements_manquants_windows.py --yes
```

### Vérifier les Départements Manquants

Pour vérifier quels départements sont manquants sans importer :

```powershell
.\scripts\verifier_departements_ban_manquants.ps1
```

Ce script affiche :
- 📊 Le nombre de départements présents dans la base
- 📁 Le nombre de fichiers GeoJSON disponibles
- ⚠️ La liste des départements manquants
- 📦 La taille totale des fichiers manquants
- 📊 Le total d'adresses dans la base

## 📊 Suivi de l'Import

Pendant l'import, le script affiche :
- La progression globale (X/Y départements)
- Le nombre de départements importés avec succès
- Le nombre de départements échoués
- **Le nombre de départements restants à importer** (mis à jour après chaque import)

## 🔧 Configuration

### Répertoire Source

Par défaut, le script utilise : `C:\Users\Admin\Documents\Export BAN`

Pour utiliser un autre répertoire, modifiez la variable `BAN_EXPORT_DIR` dans le script Python ou passez-le en argument :

```powershell
python backend\scripts\import_ban_departements_manquants_windows.py "C:\Autre\Chemin\Export BAN" --yes
```

### Base de Données

Le script se connecte à la base de données Docker via :
- **Host**: localhost
- **Port**: 5433
- **Database**: main_courante
- **User**: maincourante
- **Password**: maincourante_pass

Ces paramètres sont définis dans `DB_CONFIG` du script Python.

## 📝 Format des Fichiers

Les fichiers GeoJSON doivent être nommés selon le format :
- `BAN_01.geojson` (Ain)
- `BAN_02.geojson` (Aisne)
- `BAN_2A.geojson` (Corse-du-Sud)
- `BAN_2B.geojson` (Haute-Corse)
- etc.

## ⚠️ Notes Importantes

1. **Mode Ajout** : Le script importe en mode ajout, les données existantes sont conservées
2. **Transformation Automatique** : Les coordonnées sont automatiquement transformées en WGS84 (EPSG:4326) si nécessaire
3. **Import par Lots** : Les adresses sont importées par lots de 1000 pour optimiser les performances
4. **Progression** : La progression est affichée pour chaque département et globalement

## 🐛 Dépannage

### Erreur de connexion à la base de données

Vérifiez que Docker est démarré :
```powershell
docker ps
```

Vérifiez que les conteneurs sont en cours d'exécution :
```powershell
docker ps | Select-String "main_courante"
```

### Fichiers non trouvés

Vérifiez que le répertoire existe :
```powershell
Test-Path "C:\Users\Admin\Documents\Export BAN"
```

### Python non trouvé

Vérifiez que Python est installé :
```powershell
python --version
```

## 📈 Statistiques

Après l'import, le script affiche :
- ✅ Nombre de départements importés avec succès
- ❌ Nombre de départements échoués (si applicable)
- 📍 Nombre total d'adresses importées
- ⚠️ Nombre d'adresses ignorées (si applicable)
- 📊 Total d'adresses dans la base
- ⚠️ Nombre de départements restants à importer
