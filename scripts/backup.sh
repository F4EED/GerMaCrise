#!/bin/bash
# Script de sauvegarde complète du projet Main Courante
# Usage: ./scripts/backup.sh [CHEMIN_CLE_USB]
# Exemple: ./scripts/backup.sh /media/usb

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour obtenir le chemin de destination
get_destination_path() {
    if [ -n "$1" ]; then
        echo "$1"
    else
        echo -e "${CYAN}=== Sauvegarde du projet Main Courante ===" 
        echo -e "${YELLOW}Veuillez indiquer le chemin de votre clé USB (ex: /media/usb)"
        read -p "Chemin de destination: " path
        echo "$path"
    fi
}

DEST_PATH=$(get_destination_path "$1")
BACKUP_DIR="$DEST_PATH/main_courante_backup_$(date +%Y%m%d_%H%M%S)"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "\n${GREEN}Démarrage de la sauvegarde...${NC}"
echo -e "${CYAN}Destination: $BACKUP_DIR${NC}"

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}ATTENTION: Docker ne semble pas être en cours d'exécution.${NC}"
    echo -e "${YELLOW}La sauvegarde continuera mais la base de données pourrait ne pas être sauvegardée.${NC}"
fi

# Vérifier que le répertoire de destination existe
if [ ! -d "$DEST_PATH" ]; then
    echo -e "${RED}ERREUR: Le chemin de destination n'existe pas: $DEST_PATH${NC}"
    exit 1
fi

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Répertoire de sauvegarde créé: $BACKUP_DIR${NC}"

# 1. Sauvegarder la base de données
echo -e "\n${CYAN}1. Sauvegarde de la base de données...${NC}"
DB_BACKUP_FILE="$BACKUP_DIR/database_backup.sql"

if docker ps --format "{{.Names}}" | grep -q "^main_courante_db$"; then
    if docker exec main_courante_db pg_dump -U maincourante main_courante > "$DB_BACKUP_FILE"; then
        DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
        echo -e "   ${GREEN}[OK] Base de donnees sauvegardee ($DB_SIZE)${NC}"
    else
        echo -e "   ${RED}[ERREUR] Erreur lors de la sauvegarde de la base de donnees${NC}"
    fi
else
    echo -e "   ${YELLOW}[ATTENTION] Le conteneur de base de donnees n'est pas en cours d'execution${NC}"
    echo -e "   ${YELLOW}La sauvegarde de la base de donnees sera ignoree.${NC}"
fi

# 2. Copier tous les fichiers du projet (sauf node_modules, __pycache__, etc.)
echo -e "\n${CYAN}2. Copie des fichiers du projet...${NC}"

rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude 'env' \
    --exclude '.venv' \
    --exclude '.env' \
    --exclude 'build' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '.vscode' \
    --exclude '.idea' \
    --exclude '.DS_Store' \
    --exclude 'Thumbs.db' \
    --exclude '*.tmp' \
    --exclude '*.bak' \
    --exclude 'coverage' \
    --exclude '.nyc_output' \
    "$PROJECT_ROOT/" "$BACKUP_DIR/"

FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
echo -e "   ${GREEN}[OK] $FILE_COUNT fichiers copies${NC}"

# 3. Créer un fichier d'information sur la sauvegarde
echo -e "\n${CYAN}3. Création du fichier d'information...${NC}"
INFO_FILE="$BACKUP_DIR/BACKUP_INFO.txt"

cat > "$INFO_FILE" << EOF
SAUVEGARDE MAIN COURANTE
========================

Date de sauvegarde: $(date '+%Y-%m-%d %H:%M:%S')
Système: $(uname -s) $(uname -m)
Version Docker: $(docker --version 2>/dev/null || echo "N/A")
Version Docker Compose: $(docker-compose --version 2>/dev/null || echo "N/A")

CONTENU DE LA SAUVEGARDE:
- Code source complet (backend, frontend, scripts, etc.)
- Fichiers de configuration (docker-compose.yml, etc.)
- Documents stockés (backend/storage/documents/)
- Base de données (database_backup.sql)
- Fichiers JSON de configuration (json/)

INSTRUCTIONS DE RESTAURATION:

