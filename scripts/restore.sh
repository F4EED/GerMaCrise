#!/bin/bash
# Script de restauration complète du projet Main Courante
# Usage: ./scripts/restore.sh [CHEMIN_SAUVEGARDE] [CHEMIN_DESTINATION]
# Exemple: ./scripts/restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Fonction pour obtenir le chemin de sauvegarde
get_backup_path() {
    if [ -n "$1" ]; then
        echo "$1"
    else
        # Détection automatique si exécuté depuis RESTORE_SCRIPTS
        CURRENT_DIR=$(pwd)
        if [[ "$CURRENT_DIR" == *"RESTORE_SCRIPTS"* ]]; then
            PARENT_PATH=$(dirname "$CURRENT_DIR")
            if [ -f "$PARENT_PATH/database_backup.sql" ]; then
                echo -e "${GREEN}[INFO] Chemin de sauvegarde detecte automatiquement: $PARENT_PATH${NC}"
                echo "$PARENT_PATH"
                return
            fi
        fi
        
        echo -e "${CYAN}=== Restauration du projet Main Courante ===" 
        echo -e "${YELLOW}Veuillez indiquer le chemin du dossier de sauvegarde"
        echo -e "${GRAY}Exemple: /media/usb/main_courante_backup_20240101_120000${NC}"
        echo -e "${GRAY}Astuce: Si vous etes dans RESTORE_SCRIPTS, le chemin parent sera utilise automatiquement${NC}"
        read -p "Chemin de sauvegarde: " path
        echo "$path"
    fi
}

# Fonction pour obtenir le chemin de destination
get_destination_path() {
    if [ -n "$2" ]; then
        echo "$2"
    else
        DEFAULT_PATH="$HOME/main_courante"
        echo -e "\n${YELLOW}Où voulez-vous restaurer le projet ?"
        echo -e "${GRAY}Appuyez sur Entrée pour utiliser: $DEFAULT_PATH${NC}"
        read -p "Chemin de destination: " path
        
        if [ -z "$path" ]; then
            echo "$DEFAULT_PATH"
        else
            echo "$path"
        fi
    fi
}

BACKUP_PATH=$(get_backup_path "$1")
DEST_PATH=$(get_destination_path "$1" "$2")

echo -e "\n${CYAN}=== Vérifications préalables ===${NC}"

# Vérifier que le dossier de sauvegarde existe
if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}ERREUR: Le dossier de sauvegarde n'existe pas: $BACKUP_PATH${NC}"
    exit 1
fi

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERREUR: Docker n'est pas installé${NC}"
    echo -e "${YELLOW}Veuillez installer Docker depuis: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Docker installe: $(docker --version)${NC}"

# Vérifier que Docker Compose est installé
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}ERREUR: Docker Compose n'est pas installé${NC}"
    exit 1
fi
COMPOSE_VER=$(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null)
echo -e "${GREEN}[OK] Docker Compose installe: ${COMPOSE_VER}${NC}"

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERREUR: Docker n'est pas en cours d'exécution${NC}"
    echo -e "${YELLOW}Veuillez démarrer Docker${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Docker est en cours d'execution${NC}"

# Avertissement si le dossier de destination existe déjà
if [ -d "$DEST_PATH" ]; then
    echo -e "\n${YELLOW}ATTENTION: Le dossier de destination existe déjà: $DEST_PATH${NC}"
    read -p "Souhaitez-vous le remplacer ? (O/N): " response
    if [[ ! "$response" =~ ^[OoYy]$ ]]; then
        echo -e "${RED}Restauration annulée.${NC}"
        exit 0
    fi
    echo -e "${YELLOW}Suppression de l'ancien dossier...${NC}"
    rm -rf "$DEST_PATH"
fi

echo -e "\n${CYAN}=== Début de la restauration ===${NC}"
echo -e "${CYAN}Source: $BACKUP_PATH${NC}"
echo -e "${CYAN}Destination: $DEST_PATH${NC}"
echo ""
echo -e "${GRAY}Utilisation:${NC}"
echo -e "  ./restore.sh [CHEMIN_SAUVEGARDE] [CHEMIN_DESTINATION]"
echo -e "  Exemple: ./restore.sh /media/usb/main_courante_backup_20240101_120000 ~/main_courante"
echo ""

# 1. Copier tous les fichiers du projet
echo -e "\n${CYAN}1. Copie des fichiers du projet...${NC}"

mkdir -p "$DEST_PATH"

