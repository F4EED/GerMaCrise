# Proposition de Structure - Table Main Courante

## Vue d'ensemble

La main courante est un journal chronologique des événements liés à une activation. Chaque entrée est associée à une activation et à l'utilisateur qui l'a créée.

## Structure de la table `main_courante`

```sql
CREATE TABLE IF NOT EXISTS main_courante (
    id SERIAL PRIMARY KEY,
    
    -- Liaison avec l'activation (OBLIGATOIRE)
    activation_id INTEGER NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
    
    -- Utilisateur qui a créé l'entrée (OBLIGATOIRE)
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    
    -- Date et heure de l'événement (peut être différente de created_at)
    date_heure TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contenu de l'entrée (OBLIGATOIRE)
    contenu TEXT NOT NULL,
    
    -- Type d'entrée (optionnel) - liste prédéfinie ou libre
    type_entree VARCHAR(100),  -- Ex: "information", "action", "alerte", "decision", "contact", ou libre
    
    -- Pièces jointes : références vers les documents (JSON array d'IDs)
    pieces_jointes TEXT,  -- JSON array: [1, 2, 3] (IDs des documents de la table documents)
    
    -- Tags ou mots-clés (optionnel)
    tags TEXT,  -- JSON array de tags: ["urgent", "personnel", "moyens"]
    
    -- État de l'entrée (Valide par défaut, erreur de saisie)
    etat VARCHAR(50) DEFAULT 'Valide',  -- 'Valide' ou 'erreur de saisie'
    
    -- Timestamps standards
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Contrainte : une entrée doit avoir un contenu
    CONSTRAINT chk_contenu_non_vide CHECK (LENGTH(TRIM(contenu)) > 0)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_main_courante_activation ON main_courante(activation_id);
CREATE INDEX IF NOT EXISTS idx_main_courante_utilisateur ON main_courante(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_main_courante_date_heure ON main_courante(date_heure);
CREATE INDEX IF NOT EXISTS idx_main_courante_created_at ON main_courante(created_at);
CREATE INDEX IF NOT EXISTS idx_main_courante_type ON main_courante(type_entree);
CREATE INDEX IF NOT EXISTS idx_main_courante_etat ON main_courante(etat);

-- Index composite pour les requêtes fréquentes (ordre de saisie)
CREATE INDEX IF NOT EXISTS idx_main_courante_activation_created ON main_courante(activation_id, created_at);
```

## Champs détaillés

### Champs obligatoires

1. **`activation_id`** (INTEGER, NOT NULL)
   - Référence vers la table `activations`
   - Lié à l'activation sélectionnée via le contexte
   - CASCADE DELETE : si une activation est supprimée, ses entrées de main courante le sont aussi

2. **`utilisateur_id`** (INTEGER, NOT NULL)
   - Référence vers la table `utilisateurs`
   - Identifie qui a créé l'entrée
   - Permet d'afficher le nom de l'utilisateur dans chaque saisie

