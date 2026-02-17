import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SearchBar, { SearchField } from '../components/SearchBar';
import './SAR.css';

interface SAREquipe {
  id: number;
  nom_equipe: string;
  composition_equipe: string;
  remarque: string;
  actif: boolean;
  created_at: string;
  updated_at?: string;
}

const SAR: React.FC = () => {
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<SAREquipe[]>([]);
  const [filteredEquipes, setFilteredEquipes] = useState<SAREquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<SAREquipe | null>(null);
  const [showInactives, setShowInactives] = useState(true); // Par défaut, afficher toutes les équipes

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  // Debug: afficher les permissions
  useEffect(() => {
    console.log('SAR - User:', user);
    console.log('SAR - User role:', user?.role);
    console.log('SAR - canEdit:', canEdit);
    console.log('SAR - canDelete:', canDelete);
  }, [user, canEdit, canDelete]);

  useEffect(() => {
    loadEquipes();
  }, []);

  // Filtrer les équipes quand showInactives change ou quand les équipes changent
  useEffect(() => {
    applyFilters();
  }, [equipes, showInactives]);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Charger toutes les équipes (actives et inactives)
      const url = 'http://localhost:8000/api/sar-equipe?actif_only=false';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des équipes SAR');
      }

      const data = await response.json();
      setEquipes(data);
      setFilteredEquipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...equipes];
    
    // Filtrer par statut actif/inactif
    if (!showInactives) {
      filtered = filtered.filter(equipe => equipe.actif === true);
    }
    
    setFilteredEquipes(filtered);
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...equipes];
    
    // Filtrer par statut actif/inactif (si la checkbox est décochée)
    if (!showInactives) {
      filtered = filtered.filter(equipe => equipe.actif === true);
    }
    
    // Appliquer les filtres de recherche
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((equipe) => {
          // Pour le statut actif, faire une correspondance exacte
          if (key === 'actif') {
            const isActif = value === 'actif' || value === 'true';
            return equipe.actif === isActif;
          }
          
          const fieldValue = equipe[key as keyof SAREquipe];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          // Pour les autres champs, recherche partielle (insensible à la casse)
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });
    
    setFilteredEquipes(filtered);
  };

  const handleResetSearch = () => {
    applyFilters();
  };

  const handleEdit = (equipe: SAREquipe) => {
    setSelectedEquipe(equipe);
    setIsModalOpen(true);
  };

  const handleDelete = async (equipe: SAREquipe) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${equipe.nom_equipe}" ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/sar-equipe/${equipe.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await loadEquipes(); // Recharger toutes les équipes après suppression
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      console.error('Erreur:', err);
    }
  };

  const searchFields: SearchField[] = [
    { key: 'nom_equipe', label: 'Nom de l\'équipe' },
    { key: 'composition_equipe', label: 'Composition' },
    { key: 'remarque', label: 'Remarque' },
    {
      key: 'actif',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' },
      ],
    },
  ];

  const handleToggleActif = async (equipe: SAREquipe) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/sar-equipe/${equipe.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actif: !equipe.actif,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      await loadEquipes(); // Recharger toutes les équipes après changement de statut
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
      console.error('Erreur:', err);
    }
  };

  const handleSave = async (equipeData: Partial<SAREquipe>) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier une équipe');
      }
      
      // Préparer les données à envoyer (convertir les chaînes vides en null)
      const dataToSend: any = {};
      if (equipeData.nom_equipe !== undefined) {
        dataToSend.nom_equipe = equipeData.nom_equipe;
      }
      if (equipeData.composition_equipe !== undefined) {
        dataToSend.composition_equipe = equipeData.composition_equipe && equipeData.composition_equipe.trim() ? equipeData.composition_equipe.trim() : null;
      }
      if (equipeData.remarque !== undefined) {
        dataToSend.remarque = equipeData.remarque && equipeData.remarque.trim() ? equipeData.remarque.trim() : null;
      }
      if (equipeData.actif !== undefined) {
        dataToSend.actif = equipeData.actif;
      }
      
      console.log('Données envoyées au serveur:', dataToSend);
      console.log('URL:', `http://localhost:8000/api/sar-equipe/${selectedEquipe!.id}`);
      
      const response = await fetch(`http://localhost:8000/api/sar-equipe/${selectedEquipe!.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      console.log('Réponse du serveur:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          console.error('Détails de l\'erreur:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('Erreur (texte):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updatedEquipe = await response.json();
      console.log('Équipe mise à jour avec succès:', updatedEquipe);

      setIsModalOpen(false);
      setSelectedEquipe(null);
      setError(''); // Effacer les erreurs précédentes
      await loadEquipes(); // Recharger toutes les équipes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification';
      setError(errorMessage);
      console.error('Erreur lors de la sauvegarde:', err);
      // Ne pas fermer le modal en cas d'erreur pour que l'utilisateur puisse corriger
    }
  };

  return (
    <div className="sar-page">
      <div className="page-header">
        <h1>Équipes SAR (Search and Rescue)</h1>
        <div className="header-actions">
          <label className="toggle-inactives">
            <input
              type="checkbox"
              checked={showInactives}
              onChange={(e) => setShowInactives(e.target.checked)}
            />
            Afficher toutes les équipes (actives et inactives)
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Chargement des équipes SAR...</div>}

      {!loading && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <SearchBar
              fields={searchFields}
              onSearch={handleSearch}
              onReset={handleResetSearch}
            />
          </div>

          {filteredEquipes.length === 0 && !error && (
            <div className="card empty-state">
              <p>Aucune équipe SAR trouvée avec les critères de recherche sélectionnés.</p>
            </div>
          )}

          {filteredEquipes.length > 0 && (
            <div className="equipes-grid">
              {filteredEquipes.map((equipe) => (
            <div key={equipe.id} className="card equipe-card">
              <h2>{equipe.nom_equipe}</h2>
              <div className="equipe-info">
                <div className="info-section">
                  <strong>Composition :</strong>
                  <p>{equipe.composition_equipe}</p>
                </div>
                {equipe.remarque && (
                  <div className="info-section">
                    <strong>Remarque :</strong>
                    <p>{equipe.remarque}</p>
                  </div>
                )}
                <div className="equipe-actions">
                  <div className="equipe-status">
                    <label className="status-toggle">
                      <input
                        type="checkbox"
                        checked={equipe.actif}
                        onChange={() => handleToggleActif(equipe)}
                        disabled={!canEdit}
                      />
                      <span className={`status-badge ${equipe.actif ? 'actif' : 'inactif'}`}>
                        {equipe.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </label>
                  </div>
                  {canEdit ? (
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(equipe)}
                      >
                        Modifier
                      </button>
                      {canDelete && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(equipe)}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'red', fontSize: '0.8rem' }}>
                      Pas de permissions (role: {user?.role || 'non défini'})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {isModalOpen && selectedEquipe && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier l'équipe SAR</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const nom_equipe = (formData.get('nom_equipe') as string)?.trim();
                const composition_equipe = (formData.get('composition_equipe') as string)?.trim() || null;
                const remarque = (formData.get('remarque') as string)?.trim() || null;
                const actif = formData.get('actif') === 'on';
                
                if (!nom_equipe) {
                  setError('Le nom de l\'équipe est obligatoire');
                  return;
                }
                
                console.log('Données du formulaire:', { nom_equipe, composition_equipe, remarque, actif });
                
                try {
                  await handleSave({
                    nom_equipe: nom_equipe,
                    composition_equipe: composition_equipe || undefined,
                    remarque: remarque || undefined,
                    actif: actif,
                  });
                } catch (err) {
                  console.error('Erreur lors de la sauvegarde:', err);
                }
              }}>
                <div className="form-group">
                  <label htmlFor="nom_equipe">Nom de l'équipe *</label>
                  <input
                    type="text"
                    id="nom_equipe"
                    name="nom_equipe"
                    defaultValue={selectedEquipe.nom_equipe}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="composition_equipe">Composition</label>
                  <textarea
                    id="composition_equipe"
                    name="composition_equipe"
                    rows={3}
                    defaultValue={selectedEquipe.composition_equipe}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="remarque">Remarque</label>
                  <textarea
                    id="remarque"
                    name="remarque"
                    rows={3}
                    defaultValue={selectedEquipe.remarque}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="actif"
                      defaultChecked={selectedEquipe.actif}
                    />
                    Actif
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAR;
