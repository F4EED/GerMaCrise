# Guide de démarrage rapide

## 🚀 Démarrage en 3 étapes

### 1. Initialiser le projet

**Windows (PowerShell):**
```powershell
.\scripts\init.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/init.sh
./scripts/init.sh
```

### 2. Accéder à l'application

Une fois l'initialisation terminée, ouvrez votre navigateur :

- **Interface web** : http://localhost:3000
- **Cartographie** : http://localhost:3081/cartoff3.html
- **Documentation API** : http://localhost:8000/docs

### 3. Se connecter

Utilisez les identifiants par défaut :
- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Important** : Changez immédiatement le mot de passe après la première connexion !

## 📋 Fonctionnalités disponibles

### Pour tous les utilisateurs
- ✅ Consultation des événements
- ✅ Consultation du personnel, moyens et véhicules
- ✅ Création d'événements
- ✅ Cartographie interactive avec recherche par département/commune

### Pour les administrateurs
- ✅ Gestion complète du personnel
- ✅ Gestion des moyens et véhicules
- ✅ Gestion des utilisateurs
- ✅ Synchronisation avec la base nationale (si configurée)

### Pour les super administrateurs
- ✅ Toutes les fonctionnalités administrateur
- ✅ Suppression d'utilisateurs
- ✅ Configuration système

## 🔧 Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Arrêter les services
docker-compose down

# Redémarrer les services
docker-compose restart

# Reconstruire après modification du code
docker-compose build
docker-compose up -d
```

## 🐛 Dépannage

### Le frontend ne se charge pas
```bash
docker-compose logs frontend
```

### Le backend ne répond pas
```bash
docker-compose logs backend
```

### La base de données ne démarre pas
```bash
docker-compose down
docker volume rm main_courante_postgres_data
docker-compose up -d db
docker-compose run --rm backend python -m app.init_db
```

### Réinitialiser complètement
```bash
docker-compose down -v
docker-compose up -d db
sleep 10
docker-compose run --rm backend python -m app.init_db
docker-compose up -d
```

## 📚 Documentation

- Voir `README.md` pour plus de détails
- Voir `MAINTENANCE.md` pour la maintenance
- API Docs : http://localhost:8000/docs (interactif)

## 🔐 Sécurité

1. Changez le mot de passe admin par défaut
2. Configurez un `SECRET_KEY` fort dans les variables d'environnement
3. En production, utilisez HTTPS
4. Configurez les règles de pare-feu appropriées

