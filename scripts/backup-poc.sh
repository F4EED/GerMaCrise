#!/bin/bash
# Script de sauvegarde optimisé pour POC (vérifie la présence de la table BAN)
# Usage: ./scripts/backup-poc.sh [CHEMIN_DESTINATION]
# Exemple: ./scripts/backup-poc.sh /media/usb

set -e

# Couleurs
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m'

# Fonction pour obtenir le chemin de destination
get_destination_path() {
    if [ -n "$1" ]; then
        echo "$1"
    else
        echo -e "${CYAN}=== Sauvegarde POC GerMaCrise ===" 
        echo -e "${YELLOW}Veuillez indiquer le chemin de destination (ex: /media/usb)"
        read -p "Chemin de destination: " path
        echo "$path"
    fi
}

DEST_PATH=$(get_destination_path "$1")
BACKUP_DIR="$DEST_PATH/germacrise_poc_backup_$(date +%Y%m%d_%H%M%S)"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "\n${GREEN}Démarrage de la sauvegarde POC...${NC}"
echo -e "${CYAN}Destination: $BACKUP_DIR${NC}"

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERREUR: Docker n'est pas en cours d'exécution.${NC}"
    echo -e "${YELLOW}La sauvegarde nécessite que la base de données soit démarrée.${NC}"
    exit 1
fi

# Vérifier que le répertoire de destination existe
if [ ! -d "$DEST_PATH" ]; then
    echo -e "${RED}ERREUR: Le chemin de destination n'existe pas: $DEST_PATH${NC}"
    exit 1
fi

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Répertoire de sauvegarde créé: $BACKUP_DIR${NC}"

# 1. Sauvegarder la base de données avec vérification BAN
echo -e "\n${CYAN}1. Sauvegarde de la base de données...${NC}"
DB_BACKUP_FILE="$BACKUP_DIR/database_backup.sql"

# Vérifier quel conteneur est en cours d'exécution
if docker ps --format "{{.Names}}" | grep -q "^germacrise_db$"; then
    CONTAINER_NAME="germacrise_db"
elif docker ps --format "{{.Names}}" | grep -q "^main_courante_db$"; then
    CONTAINER_NAME="main_courante_db"
else
    echo -e "   ${RED}[ERREUR] Le conteneur de base de données n'est pas en cours d'exécution${NC}"
    echo -e "   ${YELLOW}Lancez d'abord: docker compose up -d db${NC}"
    exit 1
fi

echo -e "   ${GRAY}[INFO] Conteneur trouvé: $CONTAINER_NAME${NC}"

# Vérifier la présence de la table BAN
echo -e "   ${GRAY}[INFO] Vérification de la table BAN...${NC}"
BAN_CHECK=$(docker exec $CONTAINER_NAME psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ban';" 2>/dev/null | tr -d ' ')

if [ "$BAN_CHECK" = "1" ]; then
    # Compter les adresses BAN
    BAN_ROWS=$(docker exec $CONTAINER_NAME psql -U maincourante -d main_courante -t -c "SELECT COUNT(*) FROM ban;" 2>/dev/null | tr -d ' ')
    echo -e "   ${GREEN}[OK] Table BAN trouvée avec $BAN_ROWS adresses${NC}"
else
    echo -e "   ${YELLOW}[ATTENTION] Table BAN non trouvée (sera créée lors de la restauration)${NC}"
fi

# Faire le dump complet
echo -e "   ${GRAY}[INFO] Export de la base de données...${NC}"
if docker exec $CONTAINER_NAME pg_dump -U maincourante main_courante > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo -e "   ${GREEN}[OK] Base de données sauvegardée ($DB_SIZE)${NC}"
    
    # Vérifier que le dump contient bien la table BAN
    if grep -q "CREATE TABLE.*ban\|COPY ban" "$DB_BACKUP_FILE"; then
        echo -e "   ${GREEN}[OK] Table BAN confirmée dans le dump${NC}"
    else
        echo -e "   ${YELLOW}[ATTENTION] Table BAN non trouvée dans le dump (peut être vide)${NC}"
    fi
else
    echo -e "   ${RED}[ERREUR] Erreur lors de la sauvegarde de la base de données${NC}"
    exit 1
fi

# 2. Copier les fichiers essentiels
echo -e "\n${CYAN}2. Copie des fichiers du projet...${NC}"

# Copier les fichiers essentiels
rsync -av --progress \
    --include 'backend/' \
    --include 'frontend/src/' \
    --include 'frontend/public/' \
    --include 'frontend/package.json' \
    --include 'frontend/tsconfig.json' \
    --include 'scripts/' \
    --include 'json/' \
    --include 'docker-compose.poc.yml' \
    --include 'docker-compose.yml' \
    --include 'env.example' \
    --include 'README.md' \
    --include 'README_POC.md' \
    --include 'QUICKSTART.md' \
    --exclude '*' \
    "$PROJECT_ROOT/" "$BACKUP_DIR/"

FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
echo -e "   ${GREEN}[OK] $FILE_COUNT fichiers copiés${NC}"

# 3. Créer un fichier d'information
echo -e "\n${CYAN}3. Création du fichier d'information...${NC}"
INFO_FILE="$BACKUP_DIR/BACKUP_INFO.txt"

cat > "$INFO_FILE" << EOF
SAUVEGARDE POC GERMACRISE
=========================

Date de sauvegarde: $(date '+%Y-%m-%d %H:%M:%S')
Système: $(uname -s) $(uname -m)
Version Docker: $(docker --version 2>/dev/null || echo "N/A")
Version Docker Compose: $(docker-compose --version 2>/dev/null || echo "N/A")

CONTENU DE LA SAUVEGARDE:
- Code source essentiel (backend, frontend, scripts)
- Fichiers de configuration (docker-compose.poc.yml, env.example)
- Base de données complète (database_backup.sql) avec TOUTES les tables
- Table BAN incluse (si présente dans la base source)
- Fichiers JSON de configuration (json/)

INSTRUCTIONS DE RESTAURATION:

1. Copier ce dossier sur la machine de destination
2. Démarrer Docker
3. Exécuter:
   docker compose -f docker-compose.poc.yml up -d db
   cat database_backup.sql | docker exec -i germacrise_db psql -U maincourante -d main_courante
   docker compose -f docker-compose.poc.yml up -d

OU utiliser les scripts de restauration standard:
   ./scripts/restore.sh "CHEMIN_SAUVEGARDE" "CHEMIN_DESTINATION"

IMPORTANT:
- Docker et Docker Compose doivent être installés
- Les ports 5433, 8000, 3000 doivent être disponibles
- La base de données sera complètement restaurée (toutes les tables + BAN)
EOF

echo -e "   ${GREEN}[OK] Fichier d'information créé${NC}"

# 4. Calculer la taille totale
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "\n${GREEN}=== Sauvegarde POC terminée avec succès ===${NC}"
echo -e "${CYAN}Taille totale: $TOTAL_SIZE${NC}"
echo -e "${CYAN}Emplacement: $BACKUP_DIR${NC}"
echo -e "\n${YELLOW}Cette sauvegarde contient:${NC}"
echo -e "  ${GREEN}✅ Base de données complète (toutes les tables)${NC}"
echo -e "  ${GREEN}✅ Table BAN (si présente)${NC}"
echo -e "  ${GREEN}✅ Code source essentiel${NC}"
echo -e "  ${GREEN}✅ Fichiers de configuration${NC}"
echo -e "\n${YELLOW}Vous pouvez maintenant copier ce dossier pour le partager.${NC}"
