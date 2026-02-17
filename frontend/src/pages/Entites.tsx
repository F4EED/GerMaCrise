import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EntiteModal from '../components/EntiteModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface EntiteItem {
  id: number;
  nom: string;
  actif: boolean;
}

const Entites: React.FC = () => {
  const [entites, setEntites] = useState<EntiteItem[]>([]);
  const [filteredEntites, setFilteredEntites] = useState<EntiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntite, setSelectedEntite] = useState<EntiteItem | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchEntites();
  }, []);

  const fetchEntites = async () => {
    try {
      const response = await api.get('/api/entites/');
      setEntites(response.data);
      setFilteredEntites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des entités:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...entites];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof EntiteItem];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'actif') {
            const actifValue = value === 'oui' || value === 'true';
            return item.actif === actifValue;
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredEntites(filtered);
  };

  const handleResetSearch = () => {
    setFilteredEntites(entites);
  };

  const searchFields: SearchField[] = [
    { key: 'nom', label: 'Nom' },
    {
      key: 'actif',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'oui', label: 'Actif' },
        { value: 'non', label: 'Inactif' },
      ],
    },
  ];

  const handleAdd = () => {
    setSelectedEntite(null);
    setModalOpen(true);
  };

  const handleEdit = (entite: EntiteItem) => {
    setSelectedEntite(entite);
    setModalOpen(true);
  };

  const handleSave = async (entiteData: any) => {
    try {
      if (selectedEntite) {
        await api.put(`/api/entites/${selectedEntite.id}`, entiteData);
      } else {
        await api.post('/api/entites/', entiteData);
      }
      await fetchEntites();
      setModalOpen(false);
      setSelectedEntite(null);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cette entité ?')) {
      return;
    }
    try {
      await api.delete(`/api/entites/${id}`);
      await fetchEntites();
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      alert('Erreur lors de la désactivation de l\'entité');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="entites">
      <div className="page-header">
        <h1>Entités</h1>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <button className="btn btn-primary" onClick={handleAdd}>
            Ajouter
          </button>
        )}
      </div>
      <SearchBar
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntites.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredEntites.map((entite) => (
              <tr key={entite.id}>
                <td>{entite.id}</td>
                <td>{entite.nom}</td>
                <td>
                  <span className={`badge ${entite.actif ? 'badge-success' : 'badge-danger'}`}>
                    {entite.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(entite)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(entite.id)}
                      >
                        Désactiver
                      </button>
                    </>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EntiteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntite(null);
        }}
        onSave={handleSave}
        entite={selectedEntite}
      />
    </div>
  );
};

export default Entites;

