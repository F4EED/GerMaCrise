# Scripts de Sauvegarde et Restauration

Ces scripts permettent de sauvegarder et restaurer complètement le projet Main Courante, incluant le code source et la base de données.

## 🔄 Compatibilité cross-platform

✅ **Vous pouvez sauvegarder sous Windows et restaurer sous Linux (et vice-versa) !**

- Sauvegarde Windows → Restauration Linux : Utilisez `backup.ps1` puis `restore.sh`
- Sauvegarde Linux → Restauration Windows : Utilisez `backup.sh` puis `restore.ps1`

## 📦 Sauvegarde

### Windows (PowerShell)

```powershell
# Avec chemin spécifié
.\scripts\backup.ps1 E:\

# Le script demandera le chemin
.\scripts\backup.ps1
```

### Linux/Mac (Bash)

```bash
# Rendre exécutable (première fois)
chmod +x scripts/backup.sh

# Avec chemin spécifié
./scripts/backup.sh /media/usb

# Le script demandera le chemin
./scripts/backup.sh
```

**Résultat** : Un dossier `main_courante_backup_YYYYMMDD_HHMMSS` sera créé sur votre clé USB.

## 🔄 Restauration

### Windows (PowerShell)

```powershell
# Avec chemins spécifiés
.\scripts\restore.ps1 E:\main_courante_backup_20240101_120000 C:\main_courante

# Le script demandera les chemins
.\scripts\restore.ps1
```

### Linux/Mac (Bash)

```bash
# Rendre exécutable (première fois)
chmod +x scripts/restore.sh

# Avec chemins spécifiés
./scripts/restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante

# Le script demandera les chemins
./scripts/restore.sh
```

## 📖 Documentation complète

Pour plus de détails, consultez le guide complet : [GUIDE_SAUVEGARDE_RESTAURATION.md](../GUIDE_SAUVEGARDE_RESTAURATION.md)

## ⚡ Résumé rapide

1. **Sauvegarde** : Exécutez `backup.ps1` ou `backup.sh` → Copiez le dossier créé sur votre clé USB
2. **Restauration** : Copiez le dossier de sauvegarde sur le nouveau PC → Exécutez `restore.ps1` ou `restore.sh`

C'est tout ! 🎉

