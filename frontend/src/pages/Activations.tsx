import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useActivation, Activation as ActivationType } from '../contexts/ActivationContext';
import SearchBar, { SearchField } from '../components/SearchBar';
import ActivationModal from '../components/ActivationModal';

// Utiliser l'interface Activation du contexte
type Activation = ActivationType;

const Activations: React.FC = () => {
  const [activations, setActivations] = useState<Activation[]>([]);
  const [filteredActivations, setFilteredActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activationForModal, setActivationForModal] = useState<Activation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedActivation, setSelectedActivation } = useActivation();

  useEffect(() => {
    console.log('🔵 Activations - Composant monté');
    fetchActivations();
  }, []);

  const fetchActivations = async () => {
    try {
      console.log('🟢 Activations - fetchActivations appelé');
      setError(null);
      const response = await api.get<Activation[]>('/api/activations/');
      console.log('✅ Activations - Données reçues:', response.data);
      setActivations(response.data);
      setFilteredActivations(response.data);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des activations:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de charger les activations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...activations];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof Activation];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'actif') {
            return String(item.actif) === value;
          }
          
          if (key === 'structure_implique') {
            // Parse JSON array string
            try {
              const structures = JSON.parse(fieldValue as string);
              return structures.some((s: string) => s.toLowerCase().includes(value.toLowerCase()));
            } catch {
              return String(fieldValue).toLowerCase().includes(value.toLowerCase());
            }
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredActivations(filtered);
  };

  const handleResetSearch = () => {
    setFilteredActivations(activations);
  };

  const searchFields: SearchField[] = [
    { key: 'titre', label: 'Titre' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Statut' },
    { key: 'commune', label: 'Commune' },
    { key: 'secteur', label: 'Secteur' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'redacteur', label: 'Rédacteur' },
    { key: 'structure_implique', label: 'Structure impliquée' },
    {
      key: 'actif',
      label: 'Actif',
      type: 'select',
      options: [
        { value: 'true', label: 'Actif' },
        { value: 'false', label: 'Inactif' },
      ],
    },
  ];

  const handleAdd = () => {
    setActivationForModal(null);
    setModalOpen(true);
  };

  const handleEdit = (activation: Activation) => {
    setActivationForModal(activation);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setActivationForModal(null);
  };

  const handleModalSave = async () => {
    await fetchActivations();
    handleModalClose();
  };

  const toggleActif = async (activation: Activation) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<Activation>(`/api/activations/${activation.id}`, {
        actif: !activation.actif,
      });
      await fetchActivations();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette activation ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/activations/${id}`);
      await fetchActivations();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const parseStructures = (structureStr?: string): string[] => {
    if (!structureStr) return [];
    try {
      return JSON.parse(structureStr);
    } catch {
      return [];
    }
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  console.log('🎨 Activations - Rendu, activations:', activations.length, 'filtered:', filteredActivations.length, 'loading:', loading);

  if (loading && activations.length === 0) {
    return <div className="page-container">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Activations</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAdd}>
            + Ajouter une activation
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <SearchBar
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <table className="data-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Type</th>
            <th>Date création</th>
            <th>Date clôture</th>
            <th>Statut</th>
            <th>Commune</th>
            <th>Secteur</th>
            <th>Responsable</th>
            <th>Rédacteur</th>
            <th>Structures</th>
            <th>Actif</th>
            <th>Sélection</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredActivations.map((activation) => {
            const structures = parseStructures(activation.structure_implique);
            return (
              <tr key={activation.id}>
                <td>{activation.titre}</td>
                <td>{activation.type || '-'}</td>
                <td>{formatDate(activation.date_creation)}</td>
                <td>{formatDate(activation.date_cloture)}</td>
                <td>
                  <span className={`badge ${
                    activation.status === 'Clôturé' || activation.status === 'clôturée'
                      ? 'badge-success' 
                      : activation.status === 'Planifié' || activation.status === 'programmé'
                      ? 'badge-info' 
                      : activation.status === 'En cours' || activation.status === 'en cours'
                      ? 'badge-warning'
                      : 'badge-secondary'
                  }`}>
                    {activation.status || '-'}
                  </span>
                </td>
                <td>{activation.commune || '-'}</td>
                <td>{activation.secteur || '-'}</td>
                <td>{activation.responsable || '-'}</td>
                <td>{activation.redacteur || '-'}</td>
                <td>
                  {structures.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {structures.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={`btn btn-sm ${activation.actif ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => toggleActif(activation)}
                      disabled={loading}
                    >
                      {activation.actif ? 'Actif' : 'Inactif'}
                    </button>
                  ) : (
                    <span>{activation.actif ? 'Actif' : 'Inactif'}</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedActivation?.id === activation.id ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => {
                      if (selectedActivation?.id === activation.id) {
                        setSelectedActivation(null);
                      } else {
                        setSelectedActivation(activation);
                      }
                    }}
                    disabled={loading}
                    title={selectedActivation?.id === activation.id ? 'Désélectionner' : 'Sélectionner cette activation'}
                  >
                    {selectedActivation?.id === activation.id ? '✓ Sélectionnée' : 'Sélectionner'}
                  </button>
                </td>
                {isAdmin && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEdit(activation)}
                      disabled={loading}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(activation.id)}
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {filteredActivations.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 13 : 12}>Aucune activation trouvée.</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <ActivationModal
          activation={activationForModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default Activations;

