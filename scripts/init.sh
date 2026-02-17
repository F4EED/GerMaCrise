#!/bin/bash

# Script d'initialisation du projet Main Courante

echo "Initialisation du projet Main Courante..."

# Verifier que Docker est installe
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installe. Veuillez l'installer d'abord."
    exit 1
fi

# Verifier que Docker Compose est installe
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installe. Veuillez l'installer d'abord."
    exit 1
fi

# Demarrer les services
echo "Demarrage des services Docker..."
docker compose up -d db

# Attendre que la base de donnees soit prete
echo "Attente de la base de donnees..."
sleep 10

# Initialiser la base de donnees
echo "Initialisation de la base de donnees..."
docker compose run --rm backend python -m app.init_db

# Demarrer tous les services
echo "Demarrage de tous les services..."
docker compose up -d

echo "Initialisation terminee!"
echo ""
echo "Informations de connexion:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "Compte administrateur par defaut:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   IMPORTANT: Changez le mot de passe apres la premiere connexion!"
echo ""
echo "Pour arreter les services: docker compose down"
echo "Pour voir les logs: docker compose logs -f"
