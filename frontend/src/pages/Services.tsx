import React, { useEffect, useState } from 'react';
import api from '../services/api';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Service {
  id: number;
  nom: string;
  actif: boolean;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [newNom, setNewNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setError(null);
      const response = await api.get<Service[]>('/api/services/');
      setServices(response.data);
      setFilteredServices(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err);
      const errorMessage = err.response?.data?.detail || err.message || "Impossible de charger la liste des services.";
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...services];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          if (key === 'actif') {
            return String(item.actif) === value;
          }

          const fieldValue = item[key as keyof Service];
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredServices(filtered);
  };

  const handleResetSearch = () => {
    setFilteredServices(services);
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
      await api.post<Service>('/api/services/', { nom: newNom.trim(), actif: true });
      setNewNom('');
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || "Erreur lors de l'ajout du service.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActif = async (service: Service) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<Service>(`/api/services/${service.id}`, {
        actif: !service.actif,
      });
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour du service.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce service ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/services/${id}`);
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression du service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Gestion des services</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdd} className="form-inline">
        <input
          type="text"
          placeholder="Nouveau service"
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
          {filteredServices.map((s) => (
            <tr key={s.id}>
              <td>{s.nom}</td>
              <td>
                <button
                  type="button"
                  className={`btn btn-sm ${s.actif ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => toggleActif(s)}
                  disabled={loading}
                >
                  {s.actif ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(s.id)}
                  disabled={loading}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {filteredServices.length === 0 && (
            <tr>
              <td colSpan={3}>Aucun service configuré.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Services;

