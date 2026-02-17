# 🐟 POISSON ROUGE - Mémoire rapide

## 🚀 Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## 🔐 Identifiants par défaut

- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Changez le mot de passe après la première connexion !**

## 📋 Commandes utiles

### Démarrer l'application
```powershell
docker-compose up -d
```

### Arrêter l'application
```powershell
docker-compose down
```

### Voir les logs
```powershell
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Redémarrer un service
```powershell
docker-compose restart backend
docker-compose restart frontend
```

### Voir l'état des services
```powershell
docker-compose ps
```

### Reconstruire après modification
```powershell
docker-compose build backend
docker-compose up -d
```

### Réinitialiser la base de données
```powershell
docker-compose run --rm backend python -m app.init_db
```

### Accéder au shell du backend
```powershell
docker-compose exec backend bash
```

### Accéder à la base de données
```powershell
docker-compose exec db psql -U maincourante -d main_courante
```

## 🆘 En cas de problème

### Tout réinitialiser
```powershell
docker-compose down -v
docker-compose up -d db
# Attendre 15 secondes
docker-compose run --rm backend python -m app.init_db
docker-compose up -d
```

### Vérifier que les ports sont libres
- Port 3000 : Frontend
- Port 8000 : Backend
- Port 5432 : Base de données

