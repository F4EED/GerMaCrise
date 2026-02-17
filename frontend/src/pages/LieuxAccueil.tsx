import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SearchBar, { SearchField } from '../components/SearchBar';
import LieuAccueilModal from '../components/LieuAccueilModal';

interface LieuAccueil {
  id: number;
  nom_site: string;
  commune?: string;
  surface?: number;
  nb_accueil?: number;
  nb_hebergement?: number;
  nb_ravitaillement?: number;
  autres_ressource?: string;
  telephone_responsable?: string;
  adresse?: string;
  actif: boolean;
}

const LieuxAccueil: React.FC = () => {
  const [lieux, setLieux] = useState<LieuAccueil[]>([]);
  const [filteredLieux, setFilteredLieux] = useState<LieuAccueil[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLieu, setSelectedLieu] = useState<LieuAccueil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔵 LieuxAccueil - Composant monté');
    fetchLieux();
  }, []);

  const fetchLieux = async () => {
    try {
      console.log('🟢 LieuxAccueil - fetchLieux appelé');
      setError(null);
      const response = await api.get<LieuAccueil[]>('/api/lieux-accueil/');
      console.log('✅ LieuxAccueil - Données reçues:', response.data);
      setLieux(response.data);
      setFilteredLieux(response.data);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des lieux d\'accueil:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de charger les lieux d'accueil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...lieux];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof LieuAccueil];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'actif') {
            return String(item.actif) === value;
          }
          
          if (typeof fieldValue === 'number') {
            return String(fieldValue).includes(value);
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredLieux(filtered);
  };

  const handleResetSearch = () => {
    setFilteredLieux(lieux);
  };

  const searchFields: SearchField[] = [
    { key: 'nom_site', label: 'Nom du site' },
    { key: 'commune', label: 'Commune' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'telephone_responsable', label: 'Téléphone responsable' },
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
    setSelectedLieu(null);
    setModalOpen(true);
  };

  const handleEdit = (lieu: LieuAccueil) => {
    setSelectedLieu(lieu);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLieu(null);
  };

  const handleModalSave = async () => {
    await fetchLieux();
    handleModalClose();
  };

  const toggleActif = async (lieu: LieuAccueil) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<LieuAccueil>(`/api/lieux-accueil/${lieu.id}`, {
        actif: !lieu.actif,
      });
      await fetchLieux();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour du lieu d'accueil.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce lieu d\'accueil ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/lieux-accueil/${id}`);
      await fetchLieux();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression du lieu d'accueil.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  console.log('🎨 LieuxAccueil - Rendu, lieux:', lieux.length, 'filtered:', filteredLieux.length, 'loading:', loading);

  if (loading && lieux.length === 0) {
    return <div className="page-container">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', borderRadius: '4px' }}>
        🔴 DEBUG: Composant LieuxAccueil rendu | Lieux: {lieux.length} | Filtrés: {filteredLieux.length} | Loading: {loading ? 'Oui' : 'Non'} | Error: {error || 'Aucune'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Lieux d'accueil</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAdd}>
            + Ajouter un lieu
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
            <th>Nom du site</th>
            <th>Commune</th>
            <th>Adresse</th>
            <th>Surface (m²)</th>
            <th>Nb. accueil</th>
            <th>Nb. hébergement</th>
            <th>Nb. ravitaillement</th>
            <th>Tél. responsable</th>
            <th>Actif</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredLieux.map((lieu) => (
            <tr key={lieu.id}>
              <td>{lieu.nom_site}</td>
              <td>{lieu.commune || '-'}</td>
              <td>{lieu.adresse || '-'}</td>
              <td>{lieu.surface || '-'}</td>
              <td>{lieu.nb_accueil || '-'}</td>
              <td>{lieu.nb_hebergement || '-'}</td>
              <td>{lieu.nb_ravitaillement || '-'}</td>
              <td>{lieu.telephone_responsable || '-'}</td>
              <td>
                {isAdmin ? (
                  <button
                    type="button"
                    className={`btn btn-sm ${lieu.actif ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => toggleActif(lieu)}
                    disabled={loading}
                  >
                    {lieu.actif ? 'Actif' : 'Inactif'}
                  </button>
                ) : (
                  <span>{lieu.actif ? 'Actif' : 'Inactif'}</span>
                )}
              </td>
              {isAdmin && (
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(lieu)}
                    disabled={loading}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(lieu.id)}
                    disabled={loading}
                  >
                    Supprimer
                  </button>
                </td>
              )}
            </tr>
          ))}
          {filteredLieux.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 10 : 9}>Aucun lieu d'accueil trouvé.</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <LieuAccueilModal
          lieu={selectedLieu}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default LieuxAccueil;

