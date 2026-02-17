# Guide de Restauration Rapide

## Solution 1 : Restauration automatique (Recommandée) ⭐

### Windows
```powershell
cd D:\main_courante_backup_20240101_120000\RESTORE_SCRIPTS
.\RESTAURER.ps1
```

### Linux/Mac
```bash
cd /media/usb/main_courante_backup_20240101_120000/RESTORE_SCRIPTS
chmod +x RESTAURER.sh
./RESTAURER.sh
```

**Avantages** :
- ✅ Détection automatique du chemin de sauvegarde
- ✅ Une seule commande
- ✅ Instructions claires et guidées

---

## Solution 2 : Restauration avec chemins spécifiés

### Windows
```powershell
.\restore.ps1 "E:\backup\main_courante_backup_20240101_120000" "C:\main_courante"
```

### Linux/Mac
```bash
./restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante
```

**Avantages** :
- ✅ Contrôle total sur les chemins
- ✅ Idéal pour scripts et automatisation
- ✅ Pas de questions interactives

### Paramètres

1. **CHEMIN_SAUVEGARDE** : Chemin complet vers le dossier de sauvegarde
   - Exemple Windows: `E:\main_courante_backup_20240101_120000`
   - Exemple Linux: `/media/usb/main_courante_backup_20240101_120000`

2. **CHEMIN_DESTINATION** : Chemin où restaurer le projet
   - Exemple Windows: `C:\main_courante`
   - Exemple Linux: `~/main_courante` ou `/opt/main_courante`

---

## Comparaison des solutions

| Caractéristique | Solution 1 (RESTAURER) | Solution 2 (restore.ps1/sh) |
|----------------|------------------------|----------------------------|
| Détection auto | ✅ Oui | ❌ Non |
| Chemins manuels | ✅ Possible | ✅ Requis |
| Interactif | ✅ Oui | ❌ Non (si chemins fournis) |
| Automatisation | ⚠️ Limitée | ✅ Parfaite |
| Simplicité | ⭐⭐⭐ | ⭐⭐ |

---

## Exemples d'utilisation avancée

### Script batch Windows
```batch
@echo off
set BACKUP_PATH=E:\backup\main_courante_backup_20240101_120000
set DEST_PATH=C:\main_courante
powershell -ExecutionPolicy Bypass -File "restore.ps1" "%BACKUP_PATH%" "%DEST_PATH%"
```

### Script bash Linux
```bash
#!/bin/bash
BACKUP_PATH="/media/usb/main_courante_backup_20240101_120000"
DEST_PATH="$HOME/main_courante"
./restore.sh "$BACKUP_PATH" "$DEST_PATH"
```

---

## Dépannage

### Erreur "Chemin non trouvé"
- Vérifiez que le chemin de sauvegarde contient `database_backup.sql`
- Utilisez des chemins absolus plutôt que relatifs
- Sur Windows, utilisez des guillemets pour les chemins avec espaces

### Erreur de permissions
- Windows: Exécutez PowerShell en tant qu'administrateur
- Linux: Utilisez `sudo` si nécessaire et `chmod +x` sur les scripts

### Restauration longue
- C'est normal pour de grandes bases de données
- Surveillez les logs avec: `docker compose logs -f`

