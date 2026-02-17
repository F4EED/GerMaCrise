import React, { useEffect, useState } from 'react';
import api from '../services/api';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Risque {
  id: number;
  nom: string;
  actif: boolean;
}

const Risques: React.FC = () => {
  const [risques, setRisques] = useState<Risque[]>([]);
  const [filteredRisques, setFilteredRisques] = useState<Risque[]>([]);
  const [newNom, setNewNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisques = async () => {
    try {
      setError(null);
      const response = await api.get<Risque[]>('/api/risques/');
      setRisques(response.data);
      setFilteredRisques(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des risques:', err);
      const errorMessage = err.response?.data?.detail || err.message || "Impossible de charger la liste des risques.";
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchRisques();
  }, []);

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...risques];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          if (key === 'actif') {
            // value est "true" ou "false"
            return String(item.actif) === value;
          }

          const fieldValue = item[key as keyof Risque];
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredRisques(filtered);
  };

  const handleResetSearch = () => {
    setFilteredRisques(risques);
  };

  const searchFields: SearchField[] = [
    { key: 'nom', label: 'Nom' },
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.post<Risque>('/api/risques/', { nom: newNom.trim(), actif: true });
      setNewNom('');
      await fetchRisques();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'ajout du risque.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActif = async (risque: Risque) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<Risque>(`/api/risques/${risque.id}`, {
        actif: !risque.actif,
      });
      await fetchRisques();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour du risque.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce risque ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/risques/${id}`);
      await fetchRisques();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression du risque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Gestion des risques</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdd} className="form-inline">
        <input
          type="text"
          placeholder="Nouveau risque"
          value={newNom}
          onChange={(e) => setNewNom(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Ajouter
        </button>
      </form>

      <SearchBar
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRisques.map((r) => (
            <tr key={r.id}>
              <td>{r.nom}</td>
              <td>
                <button
                  type="button"
                  className={`btn btn-sm ${r.actif ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => toggleActif(r)}
                  disabled={loading}
                >
                  {r.actif ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(r.id)}
                  disabled={loading}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {filteredRisques.length === 0 && (
            <tr>
              <td colSpan={3}>Aucun risque configuré.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Risques;


