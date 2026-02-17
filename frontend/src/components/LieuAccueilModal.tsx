import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface LieuAccueil {
  id?: number;
  nom_site: string;
  commune?: string;
  surface?: number;
  nb_accueil?: number;
  nb_hebergement?: number;
  nb_ravitaillement?: number;
  autres_ressource?: string;
  telephone_responsable?: string;
  adresse?: string;
  actif?: boolean;
}

interface LieuAccueilModalProps {
  lieu: LieuAccueil | null;
  onClose: () => void;
  onSave: () => void;
}

const LieuAccueilModal: React.FC<LieuAccueilModalProps> = ({ lieu, onClose, onSave }) => {
  const [formData, setFormData] = useState<LieuAccueil>({
    nom_site: '',
    commune: '',
    surface: undefined,
    nb_accueil: undefined,
    nb_hebergement: undefined,
    nb_ravitaillement: undefined,
    autres_ressource: '',
    telephone_responsable: '',
    adresse: '',
    actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lieu) {
      setFormData({
        nom_site: lieu.nom_site || '',
        commune: lieu.commune || '',
        surface: lieu.surface,
        nb_accueil: lieu.nb_accueil,
        nb_hebergement: lieu.nb_hebergement,
        nb_ravitaillement: lieu.nb_ravitaillement,
        autres_ressource: lieu.autres_ressource || '',
        telephone_responsable: lieu.telephone_responsable || '',
        adresse: lieu.adresse || '',
        actif: lieu.actif !== undefined ? lieu.actif : true,
      });
    } else {
      setFormData({
        nom_site: '',
        commune: '',
        surface: undefined,
        nb_accueil: undefined,
        nb_hebergement: undefined,
        nb_ravitaillement: undefined,
        autres_ressource: '',
        telephone_responsable: '',
        adresse: '',
        actif: true,
      });
    }
  }, [lieu]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'surface' || name === 'nb_accueil' || name === 'nb_hebergement' || name === 'nb_ravitaillement') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? undefined : parseInt(value, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_site.trim()) {
      setError('Le nom du site est obligatoire');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (lieu?.id) {
        // Mise à jour
        await api.put(`/api/lieux-accueil/${lieu.id}`, formData);
      } else {
        // Création
        await api.post('/api/lieux-accueil/', formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'enregistrement du lieu d'accueil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lieu ? 'Modifier le lieu d\'accueil' : 'Ajouter un lieu d\'accueil'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nom_site">Nom du site *</label>
            <input
              type="text"
              id="nom_site"
              name="nom_site"
              value={formData.nom_site}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="commune">Commune</label>
              <input
                type="text"
                id="commune"
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="surface">Surface (m²)</label>
              <input
                type="number"
                id="surface"
                name="surface"
                value={formData.surface || ''}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telephone_responsable">Téléphone responsable</label>
              <input
                type="tel"
                id="telephone_responsable"
                name="telephone_responsable"
                value={formData.telephone_responsable}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nb_accueil">Nombre d'accueil</label>
              <input
                type="number"
                id="nb_accueil"
                name="nb_accueil"
                value={formData.nb_accueil || ''}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nb_hebergement">Nombre d'hébergement</label>
              <input
                type="number"
                id="nb_hebergement"
                name="nb_hebergement"
                value={formData.nb_hebergement || ''}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nb_ravitaillement">Nombre de ravitaillement</label>
            <input
              type="number"
              id="nb_ravitaillement"
              name="nb_ravitaillement"
              value={formData.nb_ravitaillement || ''}
              onChange={handleChange}
              min="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="autres_ressource">Autres ressources</label>
            <textarea
              id="autres_ressource"
              name="autres_ressource"
              value={formData.autres_ressource}
              onChange={handleChange}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleCheckboxChange}
                disabled={loading}
              />
              Actif
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

export default LieuAccueilModal;

