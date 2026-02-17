import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VehiculeModal from '../components/VehiculeModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Vehicule {
  id: number;
  immatriculation: string;
  type_vehicule?: string;
  marque?: string;
  modele?: string;
  annee?: number;
  structure_id?: number;
  structure?: { id: number; nom: string } | null;
  service_affectation?: string;
  km_acquisition?: number;
  km_actuel?: number;
  km_revision?: number;
  prochain_ct?: string;
  prochaine_revision?: string;
  numero_inventaire?: string;
  commentaire?: string;
  capacite?: number;
  localisation?: string;
  statut: string;
  etat: string;
  actif: boolean;
}

const Vehicules: React.FC = () => {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [filteredVehicules, setFilteredVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchVehicules();
  }, []);

  const fetchVehicules = async () => {
    try {
      const response = await api.get('/api/vehicules');
      setVehicules(response.data);
      setFilteredVehicules(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...vehicules];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof Vehicule];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'structure') {
            return item.structure?.nom?.toLowerCase().includes(value.toLowerCase()) || false;
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredVehicules(filtered);
  };

  const handleResetSearch = () => {
    setFilteredVehicules(vehicules);
  };

  const searchFields: SearchField[] = [
    { key: 'immatriculation', label: 'Immatriculation' },
    { key: 'type_vehicule', label: 'Type de véhicule' },
    { key: 'marque', label: 'Marque' },
    { key: 'modele', label: 'Modèle' },
    { key: 'service_affectation', label: 'Service' },
    {
      key: 'statut',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'en_mission', label: 'En mission' },
        { value: 'en_maintenance', label: 'En maintenance' },
        { value: 'hors_service', label: 'Hors service' },
      ],
    },
    {
      key: 'etat',
      label: 'État',
      type: 'select',
      options: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'indisponible', label: 'Indisponible' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
  ];

  const handleAdd = () => {
    setSelectedVehicule(null);
    setModalOpen(true);
  };

  const handleEdit = (vehicule: Vehicule) => {
    setSelectedVehicule(vehicule);
    setModalOpen(true);
  };

  const handleSave = async (vehiculeData: any) => {
    if (selectedVehicule) {
      // Modification
      await api.put(`/api/vehicules/${selectedVehicule.id}`, vehiculeData);
    } else {
      // Création
      await api.post('/api/vehicules', vehiculeData);
    }
    await fetchVehicules();
  };

  const getStatutBadge = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      disponible: 'badge-success',
      en_mission: 'badge-warning',
      en_maintenance: 'badge-warning',
      hors_service: 'badge-danger',
    };
    return statutMap[statut] || 'badge';
  };

  const getStatutLabel = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      disponible: 'Disponible',
      en_mission: 'En mission',
      en_maintenance: 'En maintenance',
      hors_service: 'Hors service',
    };
    return statutMap[statut] || statut;
  };

  const getEtatBadge = (etat: string) => {
    const etatMap: { [key: string]: string } = {
      disponible: 'badge-success',
      indisponible: 'badge-danger',
      maintenance: 'badge-warning',
    };
    return etatMap[etat] || 'badge';
  };

  const getEtatLabel = (etat: string) => {
    const etatMap: { [key: string]: string } = {
      disponible: 'Disponible',
      indisponible: 'Indisponible',
      maintenance: 'Maintenance',
    };
    return etatMap[etat] || etat;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="vehicules">
      <div className="page-header">
        <h1>Véhicules</h1>
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
        <table className="table">
          <thead>
            <tr>
              <th>Immatriculation</th>
              <th>Type</th>
              <th>Marque/Modèle</th>
              <th>Structure</th>
              <th>Service</th>
              <th>Km actuel</th>
              <th>Statut</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicules.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredVehicules.map((vehicule) => (
              <tr key={vehicule.id}>
                <td>{vehicule.immatriculation}</td>
                <td>{vehicule.type_vehicule || '-'}</td>
                <td>{vehicule.marque && vehicule.modele ? `${vehicule.marque} ${vehicule.modele}` : vehicule.marque || vehicule.modele || '-'}</td>
                <td>{vehicule.structure?.nom || '-'}</td>
                <td>{vehicule.service_affectation || '-'}</td>
                <td>{vehicule.km_actuel ? `${vehicule.km_actuel.toLocaleString()} km` : '-'}</td>
                <td>
                  <span className={`badge ${getStatutBadge(vehicule.statut)}`}>
                    {getStatutLabel(vehicule.statut)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getEtatBadge(vehicule.etat)}`}>
                    {getEtatLabel(vehicule.etat)}
                  </span>
                </td>
                <td>
                  {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur') && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(vehicule)}
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
      </div>

      <VehiculeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedVehicule(null);
        }}
        onSave={handleSave}
        vehicule={selectedVehicule}
      />
    </div>
  );
};

export default Vehicules;

