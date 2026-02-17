import React from 'react';
import './APropos.css';

const APropos: React.FC = () => {
  React.useEffect(() => {
    console.log('🟢 APropos component mounted');
    console.log('🟢 APropos - Page should be visible now');
    return () => {
      console.log('🔴 APropos component unmounted');
    };
  }, []);

  console.log('🟡 APropos component rendering');

  return (
    <div className="a-propos" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="page-header">
        <h1>À propos</h1>
      </div>
      <div className="card">
        <h2>GerMaCrise V3</h2>
        <p><strong>Version :</strong> 3.0.0</p>
        <p><strong>Description :</strong> Système de gestion de main courante informatique multi-utilisateur pour la gestion de crises (climatiques, industrielles, transport, route) et les plans communaux/intercommunaux de sauvegarde (PICS).</p>
        
        <h3>Caractéristiques</h3>
        <ul>
          <li>Multi-utilisateur avec gestion des rôles (utilisateur, administrateur, etc.)</li>
          <li>Gestion du personnel, des moyens et des véhicules</li>
          <li>Fonctionnement 100% offline (local)</li>
          <li>Synchronisation optionnelle vers base nationale (si internet disponible)</li>
          <li>Compatible Docker Intel et ARM</li>
          <li>Préparé pour intégration avec Germacrise via PostgreSQL/PostGIS</li>
        </ul>

        <h3>Architecture</h3>
        <ul>
          <li><strong>Backend :</strong> FastAPI (Python)</li>
          <li><strong>Frontend :</strong> React + TypeScript</li>
          <li><strong>Base de données :</strong> PostgreSQL + PostGIS</li>
          <li><strong>Authentification :</strong> JWT avec gestion des rôles</li>
        </ul>

        <h3>Fonctionnalités récentes</h3>
        <ul>
          <li><strong>Mode jour/nuit :</strong> Basculez entre le mode clair et le mode sombre pour un confort visuel optimal</li>
          <li><strong>Sélection d'activation :</strong> Sélectionnez une activation pour y accéder depuis n'importe quelle page</li>
          <li><strong>Statuts d'activation :</strong> Gestion des statuts (Programmé, En cours, Clôturée)</li>
          <li><strong>Mémorisation du nom d'utilisateur :</strong> Le dernier nom d'utilisateur est automatiquement mémorisé</li>
          <li><strong>Popup de bienvenue :</strong> Message personnalisé à la connexion</li>
          <li><strong>Installation PWA :</strong> Installation de l'application directement depuis le navigateur</li>
          <li><strong>Engagement de ressources dans la main courante :</strong> Possibilité d'engager du personnel, des moyens et des véhicules lors de la création d'une entrée de main courante</li>
          <li><strong>Recherche multi-critères :</strong> Recherche avancée pour le personnel (matricule, nom, prénom, fonction, service), les moyens (code, nom, catégorie) et les véhicules (immatriculation, type, marque)</li>
          <li><strong>Statut "Non disponible" :</strong> Nouveau statut pour le personnel permettant de marquer des personnes comme non disponibles</li>
          <li><strong>Gestion améliorée des structures :</strong> Recherche par structure dans la gestion du personnel et des moyens</li>
        </ul>

        <h3>Interface utilisateur</h3>
        <ul>
          <li>Design moderne et responsive</li>
          <li>Thème clair et sombre avec basculement automatique</li>
          <li>Navigation intuitive avec menus déroulants</li>
          <li>Recherche et filtrage avancés sur toutes les pages</li>
          <li>Gestion des rôles et permissions</li>
        </ul>

        <h3>Documentation</h3>
        <p>Pour plus d'informations, consultez la documentation du projet.</p>
        
        <p><strong>Sources des adresses :</strong> BAN plus IGN Juin 2025</p>
      </div>
    </div>
  );
};

export default APropos;
