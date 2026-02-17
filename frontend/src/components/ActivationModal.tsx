import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Activation {
  id?: number;
  titre: string;
  type?: string;
  date_creation?: string;
  date_cloture?: string;
  status?: string;
  responsable?: string;
  redacteur?: string;
  structure_implique?: string;
  commune?: string;
  code_departement?: string;
  code_commune?: string;
  secteur?: string;
  description_creation_activation?: string;
  actif?: boolean;
}

interface Departement {
  id: number;
  code_insee: string;
  nom: string;
}

interface Commune {
  id: number;
  code_insee: string;
  nom: string;
  code_departement: string;
}

interface Entite {
  id: number;
  nom: string;
  actif: boolean;
}

interface Utilisateur {
  id: number;
  username: string;
  nom?: string;
  prenom?: string;
  email: string;
  actif: boolean;
}

interface ActivationModalProps {
  activation: Activation | null;
  onClose: () => void;
  onSave: () => void;
}

const ActivationModal: React.FC<ActivationModalProps> = ({ activation, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Activation>({
    titre: '',
    type: '',
    date_creation: '',
    date_cloture: '',
    status: '',
    responsable: '',
    redacteur: user?.username || '',
    structure_implique: '',
    commune: '',
    secteur: '',
    description_creation_activation: '',
    actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStructures, setSelectedStructures] = useState<number[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loadingEntites, setLoadingEntites] = useState(false);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingDepartements, setLoadingDepartements] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loadingUtilisateurs, setLoadingUtilisateurs] = useState(false);

  // Charger les entités au montage du composant
  useEffect(() => {
    const fetchEntites = async () => {
      setLoadingEntites(true);
      try {
        const response = await api.get('/api/entites/?limit=200');
        setEntites(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des entités:', err);
      } finally {
        setLoadingEntites(false);
      }
    };
    fetchEntites();
  }, []);

  // Charger les départements au montage du composant
  useEffect(() => {
    const fetchDepartements = async () => {
      setLoadingDepartements(true);
      try {
        console.log('🟢 Chargement des départements...');
        const response = await api.get('/api/geographie/departements?limit=200');
        console.log('✅ Départements chargés:', response.data.length);
        setDepartements(response.data);
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des départements:', err);
        console.error('URL:', err.config?.url);
        console.error('Response:', err.response?.data);
      } finally {
        setLoadingDepartements(false);
      }
    };
    fetchDepartements();
  }, []);

  // Charger les communes quand un département est sélectionné
  useEffect(() => {
    const fetchCommunes = async () => {
      if (!formData.code_departement) {
        setCommunes([]);
        return;
      }
      setLoadingCommunes(true);
      try {
        console.log('🟢 Chargement des communes pour département:', formData.code_departement);
        const response = await api.get(`/api/geographie/communes/departement/${formData.code_departement}?limit=1000`);
        console.log('✅ Communes chargées:', response.data.length);
        setCommunes(response.data);
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des communes:', err);
        console.error('URL:', err.config?.url);
        console.error('Response:', err.response?.data);
        setCommunes([]);
      } finally {
        setLoadingCommunes(false);
      }
    };
    fetchCommunes();
  }, [formData.code_departement]);

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    const fetchUtilisateurs = async () => {
      setLoadingUtilisateurs(true);
      try {
        // Utiliser l'endpoint /actifs qui est accessible à tous les utilisateurs authentifiés
        const response = await api.get('/api/users/actifs?limit=200');
        setUtilisateurs(response.data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setUtilisateurs([]);
      } finally {
        setLoadingUtilisateurs(false);
      }
    };
    fetchUtilisateurs();
  }, []);

  useEffect(() => {
    if (activation) {
      // Parser les structures impliquées (JSON array de noms)
      // On doit trouver les IDs correspondants aux noms stockés
      const parseStructures = () => {
        if (!activation.structure_implique) return [];
        try {
          const parsed = JSON.parse(activation.structure_implique);
          if (Array.isArray(parsed)) {
            // Si c'est un array de strings (noms), trouver les IDs correspondants
            return parsed
              .map((nom: string) => {
                const entite = entites.find(e => e.nom === nom);
                return entite ? entite.id : null;
              })
              .filter((id: number | null): id is number => id !== null);
          }
          return [];
        } catch {
          return [];
        }
      };
      
      // Attendre que les entités soient chargées avant de parser
      const structures = entites.length > 0 ? parseStructures() : [];
      
      setFormData({
        titre: activation.titre || '',
        type: activation.type || '',
        date_creation: activation.date_creation ? activation.date_creation.substring(0, 16) : '',
        date_cloture: activation.date_cloture ? activation.date_cloture.substring(0, 16) : '',
        status: activation.status || '',
        responsable: activation.responsable || '',
        redacteur: activation.redacteur || user?.username || '',
        structure_implique: activation.structure_implique || '',
        commune: activation.commune || '',
        code_departement: activation.code_departement || '',
        code_commune: activation.code_commune || '',
        secteur: activation.secteur || '',
        description_creation_activation: activation.description_creation_activation || '',
        actif: activation.actif !== undefined ? activation.actif : true,
      });
      setSelectedStructures(structures);
    } else {
      setFormData({
        titre: '',
        type: '',
        date_creation: '',
        date_cloture: '',
        status: '',
        responsable: '',
        redacteur: user?.username || '',
        structure_implique: '',
        commune: '',
        code_departement: '',
        code_commune: '',
        secteur: '',
        description_creation_activation: '',
        actif: true,
      });
      setSelectedStructures([]);
    }
  }, [activation, user, entites]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('[ActivationModal] handleChange appelé:', { name, value });
    
    // Si on change le département, réinitialiser la commune
    if (name === 'code_departement') {
      setFormData((prev) => ({ ...prev, [name]: value, code_commune: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Si on sélectionne une commune, ouvrir la carte dans une nouvelle fenêtre
      if (name === 'code_commune' && value && value.trim() !== '') {
        console.log('[ActivationModal] Commune sélectionnée:', value);
        
        // Attendre un court délai pour s'assurer que le state est mis à jour
        setTimeout(() => {
          // Déterminer l'URL de base de la carte
          // Le nginx sert directement depuis la racine, donc pas besoin de /cartographie/
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const cartoUrl = isLocalhost 
            ? 'http://localhost:3081/cartoff3.html'
            : `${window.location.protocol}//${window.location.hostname}:3081/cartoff3.html`;
          
          // Ouvrir la carte avec le paramètre code_commune dans une nouvelle fenêtre
          const urlWithParams = `${cartoUrl}?code_commune=${encodeURIComponent(value)}`;
          console.log('[ActivationModal] Ouverture de la carte:', urlWithParams);
          
          // Ouvrir dans une nouvelle fenêtre (pas un onglet) avec des dimensions spécifiques
          // Note: On ne peut pas forcer l'ouverture en mode non privé via JavaScript,
          // mais on peut ouvrir une nouvelle fenêtre avec des caractéristiques spécifiques
          const windowFeatures = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=yes,location=yes';
          try {
            // Utiliser un nom unique pour forcer l'ouverture d'une nouvelle fenêtre à chaque fois
            const windowName = 'cartographie_' + Date.now();
            const newWindow = window.open(urlWithParams, windowName, windowFeatures);
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.error('[ActivationModal] Impossible d\'ouvrir la fenêtre. Vérifiez que les popups ne sont pas bloquées.');
              alert('Impossible d\'ouvrir la carte. Vérifiez que les popups ne sont pas bloquées dans votre navigateur.\n\nURL: ' + urlWithParams);
            } else {
              // Mettre le focus sur la nouvelle fenêtre
              newWindow.focus();
              console.log('[ActivationModal] Fenêtre ouverte avec succès:', windowName);
            }
          } catch (error) {
            console.error('[ActivationModal] Erreur lors de l\'ouverture de la fenêtre:', error);
            alert('Erreur lors de l\'ouverture de la carte: ' + error);
          }
        }, 100);
      }
    }
  };

  const handleStructureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setSelectedStructures(selectedOptions);
    // Convertir les IDs sélectionnés en JSON array
    const structureNames = selectedOptions
      .map(id => {
        const entite = entites.find(e => e.id === id);
        return entite ? entite.nom : null;
      })
      .filter((name): name is string => name !== null);
    
    setFormData((prev) => ({
      ...prev,
      structure_implique: structureNames.length > 0 ? JSON.stringify(structureNames) : '',
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        date_creation: formData.date_creation || null,
        date_cloture: formData.date_cloture || null,
        code_departement: formData.code_departement && formData.code_departement.trim() ? formData.code_departement.trim() : null,
        code_commune: formData.code_commune && formData.code_commune.trim() ? formData.code_commune.trim() : null,
      };

      if (activation?.id) {
        // Mise à jour
        await api.put(`/api/activations/${activation.id}`, payload);
      } else {
        // Création
        await api.post('/api/activations/', payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'enregistrement de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>{activation ? 'Modifier l\'activation' : 'Ajouter une activation'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titre">Titre *</label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Sélectionner...</option>
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Clôturé">Clôturé</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_creation">Date création</label>
              <input
                type="datetime-local"
                id="date_creation"
                name="date_creation"
                value={formData.date_creation}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_cloture">Date clôture</label>
              <input
                type="datetime-local"
                id="date_cloture"
                name="date_cloture"
                value={formData.date_cloture}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code_departement">Département</label>
              <select
                id="code_departement"
                name="code_departement"
                value={formData.code_departement}
                onChange={handleChange}
                disabled={loading || loadingDepartements}
              >
                <option value="">Sélectionner un département...</option>
                {departements.map((dep) => (
                  <option key={dep.id} value={dep.code_insee}>
                    {dep.nom} ({dep.code_insee})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="code_commune">Commune</label>
              <select
                id="code_commune"
                name="code_commune"
                value={formData.code_commune}
                onChange={handleChange}
                disabled={loading || loadingCommunes || !formData.code_departement}
              >
                <option value="">
                  {!formData.code_departement 
                    ? 'Sélectionnez d\'abord un département' 
                    : loadingCommunes 
                    ? 'Chargement...' 
                    : 'Sélectionner une commune...'}
                </option>
                {communes.map((commune) => (
                  <option key={commune.id} value={commune.code_insee}>
                    {commune.nom} ({commune.code_insee})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="secteur">Secteur</label>
              <input
                type="text"
                id="secteur"
                name="secteur"
                value={formData.secteur}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsable">Responsable</label>
              <select
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                disabled={loading || loadingUtilisateurs}
              >
                <option value="">Sélectionner un responsable...</option>
                {utilisateurs.map((utilisateur) => {
                  const displayName = utilisateur.nom && utilisateur.prenom
                    ? `${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.username})`
                    : utilisateur.username;
                  return (
                    <option key={utilisateur.id} value={displayName}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="redacteur">Rédacteur</label>
              <input
                type="text"
                id="redacteur"
                name="redacteur"
                value={formData.redacteur}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="structure_implique">Structures impliquées</label>
            <select
              id="structure_implique"
              name="structure_implique"
              multiple
              value={selectedStructures.map(id => id.toString())}
              onChange={handleStructureChange}
              disabled={loading || loadingEntites}
              size={5}
              style={{ 
                minHeight: '100px',
                minWidth: '200px',
                resize: 'both',
                overflow: 'auto'
              }}
            >
              {entites.map((entite) => (
                <option key={entite.id} value={entite.id.toString()}>
                  {entite.nom}
                </option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs structures. Vous pouvez redimensionner cette zone en glissant le coin inférieur droit.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description_creation_activation">Description</label>
            <textarea
              id="description_creation_activation"
              name="description_creation_activation"
              value={formData.description_creation_activation}
              onChange={handleChange}
              rows={4}
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

export default ActivationModal;

