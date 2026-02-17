# Documentation Générale - GerMaCrise V3

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Fonctionnement offline](#fonctionnement-offline)
4. [Service Worker et PWA (Progressive Web App)](#service-worker-et-pwa)
5. [Gestion des rôles et permissions](#gestion-des-rôles-et-permissions)
6. [Synchronisation avec base nationale](#synchronisation-avec-base-nationale)
7. [Cartographie et données géographiques](#cartographie-et-données-géographiques)
8. [Sécurité](#sécurité)
9. [Déploiement](#déploiement)
10. [Maintenance et évolutions](#maintenance-et-évolutions)

---

## Vue d'ensemble

**GerMaCrise V3** est un système de gestion de main courante informatique multi-utilisateur conçu pour la gestion de crises (climatiques, industrielles, transport, route) et les plans communaux/intercommunaux de sauvegarde (PICS).

### Objectifs principaux

- ✅ Gestion centralisée du personnel, des moyens et des véhicules
- ✅ Main courante avec engagement de ressources (personnel, moyens, véhicules)
- ✅ Recherche multi-critères pour toutes les ressources
- ✅ Suivi en temps réel des événements et crises
- ✅ Fonctionnement 100% offline (local)
- ✅ Synchronisation optionnelle vers base nationale
- ✅ Multi-utilisateur avec gestion fine des permissions
- ✅ Compatible Docker Intel et ARM
- ✅ Cartographie interactive avec recherche par département/commune
- ✅ Intégration PostgreSQL/PostGIS pour données géographiques

### Cas d'usage

- **Gestion de crise climatique** : Inondations, tempêtes, sécheresses
- **Gestion de crise industrielle** : Accidents industriels, pollutions
- **Gestion de crise transport** : Accidents de la route, incidents ferroviaires
- **Plans communaux de sauvegarde (PCS)** : Plans d'urgence municipaux
- **Plans intercommunaux de sauvegarde (PICS)** : Coordination intercommunale

---

## Architecture technique

### Stack technologique

#### Backend
- **Framework** : FastAPI (Python 3.11+)
- **ORM** : SQLAlchemy
- **Validation** : Pydantic
- **Authentification** : JWT (JSON Web Tokens)
- **Base de données** : PostgreSQL 16 + PostGIS 3.4
- **API** : RESTful avec documentation automatique (Swagger/OpenAPI)

#### Frontend
- **Framework** : React 18.2+ avec TypeScript
- **Routing** : React Router DOM
- **HTTP Client** : Axios
- **State Management** : React Context API
- **Build Tool** : Create React App (react-scripts)

#### Infrastructure
- **Containerisation** : Docker + Docker Compose
- **Architectures supportées** : Intel x86_64 et ARM (Raspberry Pi, etc.)
- **Réseau** : Bridge network Docker pour communication inter-conteneurs

### Structure du projet

```
.
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── models.py          # Modèles SQLAlchemy (tables)
│   │   ├── schemas.py         # Schémas Pydantic (validation)
│   │   ├── routers/           # Routes API par module
│   │   │   ├── auth.py       # Authentification
│   │   │   ├── users.py      # Gestion utilisateurs
│   │   │   ├── personnel.py # Gestion personnel
│   │   │   ├── moyens.py     # Gestion moyens
│   │   │   ├── vehicules.py # Gestion véhicules
│   │   │   ├── main_courante.py # Gestion main courante
│   │   │   ├── evenements.py # Gestion événements
│   │   │   ├── sync.py       # Synchronisation
│   │   │   └── ...
│   │   ├── auth.py           # Logique d'authentification
│   │   ├── database.py       # Configuration base de données
│   │   ├── main.py           # Point d'entrée FastAPI
│   │   └── sync.py           # Module de synchronisation
│   ├── scripts/              # Scripts utilitaires
│   │   ├── insert_*.py       # Scripts d'insertion données fictives
│   │   └── ...
│   ├── migrations/            # Migrations SQL
│   └── requirements.txt       # Dépendances Python
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── pages/            # Pages de l'application
│   │   ├── components/       # Composants réutilisables
│   │   ├── contexts/         # Contextes React (Auth, etc.)
│   │   ├── services/         # Services (API, etc.)
│   │   └── ...
│   ├── public/               # Fichiers statiques
│   └── package.json          # Dépendances Node.js
│
├── docker-compose.yml         # Configuration Docker Compose
├── README.md                  # Documentation principale
├── SCHEMA_DATABASE.md        # Schéma de la base de données
└── DOCUMENTATION_GENERALE.md # Ce fichier
```

---

## Fonctionnement offline

### Principe

L'application est conçue pour fonctionner **100% en local**, sans dépendance à des services externes ou à une connexion internet.

### Architecture locale

1. **Base de données locale** : PostgreSQL dans un conteneur Docker
   - Toutes les données sont stockées localement
   - Aucune connexion externe requise
   - Persistance via volumes Docker

2. **Backend local** : FastAPI dans un conteneur Docker
   - API REST accessible uniquement en local
   - Communication avec la base via réseau Docker interne
   - Pas de dépendance à des services cloud

3. **Frontend local** : React dans un conteneur Docker
   - Interface utilisateur accessible en local (localhost:3000)
   - Communication avec le backend via API locale
   - Pas de dépendance à des CDN externes (en production)

### Avantages

- ✅ **Autonomie totale** : Fonctionne même sans internet
- ✅ **Sécurité** : Données restent sur site
- ✅ **Performance** : Pas de latence réseau
- ✅ **Fiabilité** : Pas de dépendance à des services externes

### Limitations actuelles

- ⚠️ Le frontend dépend du backend : Si le backend Docker est arrêté, le frontend ne peut pas fonctionner
- ⚠️ Pas de cache des données côté frontend : Les données ne sont pas mises en cache localement
- ⚠️ Pas de Service Worker : Pas de PWA (Progressive Web App) pour un mode offline complet

### Améliorations prévues

Voir section [Service Worker et PWA](#service-worker-et-pwa) pour les améliorations prévues.

---

## Service Worker et PWA (Progressive Web App)

### Qu'est-ce qu'un Service Worker ?

Un **Service Worker** est un script JavaScript qui s'exécute en arrière-plan dans le navigateur, même quand la page est fermée. Il permet de :

- **Mettre en cache** des ressources (HTML, CSS, JS, images, données API)
- **Intercepter les requêtes réseau** pour servir depuis le cache si nécessaire
- **Fonctionner hors ligne** en servant les ressources mises en cache
- **Synchroniser les données** quand la connexion revient

### Qu'est-ce qu'une PWA (Progressive Web App) ?

Une **PWA** est une application web qui se comporte comme une application native :

- ✅ **Installable** sur l'appareil (icône sur l'écran d'accueil)
- ✅ **Fonctionne hors ligne** grâce au Service Worker
- ✅ **Peut recevoir des notifications push**
- ✅ **S'adapte aux mobiles/tablettes** (responsive design)
- ✅ **Expérience utilisateur native** (plein écran, pas de barre d'adresse)

### Avantages pour GerMaCrise V3

#### 1. Installation sur appareil mobile/tablette

L'application peut être installée comme une application native :
- Icône sur l'écran d'accueil
- Lancement comme une app native (plein écran)
- Pas besoin de passer par le navigateur

#### 2. Consultation des données hors ligne

- Les données (personnel, moyens, véhicules) sont mises en cache
- Consultation possible même sans internet
- Mise à jour automatique quand la connexion revient

#### 3. Création/modification hors ligne

- Création et modification de données stockées localement (IndexedDB)
- Synchronisation automatique avec le backend quand internet revient
- File d'attente des modifications en attente de synchronisation

#### 4. Usage terrain

**Scénario d'usage :**
1. Sur le terrain sans internet
2. Ouvrir l'application (installée sur la tablette)
3. Consulter la liste du personnel, des moyens, des véhicules (données en cache)
4. Créer/modifier des données (stockées localement)
5. Quand internet revient, les modifications se synchronisent automatiquement

### Implémentation prévue

#### 1. Service Worker

- **Cache des ressources statiques** : HTML, CSS, JS, images
- **Cache des données API** : Personnel, moyens, véhicules, événements
- **Stratégie de cache** : Cache First pour les ressources statiques, Network First pour les données API
- **Mise à jour automatique** : Vérification des mises à jour en arrière-plan

#### 2. IndexedDB

- **Stockage local des données** : Personnel, moyens, véhicules, événements
- **File d'attente des modifications** : Modifications en attente de synchronisation
- **Synchronisation automatique** : Synchronisation quand la connexion revient

#### 3. Manifest.json

- **Configuration PWA** : Nom, icône, couleurs, mode d'affichage
- **Installation** : Prompt d'installation sur mobile/tablette
- **Thème** : Couleurs et apparence personnalisées

#### 4. Notifications push (optionnel)

- **Notifications d'événements** : Alertes pour nouveaux événements
- **Notifications de synchronisation** : Confirmation de synchronisation réussie
- **Notifications d'erreurs** : Alertes en cas d'erreur de synchronisation

### Technologies utilisées

- **Workbox** : Bibliothèque pour Service Workers (Google)
- **IndexedDB** : Base de données côté client
- **Background Sync API** : Synchronisation en arrière-plan
- **Web App Manifest** : Configuration PWA

### État actuel

⚠️ **Non implémenté** : L'application n'est pas encore une PWA. Le Service Worker n'est pas configuré.

### Prochaines étapes

1. Configuration du Service Worker avec Workbox
2. Mise en place d'IndexedDB pour le cache des données
3. Création du manifest.json pour l'installation
4. Implémentation de la synchronisation automatique
5. Tests sur mobile/tablette

---

## Gestion des rôles et permissions

### Rôles disponibles

#### 1. Super Administrateur (`super_admin`)

**Permissions complètes :**
- ✅ Gestion de tous les utilisateurs (création, modification, désactivation)
- ✅ Gestion du personnel, moyens, véhicules
- ✅ Gestion des événements
- ✅ Configuration de l'application
- ✅ Accès à toutes les fonctionnalités

#### 2. Administrateur (`admin`)

**Permissions étendues :**
- ✅ Gestion du personnel, moyens, véhicules
- ✅ Gestion des événements
- ✅ Consultation des utilisateurs
- ❌ Pas de gestion des utilisateurs (réservé aux super_admin)

#### 3. Opérateur (`operateur`)

**Permissions opérationnelles :**
- ✅ Création et modification de personnel, moyens, véhicules
- ✅ Gestion des événements
- ✅ Consultation des données
- ❌ Pas de gestion des utilisateurs
- ❌ Pas d'accès à la configuration

#### 4. Utilisateur (`utilisateur`)

**Permissions de base :**
- ✅ Consultation du personnel, moyens, véhicules
- ✅ Consultation des événements
- ❌ Pas de création/modification (lecture seule)

### Matrice des permissions

| Fonctionnalité | Super Admin | Admin | Opérateur | Utilisateur |
|----------------|-------------|-------|-----------|-------------|
| Gestion utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Création personnel/moyens/véhicules | ✅ | ✅ | ✅ | ❌ |
| Modification personnel/moyens/véhicules | ✅ | ✅ | ✅ | ❌ |
| Suppression personnel/moyens/véhicules | ✅ | ✅ | ❌ | ❌ |
| Consultation données | ✅ | ✅ | ✅ | ✅ |
| Gestion événements | ✅ | ✅ | ✅ | ❌ |
| Configuration | ✅ | ❌ | ❌ | ❌ |

### Authentification

- **Méthode** : JWT (JSON Web Tokens)
- **Durée de validité** : 1440 minutes (24 heures)
- **Stockage** : localStorage côté frontend
- **Sécurité** : Tokens signés avec secret key

---

## Synchronisation avec base nationale

### Principe

La synchronisation est **optionnelle** et ne bloque pas l'utilisation de l'application. Elle permet d'envoyer les données vers une base de données nationale si internet est disponible.

### Fonctionnement

1. **Vérification de la connexion internet** : Test automatique de la connectivité
2. **Synchronisation manuelle** : L'utilisateur peut déclencher la synchronisation
3. **Synchronisation automatique** : Synchronisation périodique (optionnel)
4. **File d'attente** : Les modifications sont mises en file d'attente si pas d'internet

### Configuration

Variables d'environnement :
- `SYNC_ENABLED` : Activer/désactiver la synchronisation (default: `false`)
- `NATIONAL_SYNC_URL` : URL de l'API de synchronisation nationale
- `SYNC_API_KEY` : Clé API pour l'authentification (optionnel)

### Données synchronisées

Actuellement, seuls les **événements** sont synchronisés :
- Titre, description, type
- Dates de début et fin
- Localisation
- Statut et priorité

### API de synchronisation

- `POST /api/sync/evenements/{evenement_id}` : Synchroniser un événement spécifique
- `POST /api/sync/evenements/all` : Synchroniser tous les événements en attente
- `GET /api/sync/status` : Statut de la synchronisation

### Sécurité

- Authentification via clé API (Bearer token)
- HTTPS recommandé pour la communication
- Validation des données avant synchronisation

---

## Cartographie et données géographiques

### Vue d'ensemble

GerMaCrise V3 intègre une cartographie interactive basée sur **Leaflet** et **PostGIS** pour la visualisation et la recherche géographique.

### Fonctionnalités

#### 1. Recherche géographique

La cartographie (`cartoff3.html`) propose un menu de recherche dans la sidebar :

- **Recherche par département** :
  - Liste déroulante de tous les départements français
  - Zoom automatique sur le département sélectionné
  - Affichage temporaire du contour du département (8 secondes)

- **Recherche par commune** :
  - Liste déroulante des communes du département sélectionné
  - Zoom automatique sur la commune sélectionnée
  - Affichage temporaire du contour de la commune (8 secondes)

- **Recherche par adresse** (à venir) :
  - Recherche d'adresses via géocodage
  - Zoom automatique sur l'adresse trouvée

#### 2. Données géographiques

Les données géographiques sont stockées dans PostgreSQL avec PostGIS :

- **Table `departements`** :
  - Géométries MultiPolygon en Lambert 93 (SRID 2154)
  - Transformation automatique vers WGS84 (SRID 4326) pour l'API
  - Champs : `code_insee`, `nom`, `code_region`, `geom`

- **Table `communes`** :
  - Géométries MultiPolygon en Lambert 93 (SRID 2154)
  - Transformation automatique vers WGS84 (SRID 4326) pour l'API
  - Champs : `code_insee`, `nom`, `code_departement`, `code_region`, `geom`

#### 3. API géographique

Endpoints disponibles :

- `GET /api/geographie/departements` : Liste des départements
- `GET /api/geographie/departements/{code_insee}` : Département avec géométrie
- `GET /api/geographie/communes` : Liste des communes
- `GET /api/geographie/communes/{code_insee}` : Commune avec géométrie
- `GET /api/geographie/communes/departement/{code_departement}` : Communes d'un département

**Transformation automatique** :
- Détection automatique du SRID réel dans la base
- Transformation depuis Lambert 93 (2154) vers WGS84 (4326)
- Retour en format GeoJSON standard

#### 4. Intégration avec les activations

Lors de la création ou modification d'une activation :
- Sélection d'un département et d'une commune
- Ouverture automatique de la cartographie centrée sur la commune
- Passage du `code_commune` en paramètre URL (`?code_commune=XXXXX`)

### Technologies utilisées

- **Leaflet** : Bibliothèque JavaScript pour cartes interactives
- **PostGIS** : Extension PostgreSQL pour données géospatiales
- **PMTiles** : Format de tuiles pour cartes offline
- **Protomaps** : Rendu de cartes vectorielles

### Configuration

#### Service Nginx pour la cartographie

Un service nginx dédié sert la cartographie sur le port `3081` :

```yaml
cartographie:
  image: nginx:alpine
  ports:
    - "3081:80"
  volumes:
    - ./frontend/public/cartographie:/usr/share/nginx/html
    - ./nginx-cartographie.conf:/etc/nginx/conf.d/default.conf
```

**Optimisations** :
- Support HTTP Range Requests (essentiel pour PMTiles)
- Compression gzip
- Cache optimisé
- Headers CORS corrects

#### Accès à la cartographie

- **Depuis l'application React** : Lien dans le menu de navigation
- **Directement** : http://localhost:3081/cartoff3.html
- **Avec paramètre commune** : http://localhost:3081/cartoff3.html?code_commune=19014

### Limitations actuelles

- ⚠️ La recherche par adresse n'est pas encore implémentée
- ⚠️ Les données géographiques doivent être importées dans la base (voir `README_IMPORT_GEOJSON.md`)

### Améliorations prévues

1. **Recherche par adresse** : Géocodage d'adresses
2. **Recherche par coordonnées** : Saisie directe de coordonnées GPS
3. **Marqueurs personnalisés** : Ajout de marqueurs sur la carte
4. **Export de cartes** : Export en PDF ou image

---

## Sécurité

### Authentification

- **JWT** : Tokens signés avec secret key
- **Expiration** : Tokens valides 24 heures
- **Renouvellement** : Nouvelle connexion requise après expiration

### Autorisation

- **Rôles** : Gestion fine des permissions par rôle
- **Middleware** : Vérification des permissions sur chaque route
- **Protection CSRF** : Protection contre les attaques CSRF

### Données

- **Mots de passe** : Hashés avec bcrypt
- **Soft delete** : Pas de suppression physique (champ `actif`)
- **Validation** : Validation des données avec Pydantic
- **SQL Injection** : Protection via ORM SQLAlchemy

### Réseau

- **CORS** : Configuration restrictive (localhost uniquement en dev)
- **HTTPS** : Recommandé en production
- **Firewall** : Ports exposés uniquement si nécessaire

### Recommandations production

1. **Changer le SECRET_KEY** : Ne pas utiliser la valeur par défaut
2. **HTTPS** : Utiliser HTTPS pour toutes les communications
3. **Firewall** : Restreindre l'accès aux ports
4. **Backup** : Sauvegardes régulières de la base de données
5. **Monitoring** : Surveillance des logs et erreurs

---

## Déploiement

### Environnement de développement

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Environnement de production

#### Prérequis

- Docker et Docker Compose installés
- Ports disponibles : 3000 (frontend), 8000 (backend), 5432 (database)
- Au moins 2 Go de RAM disponible
- Espace disque : 10 Go minimum

#### Configuration

1. **Variables d'environnement** :
   - `SECRET_KEY` : Clé secrète pour JWT (générer une clé forte)
   - `SYNC_ENABLED` : Activer la synchronisation (optionnel)
   - `NATIONAL_SYNC_URL` : URL de l'API nationale (optionnel)

2. **Base de données** :
   - Volume Docker pour persistance
   - Backup régulier recommandé

3. **Sécurité** :
   - Changer les mots de passe par défaut
   - Configurer HTTPS (reverse proxy recommandé)
   - Restreindre l'accès réseau

#### Reverse Proxy (recommandé)

Utiliser Nginx ou Traefik comme reverse proxy :
- HTTPS/SSL
- Gestion des domaines
- Load balancing (si plusieurs instances)

### Compatibilité

- **Intel x86_64** : ✅ Supporté
- **ARM (Raspberry Pi, etc.)** : ✅ Supporté
- **Windows** : ✅ Supporté (Docker Desktop)
- **Linux** : ✅ Supporté
- **macOS** : ✅ Supporté (Docker Desktop)

---

## Maintenance et évolutions

### Sauvegardes

#### Base de données

```bash
# Sauvegarde complète
docker-compose exec db pg_dump -U maincourante main_courante > backup_$(date +%Y%m%d).sql

# Restauration
docker-compose exec -T db psql -U maincourante main_courante < backup_YYYYMMDD.sql
```

#### Volumes Docker

```bash
# Sauvegarde du volume
docker run --rm -v main_courante_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

### Migrations

Les migrations SQL sont dans `backend/migrations/` :
- Appliquer les migrations avant mise à jour
- Tester en environnement de développement d'abord

### Mises à jour

1. **Backup** : Sauvegarder la base de données
2. **Pull** : Récupérer les dernières modifications
3. **Rebuild** : Reconstruire les images Docker
4. **Migration** : Appliquer les migrations si nécessaire
5. **Restart** : Redémarrer les services

### Monitoring

- **Logs** : `docker-compose logs -f`
- **Santé** : `GET /health` endpoint
- **Base de données** : Vérifier les connexions actives

### Évolutions prévues

1. **PWA** : Implémentation du Service Worker et PWA
2. **Notifications** : Notifications push pour événements
3. **Cartographie** : ✅ Intégration de cartes interactives (PostGIS) - **IMPLÉMENTÉ**
   - Recherche géographique par département et commune
   - Zoom automatique sur départements et communes
   - Données géographiques depuis PostgreSQL/PostGIS
   - Transformation automatique Lambert 93 → WGS84
4. **Rapports** : Génération de rapports PDF
5. **Export** : Export des données (CSV, Excel)
6. **API mobile** : API optimisée pour applications mobiles natives

---

## Conclusion

GerMaCrise V3 est conçu pour être une solution robuste, sécurisée et évolutive pour la gestion de crises et la sécurité civile. Son architecture modulaire et son fonctionnement offline en font un outil adapté aux situations d'urgence où la connectivité peut être limitée.

Pour toute question ou contribution, consultez la documentation technique dans les autres fichiers du projet.

---

**Version** : 3.0.0  
**Dernière mise à jour** : Janvier 2025

