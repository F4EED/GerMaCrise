import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PersonnelModal from '../components/PersonnelModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface PersonnelItem {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nom_court?: string;
  structure_id?: number;
  structure?: { id: number; nom: string } | null;
  fonction?: string;
  service?: string;
  telephone?: string;
  telephone2?: string;
  email?: string;
  email2?: string;
  id_meshtastic?: string;
  nom_meshtastic?: string;
  nom_court_meshtastic?: string;
  commentaire?: string;
  statut: string;
  actif: boolean;
}

const Personnel: React.FC = () => {
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<PersonnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelItem | null>(null);
  const [entites, setEntites] = useState<Array<{ id: number; nom: string }>>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPersonnel();
    fetchEntites();
  }, []);

  const fetchEntites = async () => {
    try {
      const response = await api.get('/api/entites/');
      setEntites(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des entités:', error);
      setEntites([]);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const response = await api.get('/api/personnel');
      setPersonnel(response.data);
      setFilteredPersonnel(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...personnel];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof PersonnelItem];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'structure') {
            // Recherche par nom de structure (correspondance exacte pour un select)
            return item.structure?.nom?.toLowerCase() === value.toLowerCase() || false;
          }
          
          // Pour le statut, faire une correspondance exacte (car c'est un select)
          if (key === 'statut') {
            return String(fieldValue).toLowerCase() === value.toLowerCase();
          }
          
          // Pour les autres champs, recherche partielle
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredPersonnel(filtered);
  };

  const handleResetSearch = () => {
    setFilteredPersonnel(personnel);
  };

  const searchFields: SearchField[] = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'service', label: 'Service' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    {
      key: 'structure',
      label: 'Structure',
      type: 'select',
      options: entites && entites.length > 0 
        ? entites.map(entite => ({
            value: entite.nom,
            label: entite.nom
          }))
        : [{ value: '', label: 'Chargement...' }],
    },
    {
      key: 'statut',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'occupe', label: 'Occupé' },
        { value: 'repos', label: 'Repos' },
        { value: 'absent', label: 'Absent' },
        { value: 'engage', label: 'Engagé' },
        { value: 'non_disponible', label: 'Non disponible' },
      ],
    },
  ];

  const handleAdd = () => {
    setSelectedPersonnel(null);
    setModalOpen(true);
  };

  const handleEdit = (p: PersonnelItem) => {
    setSelectedPersonnel(p);
    setModalOpen(true);
  };

  const handleSave = async (personnelData: any) => {
    if (selectedPersonnel) {
      // Modification
      await api.put(`/api/personnel/${selectedPersonnel.id}`, personnelData);
    } else {
      // Création
      await api.post('/api/personnel', personnelData);
    }
    await fetchPersonnel();
  };

  const getStatutBadge = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      disponible: 'badge-success',
      occupe: 'badge-warning',
      repos: 'badge-info',
      absent: 'badge-danger',
      engage: 'badge-primary',
      non_disponible: 'badge-secondary',
    };
    return statutMap[statut] || 'badge';
  };

  const getStatutLabel = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      disponible: 'Disponible',
      occupe: 'Occupé',
      repos: 'Repos',
      absent: 'Absent',
      engage: 'Engagé',
      non_disponible: 'Non disponible',
    };
    return statutMap[statut] || statut;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="personnel">
      <div className="page-header">
        <h1>Personnel</h1>
        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur') && (
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
        {personnel.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Aucun personnel enregistré
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Structure</th>
                <th>Fonction</th>
                <th>Service</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun résultat trouvé ({personnel.length} enregistrement(s) au total)
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p) => (
                <tr key={p.id}>
                  <td>{p.matricule}</td>
                  <td>{p.nom}</td>
                  <td>{p.prenom}</td>
                  <td>{p.structure?.nom || '-'}</td>
                  <td>{p.fonction || '-'}</td>
                  <td>{p.service || '-'}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(p.statut)}`}>
                      {getStatutLabel(p.statut)}
                    </span>
                  </td>
                  <td>
                    {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur') && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(p)}
                      >
                        Modifier
                      </button>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <PersonnelModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPersonnel(null);
        }}
        onSave={handleSave}
        personnel={selectedPersonnel}
      />
    </div>
  );
};

export default Personnel;

