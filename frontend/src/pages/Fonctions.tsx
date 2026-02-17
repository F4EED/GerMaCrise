import React, { useEffect, useState } from 'react';
import api from '../services/api';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Fonction {
  id: number;
  nom: string;
  actif: boolean;
}

const Fonctions: React.FC = () => {
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [filteredFonctions, setFilteredFonctions] = useState<Fonction[]>([]);
  const [newNom, setNewNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFonctions = async () => {
    try {
      setError(null);
      const response = await api.get<Fonction[]>('/api/fonctions/');
      setFonctions(response.data);
      setFilteredFonctions(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger la liste des fonctions.");
    }
  };

  useEffect(() => {
    fetchFonctions();
  }, []);

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...fonctions];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          if (key === 'actif') {
            return String(item.actif) === value;
          }
          const fieldValue = item[key as keyof Fonction];
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredFonctions(filtered);
  };

  const handleResetSearch = () => {
    setFilteredFonctions(fonctions);
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
      await api.post<Fonction>('/api/fonctions/', { nom: newNom.trim(), actif: true });
      setNewNom('');
      await fetchFonctions();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'ajout de la fonction.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActif = async (fonction: Fonction) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<Fonction>(`/api/fonctions/${fonction.id}`, {
        actif: !fonction.actif,
      });
      await fetchFonctions();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour de la fonction.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette fonction ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/fonctions/${id}`);
      await fetchFonctions();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression de la fonction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Gestion des fonctions</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdd} className="form-inline">
        <input
          type="text"
          placeholder="Nouvelle fonction"
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
          {filteredFonctions.map((f) => (
            <tr key={f.id}>
              <td>{f.nom}</td>
              <td>
                <button
                  type="button"
                  className={`btn btn-sm ${f.actif ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => toggleActif(f)}
                  disabled={loading}
                >
                  {f.actif ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(f.id)}
                  disabled={loading}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {filteredFonctions.length === 0 && (
            <tr>
              <td colSpan={3}>Aucune fonction configurée.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Fonctions;


