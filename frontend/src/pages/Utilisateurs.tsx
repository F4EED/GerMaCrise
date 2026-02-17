import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UserModal from '../components/UserModal';
import SearchBar, { SearchField } from '../components/SearchBar';

interface Utilisateur {
  id: number;
  username: string;
  email: string;
  nom?: string;
  prenom?: string;
  structure_id?: number;
  structure?: { id: number; nom: string } | null;
  role?: string;
  actif: boolean;
}

const Utilisateurs: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const fetchUtilisateurs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/users');
      console.log('✅ Utilisateurs chargés:', response.data?.length || 0);
      setUtilisateurs(response.data || []);
      setFilteredUtilisateurs(response.data || []);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      setUtilisateurs([]);
      setFilteredUtilisateurs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...utilisateurs];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof Utilisateur];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'structure') {
            return item.structure?.nom?.toLowerCase().includes(value.toLowerCase()) || false;
          }
          
          if (key === 'actif') {
            const actifValue = value === 'oui' || value === 'true';
            return item.actif === actifValue;
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredUtilisateurs(filtered);
  };

  const handleResetSearch = () => {
    setFilteredUtilisateurs(utilisateurs);
  };

  const searchFields: SearchField[] = [
    { key: 'username', label: 'Nom d\'utilisateur' },
    { key: 'email', label: 'Email' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    {
      key: 'role',
      label: 'Rôle',
      type: 'select',
      options: [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Administrateur' },
        { value: 'operateur', label: 'Opérateur' },
        { value: 'utilisateur', label: 'Utilisateur' },
      ],
    },
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
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (utilisateur: Utilisateur) => {
    setSelectedUser(utilisateur);
    setModalOpen(true);
  };

  const handleSave = async (userData: any) => {
    if (selectedUser) {
      // Modification
      await api.put(`/api/users/${selectedUser.id}`, userData);
    } else {
      // Création
      await api.post('/api/users', userData);
    }
    await fetchUtilisateurs();
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: string } = {
      super_admin: 'badge-danger',
      admin: 'badge-warning',
      operateur: 'badge-info',
      utilisateur: 'badge',
    };
    return roleMap[role] || 'badge';
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      super_admin: 'Super Admin',
      admin: 'Administrateur',
      operateur: 'Opérateur',
      utilisateur: 'Utilisateur',
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="utilisateurs">
      <div className="page-header">
        <h1>Utilisateurs</h1>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <button className="btn btn-primary" onClick={handleAdd}>
            Ajouter
          </button>
        )}
      </div>
      {error && (
        <div className="error-message" style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}
      <SearchBar
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
              <th>Email</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Structure</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtilisateurs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredUtilisateurs.map((utilisateur) => (
              <tr key={utilisateur.id}>
                <td>{utilisateur.username}</td>
                <td>{utilisateur.email}</td>
                <td>{utilisateur.nom || '-'}</td>
                <td>{utilisateur.prenom || '-'}</td>
                <td>{utilisateur.structure?.nom || '-'}</td>
                <td>
                  <span className={`badge ${getRoleBadge(utilisateur.role || '')}`}>
                    {getRoleLabel(utilisateur.role || '')}
                  </span>
                </td>
                <td>
                  <span className={`badge ${utilisateur.actif ? 'badge-success' : 'badge-danger'}`}>
                    {utilisateur.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(utilisateur)}
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

      <UserModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSave}
        user={selectedUser ? {
          id: selectedUser.id,
          username: selectedUser.username,
          email: selectedUser.email,
          nom: selectedUser.nom,
          prenom: selectedUser.prenom,
          structure_id: selectedUser.structure_id,
          role: selectedUser.role ?? 'utilisateur',
          actif: selectedUser.actif,
        } : null}
      />
    </div>
  );
};

export default Utilisateurs;