# Utiliser rsync si disponible (plus efficace), sinon utiliser cp
if command -v rsync &> /dev/null; then
    echo -e "   ${GRAY}Copie avec rsync (plus rapide)...${NC}"
    rsync -av --progress \
        --exclude 'database_backup.sql' \
        --exclude 'RESTORE_SCRIPTS' \
        "$BACKUP_PATH/" "$DEST_PATH/"
else
    echo -e "   ${GRAY}Copie avec cp (rsync non disponible)...${NC}"
    # Utiliser find + cp pour exclure les fichiers/dossiers
    find "$BACKUP_PATH" -mindepth 1 -maxdepth 1 ! -name "database_backup.sql" ! -name "RESTORE_SCRIPTS" -exec cp -r {} "$DEST_PATH/" \;
fi

FILE_COUNT=$(find "$DEST_PATH" -type f | wc -l)
echo -e "   ${GREEN}[OK] $FILE_COUNT fichiers restaures${NC}"

# 2. Naviguer vers le dossier de destination
cd "$DEST_PATH"

# 3. Arrêter les conteneurs existants s'ils existent
echo -e "\n${CYAN}2. Arrêt des conteneurs existants...${NC}"
if docker compose down > /dev/null 2>&1 || docker-compose down > /dev/null 2>&1; then
    echo -e "   ${GREEN}[OK] Conteneurs arretes (s'ils existaient)${NC}"
else
    echo -e "   ${GRAY}[INFO] Aucun conteneur existant a arreter${NC}"
fi

# 4. Reconstruire et démarrer les conteneurs
echo -e "\n${CYAN}3. Construction et démarrage des conteneurs...${NC}"
echo -e "   ${GRAY}(Cela peut prendre plusieurs minutes la première fois...)${NC}"

# Démarrer d'abord la base de données
echo -e "   ${GRAY}Démarrage de la base de données...${NC}"
docker compose up -d db

# Attendre que la base de données soit prête
echo -e "   ${GRAY}Attente que la base de données soit prête...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0
DB_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DB_READY" = false ]; do
    sleep 2
    if docker exec main_courante_db pg_isready -U maincourante > /dev/null 2>&1; then
        DB_READY=true
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$DB_READY" = false ]; then
    echo -e "   ${YELLOW}[ATTENTION] La base de donnees prend plus de temps que prevu, continuation...${NC}"
else
    echo -e "   ${GREEN}[OK] Base de donnees prete${NC}"
fi

# Restaurer la base de données
DB_BACKUP_FILE="$BACKUP_PATH/database_backup.sql"
if [ -f "$DB_BACKUP_FILE" ]; then
    echo -e "\n${CYAN}4. Restauration de la base de données...${NC}"
    echo -e "   ${GRAY}(Cela peut prendre quelques minutes selon la taille de la base...)${NC}"
    
    # Supprimer la base de données existante et la recréer
    docker exec -i main_courante_db psql -U maincourante -d postgres -c "DROP DATABASE IF EXISTS main_courante;"
    docker exec -i main_courante_db psql -U maincourante -d postgres -c "CREATE DATABASE main_courante;"
    
    # Restaurer la sauvegarde
    cat "$DB_BACKUP_FILE" | docker exec -i main_courante_db psql -U maincourante -d main_courante
    
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}[OK] Base de donnees restauree${NC}"
    else
        echo -e "   ${YELLOW}[ATTENTION] Erreur lors de la restauration de la base de donnees${NC}"
    fi
else
    echo -e "\n${YELLOW}4. Aucune sauvegarde de base de donnees trouvee, initialisation standard...${NC}"
    docker compose run --rm backend python -m app.init_db 2>/dev/null || true
fi

# Démarrer tous les services
echo -e "\n${CYAN}5. Démarrage de tous les services...${NC}"
docker compose up -d

echo -e "   ${GREEN}[OK] Tous les services demarres${NC}"

echo -e "\n${GREEN}=== Restauration terminee avec succes ===${NC}"
echo -e "\n${CYAN}Projet restaure dans: $DEST_PATH${NC}"
echo -e "\n${CYAN}Acces a l'application:${NC}"
echo -e "   - Frontend: http://localhost:3001"
echo -e "   - Backend API: http://localhost:8000"
echo -e "   - API Docs: http://localhost:8000/docs"
echo -e "\n${CYAN}Commandes utiles:${NC}"
echo -e "   ${GRAY}cd $DEST_PATH${NC}"
echo -e "   ${GRAY}docker compose logs -f    # Voir les logs${NC}"
echo -e "   ${GRAY}docker compose down       # Arrêter les services${NC}"
echo -e "   ${GRAY}docker compose up -d      # Démarrer les services${NC}"