SOLUTION 1 - Restauration automatique (Recommandee):
1. Aller dans le dossier RESTORE_SCRIPTS/ de cette sauvegarde
2. Windows: Executer .\RESTAURER.ps1
3. Linux/Mac: Executer ./RESTAURER.sh (apres chmod +x)

SOLUTION 2 - Restauration avec chemins specifies:
1. Windows: .\restore.ps1 "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"
2. Linux/Mac: ./restore.sh "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"
3. Exemple: ./restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante

Voir RESTORE_SCRIPTS/README_RESTORE.md pour plus de details

IMPORTANT:
- Assurez-vous que Docker et Docker Compose sont installés sur le PC de destination
- Le projet doit être restauré dans un dossier nommé 'main_courante'
- Les ports 5433, 8000 et 3001 doivent être disponibles
EOF

echo -e "   ${GREEN}[OK] Fichier d'information cree${NC}"

# 4. Copier les scripts de restauration
echo -e "\n${CYAN}4. Copie des scripts de restauration...${NC}"
RESTORE_SCRIPTS_DIR="$BACKUP_DIR/RESTORE_SCRIPTS"
mkdir -p "$RESTORE_SCRIPTS_DIR"

# Copier les scripts de restauration
SCRIPTS_TO_COPY=("restore.ps1" "restore.sh" "RESTAURER.ps1" "RESTAURER.sh" "README_BACKUP.md" "README_RESTORE.md")

for script in "${SCRIPTS_TO_COPY[@]}"; do
    SOURCE_SCRIPT="$PROJECT_ROOT/scripts/$script"
    if [ -f "$SOURCE_SCRIPT" ]; then
        cp "$SOURCE_SCRIPT" "$RESTORE_SCRIPTS_DIR/"
        echo -e "   ${GREEN}[OK] $script copie${NC}"
    fi
done

# Créer un fichier README dans le dossier RESTORE_SCRIPTS
RESTORE_README="$RESTORE_SCRIPTS_DIR/LIRE_MOI.txt"
cat > "$RESTORE_README" << 'EOF'
SCRIPTS DE RESTAURATION
=======================

Ce dossier contient les scripts necessaires pour restaurer cette sauvegarde.

INSTRUCTIONS:

Pour Windows (PowerShell):
1. Ouvrez PowerShell en tant qu'administrateur
2. Naviguez vers ce dossier (RESTORE_SCRIPTS) dans la sauvegarde
3. Executez simplement: .\RESTAURER.ps1
   (Le script detectera automatiquement le chemin de sauvegarde)

Le script vous demandera:
- Le chemin de la sauvegarde (parent du dossier RESTORE_SCRIPTS)
- Le chemin de destination (ex: C:\main_courante)

Ou avec chemins complets:
.\restore.ps1 "CHEMIN_VERS_SAUVEGARDE" "C:\main_courante"

Pour Linux/Mac (Bash):
1. Ouvrez un terminal
2. Naviguez vers ce dossier (RESTORE_SCRIPTS) dans la sauvegarde
3. Rendez le script executable: chmod +x RESTAURER.sh
4. Executez simplement: ./RESTAURER.sh
   (Le script detectera automatiquement le chemin de sauvegarde)

Le script vous demandera:
- Le chemin de la sauvegarde (parent du dossier RESTORE_SCRIPTS)
- Le chemin de destination (ex: ~/main_courante)

Ou avec chemins complets:
./restore.sh "CHEMIN_VERS_SAUVEGARDE" ~/main_courante

IMPORTANT:
- Docker et Docker Compose doivent etre installes sur le PC de destination
- Les ports 5433, 8000 et 3001 doivent etre disponibles
- Le chemin de sauvegarde doit pointer vers le dossier principal de sauvegarde (pas RESTORE_SCRIPTS)
EOF

echo -e "   ${GREEN}[OK] Scripts de restauration copies${NC}"

# 5. Calculer la taille totale
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "\n${GREEN}=== Sauvegarde terminee avec succes ===${NC}"
echo -e "${CYAN}Taille totale: $TOTAL_SIZE${NC}"
echo -e "${CYAN}Emplacement: $BACKUP_DIR${NC}"
echo -e "\n${YELLOW}Vous pouvez maintenant copier ce dossier sur votre cle USB.${NC}"