3. **`date_heure`** (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - Date et heure de l'événement décrit dans l'entrée
   - Peut être différente de `created_at` (ex: saisie rétroactive)
   - Par défaut : NOW()

4. **`contenu`** (TEXT, NOT NULL)
   - Le texte de l'entrée de main courante
   - Contrainte : ne peut pas être vide

### Champs optionnels

5. **`type_entree`** (VARCHAR(100))
   - Catégorie de l'entrée pour faciliter le filtrage
   - **Liste prédéfinie OU saisie libre**
   - Exemples prédéfinis : "information", "action", "alerte", "decision", "contact", "intervention", "retour"
   - Possibilité de saisir un type personnalisé

6. **`pieces_jointes`** (TEXT)
   - JSON array contenant les IDs des documents de la table `documents`
   - Format : `[1, 2, 3]` (références vers documents.id)
   - Intégration avec le système de gestion documentaire existant

7. **`tags`** (TEXT)
   - JSON array de tags/mots-clés
   - Format : `["urgent", "personnel", "moyens"]`

8. **`etat`** (VARCHAR(50), DEFAULT 'Valide')
   - État de l'entrée
   - Valeurs : "Valide" (par défaut) ou "erreur de saisie"
   - **Seul champ modifiable après création**

### Timestamps

9. **`created_at`** (TIMESTAMP WITH TIME ZONE)
   - Date de création de l'entrée dans le système
   - Automatique : NOW()

10. **`updated_at`** (TIMESTAMP WITH TIME ZONE)
    - Date de dernière modification
    - Automatique : mis à jour lors des modifications

## Relations

```
main_courante
├── activation_id → activations.id (CASCADE DELETE)
├── utilisateur_id → utilisateurs.id
├── personnel_main_courante → personnel (via table de liaison)
├── moyens_main_courante → moyens (via table de liaison)
└── vehicules_main_courante → vehicules (via table de liaison)
```

### Tables de liaison

#### `personnel_main_courante`
Liaison entre le personnel et les entrées de main courante. Permet d'engager du personnel pour une entrée spécifique.

**Champs :**
- `main_courante_id` : Référence vers l'entrée de main courante
- `personnel_id` : Référence vers le personnel engagé
- `statut` : Statut du personnel pour cette affectation (engage par défaut)
- `date_affectation` : Date et heure d'affectation
- `date_liberation` : Date et heure de libération (optionnel)

#### `moyens_main_courante`
Liaison entre les moyens et les entrées de main courante. Permet d'engager des moyens pour une entrée spécifique.

**Champs :**
- `main_courante_id` : Référence vers l'entrée de main courante
- `moyen_id` : Référence vers le moyen engagé
- `date_affectation` : Date et heure d'affectation
- `date_liberation` : Date et heure de libération (optionnel)

#### `vehicules_main_courante`
Liaison entre les véhicules et les entrées de main courante. Permet d'engager des véhicules pour une entrée spécifique.

**Champs :**
- `main_courante_id` : Référence vers l'entrée de main courante
- `vehicule_id` : Référence vers le véhicule engagé
- `date_affectation` : Date et heure d'affectation
- `date_liberation` : Date et heure de libération (optionnel)

## Exemples d'utilisation

### Exemple 1 : Entrée simple
```json
{
  "activation_id": 1,
  "utilisateur_id": 5,
  "date_heure": "2025-12-24T14:30:00Z",
  "contenu": "Arrivée sur les lieux. Début de l'évaluation de la situation.",
  "type_entree": "information"
}
```

### Exemple 2 : Entrée avec pièces jointes
```json
{
  "activation_id": 1,
  "utilisateur_id": 5,
  "date_heure": "2025-12-24T15:00:00Z",
  "contenu": "Photo de la zone sinistrée prise et envoyée au PC.",
  "type_entree": "action",
  "pieces_jointes": "[\"/storage/photos/zone_sinistree_001.jpg\"]",
  "tags": "[\"photo\", \"urgence\"]"
}
```

### Exemple 3 : Entrée de décision avec personnel engagé
```json
{
  "activation_id": 1,
  "utilisateur_id": 3,
  "date_heure": "2025-12-24T15:30:00Z",
  "contenu": "Décision d'évacuer la zone nord. Mobilisation de 2 équipes.",
  "type_entree": "decision",
  "tags": "[\"decision\", \"evacuation\", \"personnel\"]",
  "personnel_ids": [1, 2, 3]
}
```

### Exemple 4 : Entrée avec moyens et véhicules engagés
```json
{
  "activation_id": 1,
  "utilisateur_id": 5,
  "date_heure": "2025-12-24T16:00:00Z",
  "contenu": "Déploiement de matériel d'éclairage et d'un véhicule de transport.",
  "type_entree": "action",
  "tags": "[\"moyens\", \"véhicules\", \"déploiement\"]",
  "moyens_ids": [1, 2],
  "vehicules_ids": [1]
}
```

### Exemple 5 : Entrée complète avec personnel, moyens et véhicules
```json
{
  "activation_id": 1,
  "utilisateur_id": 5,
  "date_heure": "2025-12-24T16:30:00Z",
  "contenu": "Intervention complète : équipe de 3 personnes, matériel d'éclairage et véhicule VSAV.",
  "type_entree": "intervention",
  "tags": "[\"intervention\", \"personnel\", \"moyens\", \"véhicules\"]",
  "personnel_ids": [1, 2, 3],
  "moyens_ids": [1, 2, 3],
  "vehicules_ids": [1, 2]
}
```

## Affichage dans l'interface

Chaque entrée affichera :
- **Date et heure** : formatée de manière lisible
- **Auteur** : nom de l'utilisateur (via la relation utilisateur_id)
- **Contenu** : texte de l'entrée
- **Type** : badge coloré selon le type
- **Tags** : affichés comme badges
- **Personnel engagé** : liste des personnes engagées avec leurs informations (matricule, nom, fonction, service)
- **Moyens engagés** : liste des moyens engagés avec leurs informations (code, nom, catégorie, statut)
- **Véhicules engagés** : liste des véhicules engagés avec leurs informations (immatriculation, type, marque, modèle)
- **Actions** : modifier, supprimer (selon les permissions)

## Filtres et recherche

- Par activation (automatique si une activation est sélectionnée)
- Par utilisateur
- Par type d'entrée
- Par date/heure
- Par tags
- Recherche textuelle dans le contenu
- Par personnel engagé
- Par moyens engagés
- Par véhicules engagés

## Engagement de ressources

Lors de la création d'une entrée de main courante, il est possible d'engager :

1. **Personnel** : Sélection de personnel disponible avec recherche multi-critères (matricule, nom, prénom, fonction, service)
   - Le statut du personnel est automatiquement mis à jour à "engagé"
   - Possibilité de créer un nouveau personnel directement depuis le formulaire

2. **Moyens** : Sélection de moyens disponibles avec recherche multi-critères (code, nom, catégorie)
   - Filtrage automatique des moyens disponibles (statut : Disponible, Opérationnel, En prêt)

3. **Véhicules** : Sélection de véhicules disponibles avec recherche multi-critères (immatriculation, type, marque)
   - Filtrage automatique des véhicules disponibles (statut : disponible)

Toutes les ressources engagées sont liées à l'entrée de main courante et peuvent être consultées ultérieurement.

## Permissions

- **Lecture** : Tous les utilisateurs authentifiés peuvent voir les entrées
- **Création** : Tous les utilisateurs authentifiés peuvent créer des entrées
- **Modification** : **AUCUNE** (sauf le champ `etat` qui peut être changé)
- **Suppression** : Réservée aux administrateurs (super_admin, admin)

## Règles de gestion

1. **Immuabilité** : Les entrées ne peuvent **PAS** être modifiées après création (sauf l'état)
2. **État modifiable** : Seul le champ `etat` peut être changé après création
3. **Ordre d'affichage** : Par `created_at` ASC (ordre de saisie chronologique)
4. **Pièces jointes** : Références vers la table `documents` (intégration complète)
5. **Type d'entrée** : Liste prédéfinie avec possibilité de saisie libre

