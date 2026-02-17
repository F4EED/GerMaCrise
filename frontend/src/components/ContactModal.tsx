import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface ContactCrise {
  id?: number;
  nom: string;
  prenom: string;
  tel_bureau?: string;
  tel_portable?: string;
  tel_personnel?: string;
  structure?: string;
  fonction?: string;
  mail?: string;
  remarques?: string;
  actif?: boolean;
}

interface ContactModalProps {
  contact: ContactCrise | null;
  onClose: () => void;
  onSave: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ contact, onClose, onSave }) => {
  const [formData, setFormData] = useState<ContactCrise>({
    nom: '',
    prenom: '',
    tel_bureau: '',
    tel_portable: '',
    tel_personnel: '',
    structure: '',
    fonction: '',
    mail: '',
    remarques: '',
    actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        nom: contact.nom || '',
        prenom: contact.prenom || '',
        tel_bureau: contact.tel_bureau || '',
        tel_portable: contact.tel_portable || '',
        tel_personnel: contact.tel_personnel || '',
        structure: contact.structure || '',
        fonction: contact.fonction || '',
        mail: contact.mail || '',
        remarques: contact.remarques || '',
        actif: contact.actif !== undefined ? contact.actif : true,
      });
    } else {
      setFormData({
        nom: '',
        prenom: '',
        tel_bureau: '',
        tel_portable: '',
        tel_personnel: '',
        structure: '',
        fonction: '',
        mail: '',
        remarques: '',
        actif: true,
      });
    }
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (contact?.id) {
        // Mise à jour
        await api.put(`/api/annuaire-crise/${contact.id}`, formData);
      } else {
        // Création
        await api.post('/api/annuaire-crise/', formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'enregistrement du contact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{contact ? 'Modifier le contact' : 'Ajouter un contact'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom *</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="structure">Structure</label>
              <input
                type="text"
                id="structure"
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fonction">Fonction</label>
              <input
                type="text"
                id="fonction"
                name="fonction"
                value={formData.fonction}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tel_bureau">Téléphone Bureau</label>
              <input
                type="tel"
                id="tel_bureau"
                name="tel_bureau"
                value={formData.tel_bureau}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tel_portable">Téléphone Portable</label>
              <input
                type="tel"
                id="tel_portable"
                name="tel_portable"
                value={formData.tel_portable}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tel_personnel">Téléphone Personnel</label>
            <input
              type="tel"
              id="tel_personnel"
              name="tel_personnel"
              value={formData.tel_personnel}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mail">Email</label>
            <input
              type="email"
              id="mail"
              name="mail"
              value={formData.mail}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="remarques">Remarques</label>
            <textarea
              id="remarques"
              name="remarques"
              value={formData.remarques}
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

export default ContactModal;

