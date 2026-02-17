import React, { useState, useEffect } from 'react';
import './UserModal.css';
import api from '../services/api';

interface MoyenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moyenData: any) => Promise<void>;
  moyen?: {
    id: number;
    code: string;
    nom: string;
    categorie?: string;
    nombre?: number;
    service_utilisateur?: string;
    modele?: string;
    numero_serie?: string;
    date_acquisition?: string;
    date_garantie?: string;
    numero_inventaire?: string;
    affectation?: string;
    stockage?: string;
    description?: string;
    structure_id?: number;
    statut: string;
    etat: string;
    actif: boolean;
  } | null;
}

const MoyenModal: React.FC<MoyenModalProps> = ({ isOpen, onClose, onSave, moyen }) => {
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    categorie: '',
    nombre: 1,
    service_utilisateur: '',
    modele: '',
    numero_serie: '',
    date_acquisition: '',
    date_garantie: '',
    numero_inventaire: '',
    affectation: '',
    stockage: '',
    description: '',
    structure_id: undefined as number | undefined,
    statut: 'Disponible',
    etat: 'disponible',
    actif: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entites, setEntites] = useState<Array<{ id: number; nom: string }>>([]);

  useEffect(() => {
    const fetchEntites = async () => {
      try {
        const response = await api.get('/api/entites');
        console.log('📋 Entités chargées:', response.data);
        setEntites(response.data || []);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des entités:', error);
        setEntites([]);
      }
    };
    if (isOpen) {
      fetchEntites();
    }
  }, [isOpen]);

  useEffect(() => {
    if (moyen) {
      setFormData({
        code: moyen.code,
        nom: moyen.nom,
        categorie: moyen.categorie || '',
        nombre: moyen.nombre || 1,
        service_utilisateur: moyen.service_utilisateur || '',
        modele: moyen.modele || '',
        numero_serie: moyen.numero_serie || '',
        date_acquisition: moyen.date_acquisition ? new Date(moyen.date_acquisition).toISOString().split('T')[0] : '',
        date_garantie: moyen.date_garantie ? new Date(moyen.date_garantie).toISOString().split('T')[0] : '',
        numero_inventaire: moyen.numero_inventaire || '',
        affectation: moyen.affectation || '',
        stockage: moyen.stockage || '',
        description: moyen.description || '',
        structure_id: moyen.structure_id,
        statut: moyen.statut,
        etat: moyen.etat || 'disponible',
        actif: moyen.actif,
      });
    } else {
      setFormData({
        code: '',
        nom: '',
        categorie: '',
        nombre: 1,
        service_utilisateur: '',
        modele: '',
        numero_serie: '',
        date_acquisition: '',
        date_garantie: '',
        numero_inventaire: '',
        affectation: '',
        stockage: '',
        description: '',
        structure_id: undefined,
        statut: 'Disponible',
        etat: 'disponible',
        actif: true,
      });
    }
    setError('');
  }, [moyen, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.code.trim()) {
        throw new Error("Le code est requis");
      }
      if (!formData.nom.trim()) {
        throw new Error("Le nom est requis");
      }

      const moyenData: any = {
        code: formData.code.trim(),
        nom: formData.nom.trim(),
        categorie: formData.categorie.trim() || undefined,
        nombre: formData.nombre || 1,
        structure_id: formData.structure_id && formData.structure_id > 0 ? formData.structure_id : undefined,
        service_utilisateur: formData.service_utilisateur.trim() || undefined,
        modele: formData.modele.trim() || undefined,
        numero_serie: formData.numero_serie.trim() || undefined,
        date_acquisition: formData.date_acquisition ? new Date(formData.date_acquisition).toISOString() : undefined,
        date_garantie: formData.date_garantie ? new Date(formData.date_garantie).toISOString() : undefined,
        numero_inventaire: formData.numero_inventaire.trim() || undefined,
        affectation: formData.affectation.trim() || undefined,
        stockage: formData.stockage.trim() || undefined,
        description: formData.description.trim() || undefined,
        statut: formData.statut || undefined,
        etat: formData.etat || undefined,
        actif: formData.actif !== undefined ? formData.actif : true,
      };
      
      // Nettoyer les valeurs undefined pour éviter les problèmes de validation
      Object.keys(moyenData).forEach(key => {
        if (moyenData[key] === undefined || moyenData[key] === '') {
          delete moyenData[key];
        }
      });

      await onSave(moyenData);
      onClose();
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic qui peuvent être des objets
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // Erreurs de validation multiples
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : (e.msg || e.message || JSON.stringify(e))
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          // Erreur de validation unique (objet)
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || JSON.stringify(err.response.data.detail);
        } else {
          errorMessage = String(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Erreur lors de la sauvegarde:', err);
      console.error('Détails:', err.response?.data);
      console.error('Detail complet:', JSON.stringify(err.response?.data?.detail, null, 2));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categorieOptions = [
    'Matériel éclairage',
    'Matériel élagage',
    'Matériel hébergement',
    'Matériel incendie',
    'Matériel formation',
    'Matériel logistique',
    'Matériel pompage',
    'Matériel divers',
    'Matériel électrique',
    'Matériel informatique',
    'Matériel médical',
    'Matériel bureautique',
  ];

  // Statuts de status_moyen.json et status_materiel.json
  const statutOptions = [
    // Statuts de status_moyen.json
    { value: 'Disponible', label: 'Disponible' },
    { value: 'En mission', label: 'En mission' },
    { value: 'En panne', label: 'En panne' },
    { value: 'Accidenté', label: 'Accidenté' },
    { value: 'Volé', label: 'Volé' },
    { value: 'Autre', label: 'Autre' },
    // Statuts de status_materiel.json
    { value: 'Opérationnel', label: 'Opérationnel' },
    { value: 'Panne', label: 'Panne' },
    { value: 'Usage limité', label: 'Usage limité' },
    { value: 'En prêt', label: 'En prêt' },
    { value: 'En réparation', label: 'En réparation' },
    { value: 'En révision', label: 'En révision' },
    { value: 'Réformé', label: 'Réformé' },
    { value: 'Vendu', label: 'Vendu' },
    { value: 'Détruit', label: 'Détruit' },
    { value: 'Perdu', label: 'Perdu' },
    { value: 'Rendu', label: 'Rendu' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{moyen ? 'Modifier moyen' : 'Nouveau moyen'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Code *</label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                disabled={!!moyen}
                placeholder="Ex: MAT-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom">Matériel (Nom) *</label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                placeholder="Nom du matériel"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categorie">Catégorie</label>
              <select
                id="categorie"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              >
                <option value="">Sélectionner une catégorie</option>
                {categorieOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="number"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="structure_id">Structure</label>
              <select
                id="structure_id"
                value={formData.structure_id || ''}
                onChange={(e) => setFormData({ ...formData, structure_id: e.target.value ? parseInt(e.target.value) : undefined })}
                style={{ width: '100%' }}
              >
                <option value="">Sélectionner une structure</option>
                {entites && entites.length > 0 ? (
                  entites.map(entite => (
                    <option key={entite.id} value={entite.id}>{entite.nom}</option>
                  ))
                ) : (
                  <option value="" disabled>Aucune structure disponible</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="service_utilisateur">Service utilisateur</label>
              <input
                type="text"
                id="service_utilisateur"
                value={formData.service_utilisateur}
                onChange={(e) => setFormData({ ...formData, service_utilisateur: e.target.value })}
                placeholder="Service Technique, DRH..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="modele">Modèle</label>
              <input
                type="text"
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="Modèle-XXX"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero_serie">Numéro de série</label>
              <input
                type="text"
                id="numero_serie"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value.toUpperCase() })}
                placeholder="SN-XXXXX"
              />
            </div>

            <div className="form-group">
              <label htmlFor="numero_inventaire">Numéro d'inventaire</label>
              <input
                type="text"
                id="numero_inventaire"
                value={formData.numero_inventaire}
                onChange={(e) => setFormData({ ...formData, numero_inventaire: e.target.value.toUpperCase() })}
                placeholder="INV-1000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_acquisition">Date d'acquisition</label>
              <input
                type="date"
                id="date_acquisition"
                value={formData.date_acquisition}
                onChange={(e) => setFormData({ ...formData, date_acquisition: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_garantie">Date de garantie</label>
              <input
                type="date"
                id="date_garantie"
                value={formData.date_garantie}
                onChange={(e) => setFormData({ ...formData, date_garantie: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="affectation">Affectation (Zone)</label>
              <input
                type="text"
                id="affectation"
                value={formData.affectation}
                onChange={(e) => setFormData({ ...formData, affectation: e.target.value })}
                placeholder="Zone A, Zone B..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="stockage">Stockage</label>
              <input
                type="text"
                id="stockage"
                value={formData.stockage}
                onChange={(e) => setFormData({ ...formData, stockage: e.target.value })}
                placeholder="Entrepôt 1, Entrepôt 2..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description / Commentaire</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Remarques, observations..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="statut">Statut *</label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                required
              >
                {statutOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="etat">État *</label>
              <select
                id="etat"
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                required
              >
                <option value="disponible">Disponible</option>
                <option value="indisponible">Indisponible</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              />
              <span>Moyen actif</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoyenModal;
