# Exemple d'utilisation de l'activation sélectionnée

Ce document montre comment utiliser l'activation sélectionnée dans n'importe quelle page de l'application.

## Import du hook

```typescript
import { useActivation } from '../contexts/ActivationContext';
```

## Utilisation dans un composant

```typescript
import React from 'react';
import { useActivation } from '../contexts/ActivationContext';

const MaPage: React.FC = () => {
  const { selectedActivation, setSelectedActivation, clearSelectedActivation } = useActivation();

  if (!selectedActivation) {
    return (
      <div>
        <p>Aucune activation sélectionnée. Veuillez en sélectionner une depuis la page Activations.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Page avec activation sélectionnée</h1>
      <div>
        <h2>Activation active : {selectedActivation.titre}</h2>
        <p>Type : {selectedActivation.type || 'Non spécifié'}</p>
        <p>Commune : {selectedActivation.commune || 'Non spécifiée'}</p>
        <p>Secteur : {selectedActivation.secteur || 'Non spécifié'}</p>
        <p>Statut : {selectedActivation.status || 'Non spécifié'}</p>
        <p>Responsable : {selectedActivation.responsable || 'Non spécifié'}</p>
        
        {/* Utiliser les données de l'activation pour filtrer ou afficher des informations */}
        <button onClick={clearSelectedActivation}>
          Désélectionner l'activation
        </button>
      </div>
    </div>
  );
};

export default MaPage;
```

## Propriétés disponibles

L'objet `selectedActivation` contient toutes les propriétés de l'activation :

- `id`: number - Identifiant unique
- `titre`: string - Titre de l'activation
- `type`: string (optionnel) - Type d'activation
- `date_creation`: string (optionnel) - Date de création
- `date_cloture`: string (optionnel) - Date de clôture
- `status`: string (optionnel) - Statut (ex: "en cours", "clôturée")
- `responsable`: string (optionnel) - Responsable
- `redacteur`: string (optionnel) - Rédacteur
- `structure_implique`: string (optionnel) - Structures impliquées (JSON string)
- `commune`: string (optionnel) - Commune
- `secteur`: string (optionnel) - Secteur
- `description_creation_activation`: string (optionnel) - Description
- `actif`: boolean - Statut actif/inactif

## Fonctions disponibles

- `setSelectedActivation(activation)`: Définit une nouvelle activation sélectionnée
- `clearSelectedActivation()`: Désélectionne l'activation actuelle

## Persistance

L'activation sélectionnée est automatiquement sauvegardée dans le localStorage, donc elle persiste même après un rafraîchissement de la page.

