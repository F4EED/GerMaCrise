import React, { useState, useEffect } from 'react';
import './UserModal.css';
import api from '../services/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  user?: {
    id: number;
    username: string;
    email: string;
    nom?: string;
    prenom?: string;
    structure_id?: number;
    role?: string;
    actif: boolean;
  } | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nom: '',
    prenom: '',
    structure_id: undefined as number | undefined,
    role: 'utilisateur',
    password: '',
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
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        nom: user.nom || '',
        prenom: user.prenom || '',
        structure_id: user.structure_id,
        role: user.role || 'utilisateur',
        password: '',
        actif: user.actif,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        nom: '',
        prenom: '',
        structure_id: undefined,
        role: 'utilisateur',
        password: '',
        actif: true,
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.username.trim()) {
        throw new Error("Le nom d'utilisateur est requis");
      }
      if (!formData.email.trim()) {
        throw new Error("L'email est requis");
      }
      if (!user && !formData.password) {
        throw new Error('Le mot de passe est requis pour un nouvel utilisateur');
      }

      const userData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        nom: formData.nom.trim() || undefined,
        prenom: formData.prenom.trim() || undefined,
        structure_id: formData.structure_id || undefined,
        role: formData.role,
        actif: formData.actif,
      };

      if (!user && formData.password) {
        userData.password = formData.password;
      }

      await onSave(userData);
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
          <h2>{user ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur *</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!user}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
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

          <div className="form-group">
            <label htmlFor="role">Rôle *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="utilisateur">Utilisateur</option>
              <option value="operateur">Opérateur</option>
              <option value="admin">Administrateur</option>
              <option value="super_admin">Super Administrateur</option>
            </select>
          </div>

          {!user && (
            <div className="form-group">
              <label htmlFor="password">Mot de passe *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                minLength={6}
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              />
              <span>Utilisateur actif</span>
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

export default UserModal;

