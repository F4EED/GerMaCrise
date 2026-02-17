import React, { useState, useEffect } from 'react';
import './UserModal.css';
import api from '../services/api';

interface VehiculeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehiculeData: any) => Promise<void>;
  vehicule?: {
    id: number;
    immatriculation: string;
    type_vehicule?: string;
    marque?: string;
    modele?: string;
    annee?: number;
    structure_id?: number;
    service_affectation?: string;
    km_acquisition?: number;
    km_actuel?: number;
    km_revision?: number;
    prochain_ct?: string;
    prochaine_revision?: string;
    numero_inventaire?: string;
    commentaire?: string;
    capacite?: number;
    localisation?: string;
    statut: string;
    etat: string;
    actif: boolean;
  } | null;
}

const VehiculeModal: React.FC<VehiculeModalProps> = ({ isOpen, onClose, onSave, vehicule }) => {
  const [formData, setFormData] = useState({
    immatriculation: '',
    type_vehicule: '',
    marque: '',
    modele: '',
    annee: '',
    structure_id: undefined as number | undefined,
    service_affectation: '',
    km_acquisition: '',
    km_actuel: '',
    km_revision: '',
    prochain_ct: '',
    prochaine_revision: '',
    numero_inventaire: '',
    commentaire: '',
    capacite: '',
    localisation: '',
    statut: 'disponible',
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
        setEntites(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
      }
    };
    fetchEntites();
  }, []);

  useEffect(() => {
    if (vehicule) {
      setFormData({
        immatriculation: vehicule.immatriculation,
        type_vehicule: vehicule.type_vehicule || '',
        marque: vehicule.marque || '',
        modele: vehicule.modele || '',
        annee: vehicule.annee?.toString() || '',
        structure_id: vehicule.structure_id,
        service_affectation: vehicule.service_affectation || '',
        km_acquisition: vehicule.km_acquisition?.toString() || '',
        km_actuel: vehicule.km_actuel?.toString() || '',
        km_revision: vehicule.km_revision?.toString() || '',
        prochain_ct: vehicule.prochain_ct ? new Date(vehicule.prochain_ct).toISOString().split('T')[0] : '',
        prochaine_revision: vehicule.prochaine_revision ? new Date(vehicule.prochaine_revision).toISOString().split('T')[0] : '',
        numero_inventaire: vehicule.numero_inventaire || '',
        commentaire: vehicule.commentaire || '',
        capacite: vehicule.capacite?.toString() || '',
        localisation: vehicule.localisation || '',
        statut: vehicule.statut,
        etat: vehicule.etat || 'disponible',
        actif: vehicule.actif,
      });
    } else {
      setFormData({
        immatriculation: '',
        type_vehicule: '',
        marque: '',
        modele: '',
        annee: '',
        structure_id: undefined,
        service_affectation: '',
        km_acquisition: '',
        km_actuel: '',
        km_revision: '',
        prochain_ct: '',
        prochaine_revision: '',
        numero_inventaire: '',
        commentaire: '',
        capacite: '',
        localisation: '',
        statut: 'disponible',
        etat: 'disponible',
        actif: true,
      });
    }
    setError('');
  }, [vehicule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.immatriculation.trim()) {
        throw new Error("L'immatriculation est requise");
      }

      const vehiculeData: any = {
        immatriculation: formData.immatriculation.trim(),
        type_vehicule: formData.type_vehicule.trim() || undefined,
        marque: formData.marque.trim() || undefined,
        modele: formData.modele.trim() || undefined,
        annee: formData.annee ? parseInt(formData.annee) : undefined,
        structure_id: formData.structure_id || undefined,
        service_affectation: formData.service_affectation.trim() || undefined,
        km_acquisition: formData.km_acquisition ? parseInt(formData.km_acquisition) : undefined,
        km_actuel: formData.km_actuel ? parseInt(formData.km_actuel) : undefined,
        km_revision: formData.km_revision ? parseInt(formData.km_revision) : undefined,
        prochain_ct: formData.prochain_ct ? new Date(formData.prochain_ct).toISOString() : undefined,
        prochaine_revision: formData.prochaine_revision ? new Date(formData.prochaine_revision).toISOString() : undefined,
        numero_inventaire: formData.numero_inventaire.trim() || undefined,
        commentaire: formData.commentaire.trim() || undefined,
        capacite: formData.capacite ? parseInt(formData.capacite) : undefined,
        localisation: formData.localisation.trim() || undefined,
        statut: formData.statut,
        etat: formData.etat,
        actif: formData.actif,
      };

      await onSave(vehiculeData);
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

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ zIndex: 10000 }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{vehicule ? 'Modifier véhicule' : 'Nouveau véhicule'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="immatriculation">Immatriculation *</label>
            <input
              type="text"
              id="immatriculation"
              value={formData.immatriculation}
              onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
              required
              disabled={!!vehicule}
              placeholder="AA-123-BB"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type_vehicule">Type de véhicule *</label>
            <select
              id="type_vehicule"
              value={formData.type_vehicule}
              onChange={(e) => setFormData({ ...formData, type_vehicule: e.target.value })}
              required
            >
              <option value="">Sélectionner un type</option>
              <option value="PCM - Poste de Commandement Mobile">PCM - Poste de Commandement Mobile</option>
              <option value="REM - Remorque">REM - Remorque</option>
              <option value="VL - Véhicule Léger">VL - Véhicule Léger</option>
              <option value="VLHR - Véhicule Légers Hors Routes">VLHR - Véhicule Légers Hors Routes</option>
              <option value="VPSP - Véhicule de Premiers Secours">VPSP - Véhicule de Premiers Secours</option>
              <option value="VTP - Véhicule de Transport de Personnel">VTP - Véhicule de Transport de Personnel</option>
              <option value="VTU - Véhicule Tout usage">VTU - Véhicule Tout usage</option>
              <option value="PLHR - Poids Lourd Hors Route">PLHR - Poids Lourd Hors Route</option>
              <option value="BAL - Balayeuse">BAL - Balayeuse</option>
              <option value="DENEIGEUSE - Véhicule de déneigement">DENEIGEUSE - Véhicule de déneigement</option>
              <option value="VSAV - Véhicule de Secours et d'Assistance aux Victimes">VSAV - Véhicule de Secours et d'Assistance aux Victimes</option>
              <option value="VSR - Véhicule Secours Routier">VSR - Véhicule Secours Routier</option>
              <option value="FPT - Fourgon Pompe Tonne">FPT - Fourgon Pompe Tonne</option>
              <option value="EPA - Échelle Pivotante Automatique">EPA - Échelle Pivotante Automatique</option>
              <option value="CCF - Camion Citerne Feux de Forêts">CCF - Camion Citerne Feux de Forêts</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="marque">Marque</label>
              <input
                type="text"
                id="marque"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Renault, Peugeot..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="modele">Modèle</label>
              <input
                type="text"
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="Master, Boxer..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="annee">Année</label>
              <input
                type="number"
                id="annee"
                value={formData.annee}
                onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="Ex: 2020"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="structure_id">Structure</label>
            <select
              id="structure_id"
              value={formData.structure_id || ''}
              onChange={(e) => setFormData({ ...formData, structure_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">-- Sélectionner une structure --</option>
              {entites.map((entite) => (
                <option key={entite.id} value={entite.id}>
                  {entite.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service_affectation">Service d'affectation</label>
              <input
                type="text"
                id="service_affectation"
                value={formData.service_affectation}
                onChange={(e) => setFormData({ ...formData, service_affectation: e.target.value })}
                placeholder="Service Technique, DRH..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="km_acquisition">Km à l'acquisition</label>
              <input
                type="number"
                id="km_acquisition"
                value={formData.km_acquisition}
                onChange={(e) => setFormData({ ...formData, km_acquisition: e.target.value })}
                min="0"
                placeholder="Ex: 50000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="km_actuel">Km actuel</label>
              <input
                type="number"
                id="km_actuel"
                value={formData.km_actuel}
                onChange={(e) => setFormData({ ...formData, km_actuel: e.target.value })}
                min="0"
                placeholder="Ex: 120000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="km_revision">Km dernière révision</label>
              <input
                type="number"
                id="km_revision"
                value={formData.km_revision}
                onChange={(e) => setFormData({ ...formData, km_revision: e.target.value })}
                min="0"
                placeholder="Ex: 110000"
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
              <label htmlFor="prochain_ct">Prochain contrôle technique</label>
              <input
                type="date"
                id="prochain_ct"
                value={formData.prochain_ct}
                onChange={(e) => setFormData({ ...formData, prochain_ct: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prochaine_revision">Prochaine révision</label>
              <input
                type="date"
                id="prochaine_revision"
                value={formData.prochaine_revision}
                onChange={(e) => setFormData({ ...formData, prochaine_revision: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="capacite">Capacité (personnes)</label>
              <input
                type="number"
                id="capacite"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                min="1"
                placeholder="Ex: 4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="localisation">Localisation</label>
              <input
                type="text"
                id="localisation"
                value={formData.localisation}
                onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                placeholder="Caserne, Parking..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="commentaire">Commentaire</label>
            <textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
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
                <option value="disponible">Disponible</option>
                <option value="en_mission">En mission</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="hors_service">Hors service</option>
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
              <span>Véhicule actif</span>
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

export default VehiculeModal;

