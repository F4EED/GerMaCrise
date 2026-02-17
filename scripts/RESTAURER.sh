#!/bin/bash
# Script wrapper pour faciliter la restauration depuis RESTORE_SCRIPTS
# Ce script peut etre execute directement depuis le dossier RESTORE_SCRIPTS
# Usage: ./RESTAURER.sh [CHEMIN_DESTINATION]

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m'

# Obtenir le repertoire courant
CURRENT_DIR=$(pwd)

# Verifier qu'on est dans RESTORE_SCRIPTS ou dans la sauvegarde
BACKUP_PATH=""
if [[ "$CURRENT_DIR" == *"RESTORE_SCRIPTS"* ]]; then
    BACKUP_PATH=$(dirname "$CURRENT_DIR")
    echo -e "${GREEN}[INFO] Chemin de sauvegarde detecte: $BACKUP_PATH${NC}"
elif [ -f "$CURRENT_DIR/database_backup.sql" ]; then
    BACKUP_PATH="$CURRENT_DIR"
    echo -e "${GREEN}[INFO] Chemin de sauvegarde detecte: $BACKUP_PATH${NC}"
else
    echo -e "${RED}[ERREUR] Ce script doit etre execute depuis RESTORE_SCRIPTS ou le dossier de sauvegarde${NC}"
    echo -e "${YELLOW}Placez-vous dans le dossier RESTORE_SCRIPTS et relancez le script.${NC}"
    exit 1
fi

# Verifier que le fichier restore.sh existe (dans le meme dossier que ce script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESTORE_SCRIPT="$SCRIPT_DIR/restore.sh"
if [ ! -f "$RESTORE_SCRIPT" ]; then
    # Essayer dans le repertoire courant
    if [ -f "$CURRENT_DIR/restore.sh" ]; then
        RESTORE_SCRIPT="$CURRENT_DIR/restore.sh"
    else
        echo -e "${RED}[ERREUR] Le script restore.sh est introuvable${NC}"
        echo -e "${YELLOW}Assurez-vous que restore.sh est dans le meme dossier que RESTAURER.sh${NC}"
        exit 1
    fi
fi

# Obtenir le chemin de destination
DEST_PATH="$1"
if [ -z "$DEST_PATH" ]; then
    # Proposer un chemin par defaut
    DEFAULT_PATH="$HOME/main_courante"
    echo -e "\n${YELLOW}Ou voulez-vous restaurer le projet ?"
    echo -e "${GRAY}Appuyez sur Entree pour utiliser: $DEFAULT_PATH${NC}"
    read -p "Chemin de destination: " input_path
    
    if [ -z "$input_path" ]; then
        DEST_PATH="$DEFAULT_PATH"
    else
        DEST_PATH="$input_path"
    fi
fi

# Rendre le script executable
chmod +x "$RESTORE_SCRIPT"

# Executer le script de restauration
echo -e "\n${GREEN}[INFO] Lancement de la restauration...${NC}"
echo -e "${GRAY}Source: $BACKUP_PATH${NC}"
echo -e "${GRAY}Destination: $DEST_PATH${NC}"
echo ""

"$RESTORE_SCRIPT" "$BACKUP_PATH" "$DEST_PATH"

