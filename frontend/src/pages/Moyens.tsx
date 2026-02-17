import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MoyenModal from '../components/MoyenModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Moyen {
  id: number;
  code: string;
  nom: string;
  categorie?: string;
  nombre?: number;
  service_utilisateur?: string;
  modele?: string;
  numero_serie?: string;
  date_acquisition?: string;
  date_garantie?: string;
  numero_inventaire?: string;
  affectation?: string;
  stockage?: string;
  description?: string;
  structure_id?: number;
  structure?: { id: number; nom: string } | null;
  statut: string;
  etat: string;
  actif: boolean;
}

const Moyens: React.FC = () => {
  const [moyens, setMoyens] = useState<Moyen[]>([]);
  const [filteredMoyens, setFilteredMoyens] = useState<Moyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMoyen, setSelectedMoyen] = useState<Moyen | null>(null);
  const [entites, setEntites] = useState<Array<{ id: number; nom: string }>>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchMoyens();
    fetchEntites();
  }, []);

  const fetchEntites = async () => {
    try {
      const response = await api.get('/api/entites');
      console.log('📋 Entités chargées pour recherche:', response.data);
      console.log('📊 Nombre d\'entités:', response.data?.length);
      setEntites(response.data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des entités:', error);
      setEntites([]);
    }
  };

  const fetchMoyens = async () => {
    try {
      const response = await api.get('/api/moyens');
      console.log('📦 Moyens reçus:', response.data);
      console.log('📊 Nombre de moyens:', response.data?.length);
      setMoyens(response.data);
      setFilteredMoyens(response.data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des moyens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...moyens];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          // Gestion spéciale pour le champ structure (objet avec propriété nom)
          // Recherche par correspondance exacte car c'est un select
          if (key === 'structure') {
            const moyen = item as any;
            return moyen.structure?.nom?.toLowerCase() === value.toLowerCase() || false;
          }
          
          const fieldValue = item[key as keyof Moyen];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          // Pour le statut et l'état, faire une correspondance exacte (car ce sont des selects)
          if (key === 'statut' || key === 'etat') {
            return String(fieldValue).toLowerCase() === value.toLowerCase();
          }
          
          // Pour les autres champs, recherche partielle
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredMoyens(filtered);
  };

  const handleResetSearch = () => {
    setFilteredMoyens(moyens);
  };

  const searchFields: SearchField[] = useMemo(() => {
    console.log('🔍 Création searchFields - entites:', entites);
    return [
      { key: 'code', label: 'Code' },
      { key: 'nom', label: 'Nom' },
      { key: 'categorie', label: 'Catégorie' },
      {
        key: 'structure',
        label: 'Structure',
        type: 'select',
        options: entites && entites.length > 0 ? entites.map(entite => ({
          value: entite.nom,
          label: entite.nom
        })) : [{ value: '', label: 'Chargement...' }],
      },
      { key: 'service_utilisateur', label: 'Service' },
      { key: 'modele', label: 'Modèle' },
      { key: 'numero_inventaire', label: 'N° Inventaire' },
      {
        key: 'statut',
        label: 'Statut',
        type: 'select',
        options: [
          { value: 'Disponible', label: 'Disponible' },
          { value: 'En mission', label: 'En mission' },
          { value: 'En panne', label: 'En panne' },
          { value: 'Accidenté', label: 'Accidenté' },
          { value: 'Volé', label: 'Volé' },
          { value: 'Autre', label: 'Autre' },
          { value: 'Opérationnel', label: 'Opérationnel' },
          { value: 'Panne', label: 'Panne' },
          { value: 'Usage limité', label: 'Usage limité' },
          { value: 'En prêt', label: 'En prêt' },
          { value: 'En réparation', label: 'En réparation' },
          { value: 'En révision', label: 'En révision' },
          { value: 'Réformé', label: 'Réformé' },
          { value: 'Vendu', label: 'Vendu' },
          { value: 'Détruit', label: 'Détruit' },
          { value: 'Perdu', label: 'Perdu' },
          { value: 'Rendu', label: 'Rendu' },
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
  }, [entites]);

  const handleAdd = () => {
    setSelectedMoyen(null);
    setModalOpen(true);
  };

  const handleEdit = (moyen: Moyen) => {
    setSelectedMoyen(moyen);
    setModalOpen(true);
  };

  const handleSave = async (moyenData: any) => {
    if (selectedMoyen) {
      // Modification
      await api.put(`/api/moyens/${selectedMoyen.id}`, moyenData);
    } else {
      // Création
      await api.post('/api/moyens', moyenData);
    }
    await fetchMoyens();
  };

  const getStatutBadge = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      // Statuts de status_moyen.json
      'Disponible': 'badge-success',
      'En mission': 'badge-info',
      'En panne': 'badge-danger',
      'Accidenté': 'badge-danger',
      'Volé': 'badge-danger',
      'Autre': 'badge-secondary',
      // Statuts de status_materiel.json
      'Opérationnel': 'badge-success',
      'Panne': 'badge-danger',
      'Usage limité': 'badge-warning',
      'En prêt': 'badge-warning',
      'En réparation': 'badge-warning',
      'En révision': 'badge-warning',
      'Réformé': 'badge-secondary',
      'Vendu': 'badge-secondary',
      'Détruit': 'badge-danger',
      'Perdu': 'badge-danger',
      'Rendu': 'badge-warning',
    };
    return statutMap[statut] || 'badge';
  };

  const getStatutLabel = (statut: string) => {
    return statut; // Les statuts sont déjà en français dans Germacrise
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
    <div className="moyens">
      <div className="page-header">
        <h1>Moyens</h1>
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
              <th>Code</th>
              <th>Matériel</th>
              <th>Catégorie</th>
              <th>Nombre</th>
              <th>Structure</th>
              <th>Service</th>
              <th>Statut</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMoyens.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredMoyens.map((moyen) => (
              <tr key={moyen.id}>
                <td>{moyen.code}</td>
                <td>{moyen.nom}</td>
                <td>{moyen.categorie || '-'}</td>
                <td>{moyen.nombre || 1}</td>
                <td>{moyen.structure?.nom || '-'}</td>
                <td>{moyen.service_utilisateur || '-'}</td>
                <td>
                  <span className={`badge ${getStatutBadge(moyen.statut)}`}>
                    {getStatutLabel(moyen.statut)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getEtatBadge(moyen.etat)}`}>
                    {getEtatLabel(moyen.etat)}
                  </span>
                </td>
                <td>
                  {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur') && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(moyen)}
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

      <MoyenModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMoyen(null);
        }}
        onSave={handleSave}
        moyen={selectedMoyen}
      />
    </div>
  );
};

export default Moyens;

