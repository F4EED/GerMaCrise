import React, { useState, useEffect } from 'react';
import './UserModal.css';
import api from '../services/api';

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personnelData: any) => Promise<void>;
  personnel?: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    nom_court?: string;
    structure_id?: number;
    fonction?: string;
    service?: string;
    telephone?: string;
    telephone2?: string;
    email?: string;
    email2?: string;
    id_meshtastic?: string;
    nom_meshtastic?: string;
    nom_court_meshtastic?: string;
    commentaire?: string;
    statut: string;
    actif: boolean;
  } | null;
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({ isOpen, onClose, onSave, personnel }) => {
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    nom_court: '',
    structure_id: undefined as number | undefined,
    fonction: '',
    service: '',
    telephone: '',
    telephone2: '',
    email: '',
    email2: '',
    id_meshtastic: '',
    nom_meshtastic: '',
    nom_court_meshtastic: '',
    commentaire: '',
    statut: 'disponible',
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
    if (personnel) {
      setFormData({
        matricule: personnel.matricule,
        nom: personnel.nom,
        prenom: personnel.prenom,
        nom_court: personnel.nom_court || '',
        structure_id: personnel.structure_id,
        fonction: personnel.fonction || '',
        service: personnel.service || '',
        telephone: personnel.telephone || '',
        telephone2: personnel.telephone2 || '',
        email: personnel.email || '',
        email2: personnel.email2 || '',
        id_meshtastic: personnel.id_meshtastic || '',
        nom_meshtastic: personnel.nom_meshtastic || '',
        nom_court_meshtastic: personnel.nom_court_meshtastic || '',
        commentaire: personnel.commentaire || '',
        statut: personnel.statut,
        actif: personnel.actif,
      });
    } else {
      setFormData({
        matricule: '',
        nom: '',
        prenom: '',
        nom_court: '',
        structure_id: undefined,
        fonction: '',
        service: '',
        telephone: '',
        telephone2: '',
        email: '',
        email2: '',
        id_meshtastic: '',
        nom_meshtastic: '',
        nom_court_meshtastic: '',
        commentaire: '',
        statut: 'disponible',
        actif: true,
      });
    }
    setError('');
    setLoading(false); // Réinitialiser le loading quand le modal s'ouvre ou change de personnel
  }, [personnel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.matricule.trim()) {
        throw new Error("Le matricule est requis");
      }
      if (!formData.nom.trim()) {
        throw new Error("Le nom est requis");
      }
      if (!formData.prenom.trim()) {
        throw new Error("Le prénom est requis");
      }

      const personnelData: any = {
        matricule: formData.matricule.trim(),
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        nom_court: formData.nom_court.trim() || undefined,
        structure_id: formData.structure_id || undefined,
        fonction: formData.fonction.trim() || undefined,
        service: formData.service.trim() || undefined,
        telephone: formData.telephone.trim() || undefined,
        telephone2: formData.telephone2.trim() || undefined,
        email: formData.email.trim() || undefined,
        email2: formData.email2.trim() || undefined,
        id_meshtastic: formData.id_meshtastic.trim() || undefined,
        nom_meshtastic: formData.nom_meshtastic.trim() || undefined,
        nom_court_meshtastic: formData.nom_court_meshtastic.trim() || undefined,
        commentaire: formData.commentaire.trim() || undefined,
        statut: formData.statut,
        actif: formData.actif,
      };

      await onSave(personnelData);
      // Attendre un peu pour s'assurer que la sauvegarde est terminée
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      console.error('Détails:', err.response?.data);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la sauvegarde');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{personnel ? 'Modifier personnel' : 'Nouveau personnel'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="matricule">Matricule *</label>
            <input
              type="text"
              id="matricule"
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value.toUpperCase() })}
              required
              disabled={!!personnel}
              placeholder="Ex: MAT-001"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom *</label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom *</label>
              <input
                type="text"
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
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
              <label htmlFor="fonction">Fonction</label>
              <input
                type="text"
                id="fonction"
                value={formData.fonction}
                onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                placeholder="Ex: Sapeur-pompier"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service">Service</label>
              <input
                type="text"
                id="service"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                placeholder="Ex: Service opérationnel"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nom_court">Nom court</label>
            <input
              type="text"
              id="nom_court"
              value={formData.nom_court}
              onChange={(e) => setFormData({ ...formData, nom_court: e.target.value })}
              placeholder="Ex: J. Dupont"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telephone">Téléphone 1</label>
              <input
                type="tel"
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telephone2">Téléphone 2</label>
              <input
                type="tel"
                id="telephone2"
                value={formData.telephone2}
                onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                placeholder="06 98 76 54 32"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email 1</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nom@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email2">Email 2</label>
              <input
                type="email"
                id="email2"
                value={formData.email2}
                onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                placeholder="nom2@example.com"
              />
            </div>
          </div>

          <h3>Meshtastic</h3>
          <div className="form-group">
            <label htmlFor="id_meshtastic">ID Meshtastic</label>
            <input
              type="text"
              id="id_meshtastic"
              value={formData.id_meshtastic}
              onChange={(e) => setFormData({ ...formData, id_meshtastic: e.target.value })}
              placeholder="Ex: !a1b2c3d4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom_court_meshtastic">Nom court Meshtastic</label>
              <input
                type="text"
                id="nom_court_meshtastic"
                value={formData.nom_court_meshtastic}
                onChange={(e) => setFormData({ ...formData, nom_court_meshtastic: e.target.value })}
                placeholder="Ex: J. Dupont"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom_meshtastic">Nom Meshtastic (nom long)</label>
              <input
                type="text"
                id="nom_meshtastic"
                value={formData.nom_meshtastic}
                onChange={(e) => setFormData({ ...formData, nom_meshtastic: e.target.value })}
                placeholder="Ex: Jean Dupont - Chef de centre"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="commentaire">Commentaire</label>
            <textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Notes, observations, informations complémentaires..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="statut">Statut *</label>
            <select
              id="statut"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              required
            >
              <option value="disponible">Disponible</option>
              <option value="occupe">Occupé</option>
              <option value="repos">Repos</option>
              <option value="absent">Absent</option>
              <option value="engage">Engagé</option>
              <option value="non_disponible">Non disponible</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              />
              <span>Personnel actif</span>
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

export default PersonnelModal;

