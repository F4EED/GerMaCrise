#!/bin/bash
# Script pour construire les images Docker multi-architecture (amd64/arm64)

set -e

echo "🔨 Construction des images multi-architecture..."

# Créer un builder multi-arch si nécessaire
if ! docker buildx ls | grep -q multiarch-builder; then
    echo "📦 Création du builder multi-architecture..."
    docker buildx create --name multiarch-builder --use
    docker buildx inspect --bootstrap
fi

# Activer le builder
docker buildx use multiarch-builder

# Construire et pousser les images pour les deux architectures
echo "🏗️  Construction de l'image backend (amd64 + arm64)..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file backend/Dockerfile.multiarch \
    --tag maincourante/backend:latest \
    --tag maincourante/backend:v3.0.0 \
    --push \
    ./backend

echo "🏗️  Construction de l'image frontend (amd64 + arm64)..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file frontend/Dockerfile.multiarch \
    --tag maincourante/frontend:latest \
    --tag maincourante/frontend:v3.0.0 \
    --push \
    ./frontend

echo "✅ Images multi-architecture construites avec succès!"
echo "📋 Pour tester localement:"
echo "   Backend: docker buildx build --platform linux/amd64 --load -t maincourante/backend:latest ./backend"
echo "   Frontend: docker buildx build --platform linux/amd64 --load -t maincourante/frontend:latest ./frontend"

