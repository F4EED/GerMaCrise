# Guide de maintenance

## Commandes utiles

### Docker

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Reconstruire les images
docker-compose build --no-cache

# Accéder au shell du backend
docker-compose exec backend bash

# Accéder à la base de données
docker-compose exec db psql -U maincourante -d main_courante
```

### Base de données

```bash
# Initialiser la base de données (créer l'admin)
docker-compose run --rm backend python -m app.init_db

# Créer une migration Alembic (si utilisé)
docker-compose run --rm backend alembic revision --autogenerate -m "description"

# Appliquer les migrations
docker-compose run --rm backend alembic upgrade head
```

### Développement

```bash
# Backend en mode développement
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend en mode développement
cd frontend
npm install
npm start
```

## Sauvegarde de la base de données

```bash
# Sauvegarder
docker-compose exec db pg_dump -U maincourante main_courante > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer
docker-compose exec -T db psql -U maincourante main_courante < backup.sql
```

## Synchronisation

La synchronisation avec la base nationale est optionnelle et fonctionne uniquement si :
1. `SYNC_ENABLED=true` dans les variables d'environnement
2. Une connexion internet est disponible
3. `NATIONAL_SYNC_URL` est configuré

Pour synchroniser manuellement :
```bash
# Via l'API (nécessite un token admin)
curl -X POST http://localhost:8000/api/sync/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Mise à jour

```bash
# Arrêter les services
docker-compose down

# Mettre à jour le code
git pull  # si vous utilisez git

# Reconstruire les images
docker-compose build

# Redémarrer
docker-compose up -d
```

