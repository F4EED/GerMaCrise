import React, { useEffect, useState } from 'react';
import api from '../services/api';
import SearchBar, { SearchField } from '../components/SearchBar';
import './Evenements.css';

interface Evenement {
  id: number;
  titre: string;
  type: string;
  date_debut: string;
  statut: string;
  priorite: string;
}

const Evenements: React.FC = () => {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [filteredEvenements, setFilteredEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvenements();
  }, []);

  const fetchEvenements = async () => {
    try {
      const response = await api.get('/api/evenements');
      setEvenements(response.data);
      setFilteredEvenements(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...evenements];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof Evenement];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'date_debut' && value) {
            const itemDate = new Date(fieldValue as string).toLocaleDateString('fr-FR');
            return itemDate.includes(value);
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredEvenements(filtered);
  };

  const handleResetSearch = () => {
    setFilteredEvenements(evenements);
  };

  const searchFields: SearchField[] = [
    { key: 'titre', label: 'Titre' },
    { key: 'type', label: 'Type' },
    { key: 'date_debut', label: 'Date début', type: 'date' },
    {
      key: 'statut',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'en_cours', label: 'En cours' },
        { value: 'termine', label: 'Terminé' },
        { value: 'annule', label: 'Annulé' },
      ],
    },
    {
      key: 'priorite',
      label: 'Priorité',
      type: 'select',
      options: [
        { value: 'basse', label: 'Basse' },
        { value: 'moyenne', label: 'Moyenne' },
        { value: 'haute', label: 'Haute' },
        { value: 'critique', label: 'Critique' },
      ],
    },
  ];

  const getBadgeClass = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'badge badge-info';
      case 'termine':
        return 'badge badge-success';
      case 'annule':
        return 'badge badge-danger';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="evenements">
      <div className="page-header">
        <h1>Événements</h1>
        <button className="btn btn-primary">Nouvel événement</button>
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
              <th>Titre</th>
              <th>Type</th>
              <th>Date début</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvenements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredEvenements.map((evenement) => (
              <tr key={evenement.id}>
                <td>{evenement.titre}</td>
                <td>{evenement.type}</td>
                <td>{new Date(evenement.date_debut).toLocaleString('fr-FR')}</td>
                <td>
                  <span className={getBadgeClass(evenement.statut)}>
                    {evenement.statut}
                  </span>
                </td>
                <td>{evenement.priorite}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
                    Voir
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Evenements;

