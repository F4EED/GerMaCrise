import React, { useState, useEffect } from 'react';
import './UserModal.css';

interface EntiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entiteData: any) => Promise<void>;
  entite?: {
    id: number;
    nom: string;
    actif: boolean;
  } | null;
}

const EntiteModal: React.FC<EntiteModalProps> = ({ isOpen, onClose, onSave, entite }) => {
  const [formData, setFormData] = useState({
    nom: '',
    actif: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entite) {
      setFormData({
        nom: entite.nom,
        actif: entite.actif,
      });
    } else {
      setFormData({
        nom: '',
        actif: true,
      });
    }
    setError('');
  }, [entite, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.nom.trim()) {
        throw new Error("Le nom est requis");
      }

      const entiteData: any = {
        nom: formData.nom.trim(),
        actif: formData.actif,
      };

      await onSave(entiteData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{entite ? 'Modifier entité' : 'Nouvelle entité'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              placeholder="Ex: SDIS 42"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              />
              <span>Entité active</span>
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

export default EntiteModal;

