import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SiteIndustrielModal from '../components/SiteIndustrielModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface SiteIndustriel {
  id: number;
  nom: string;
  nom_entreprise?: string;
  secteur_activite?: string;
  nom_dirigeant?: string;
  tel_dirigeant?: string;
  tel_std?: string;
  adresse_postale?: string;
  num_rue?: string;
  nom_rue?: string;
  code_postal?: string;
  ville?: string;
  latitude?: string;
  longitude?: string;
  surface?: string;
  nb_batiment?: string;
  risques?: string;
  ppi?: boolean;
  chemin_acces_ppi?: string;
  status_ppi?: string;
  capacite_production?: string;
  effectif?: number;
  observations?: string;
  telephone_fixe?: string;
  telephone_portable?: string;
  telephone_astreinte?: string;
  fax?: string;
  email?: string;
  commentaire?: string;
  actif: boolean;
}

const SitesIndustriels: React.FC = () => {
  const [sites, setSites] = useState<SiteIndustriel[]>([]);
  const [filteredSites, setFilteredSites] = useState<SiteIndustriel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteIndustriel | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await api.get('/api/sites-industriels');
      setSites(response.data);
      setFilteredSites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sites industriels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...sites];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof SiteIndustriel];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'ppi') {
            const ppiValue = value === 'oui' || value === 'true';
            return item.ppi === ppiValue;
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredSites(filtered);
  };

  const handleResetSearch = () => {
    setFilteredSites(sites);
  };

  const searchFields: SearchField[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'nom_entreprise', label: 'Entreprise' },
    { key: 'secteur_activite', label: 'Secteur d\'activité' },
    { key: 'ville', label: 'Ville' },
    { key: 'code_postal', label: 'Code postal' },
    { key: 'nom_dirigeant', label: 'Dirigeant' },
    {
      key: 'ppi',
      label: 'PPI',
      type: 'select',
      options: [
        { value: 'oui', label: 'Oui' },
        { value: 'non', label: 'Non' },
      ],
    },
  ];

  const handleAdd = () => {
    setSelectedSite(null);
    setModalOpen(true);
  };

  const handleEdit = (site: SiteIndustriel) => {
    setSelectedSite(site);
    setModalOpen(true);
  };

  const handleSave = async (siteData: any) => {
    if (selectedSite) {
      // Modification
      await api.put(`/api/sites-industriels/${selectedSite.id}`, siteData);
    } else {
      // Création
      await api.post('/api/sites-industriels', siteData);
    }
    await fetchSites();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="sites-industriels">
      <div className="page-header">
        <h1>Gestion Sites Industriels</h1>
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
              <th>Nom</th>
              <th>Entreprise</th>
              <th>Secteur</th>
              <th>Adresse</th>
              <th>Ville</th>
              <th>Dirigeant</th>
              <th>Téléphone</th>
              <th>PPI</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredSites.map((site) => (
              <tr key={site.id}>
                <td>{site.nom}</td>
                <td>{site.nom_entreprise || '-'}</td>
                <td>{site.secteur_activite || '-'}</td>
                <td>
                  {site.adresse_postale || (site.num_rue && site.nom_rue
                    ? `${site.num_rue} ${site.nom_rue}`
                    : site.nom_rue || '-')}
                </td>
                <td>{site.ville || '-'}</td>
                <td>{site.nom_dirigeant || '-'}</td>
                <td>{site.tel_dirigeant || site.tel_std || site.telephone_fixe || site.telephone_portable || '-'}</td>
                <td>
                  {site.ppi ? (
                    <span className="badge badge-warning">Oui</span>
                  ) : (
                    <span className="badge">Non</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${site.actif ? 'badge-success' : 'badge-danger'}`}>
                    {site.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur') && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(site)}
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

      <SiteIndustrielModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSite(null);
        }}
        onSave={handleSave}
        site={selectedSite}
      />
    </div>
  );
};

export default SitesIndustriels;
