import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SearchBar, { SearchField } from '../components/SearchBar';
import ContactModal from '../components/ContactModal';

interface ContactCrise {
  id: number;
  nom: string;
  prenom: string;
  tel_bureau?: string;
  tel_portable?: string;
  tel_personnel?: string;
  structure?: string;
  fonction?: string;
  mail?: string;
  remarques?: string;
  actif: boolean;
}

const AnnuaireCrise: React.FC = () => {
  const [contacts, setContacts] = useState<ContactCrise[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactCrise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactCrise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setError(null);
      const response = await api.get<ContactCrise[]>('/api/annuaire-crise/');
      setContacts(response.data);
      setFilteredContacts(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des contacts:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de charger l'annuaire de crise.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, string>) => {
    let filtered = [...contacts];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filtered = filtered.filter((item) => {
          const fieldValue = item[key as keyof ContactCrise];
          if (fieldValue === null || fieldValue === undefined) return false;
          
          if (key === 'actif') {
            return String(item.actif) === value;
          }
          
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredContacts(filtered);
  };

  const handleResetSearch = () => {
    setFilteredContacts(contacts);
  };

  const searchFields: SearchField[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'structure', label: 'Structure' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'mail', label: 'Email' },
    { key: 'tel_bureau', label: 'Tél. Bureau' },
    { key: 'tel_portable', label: 'Tél. Portable' },
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

  const handleAdd = () => {
    setSelectedContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: ContactCrise) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedContact(null);
  };

  const handleModalSave = async () => {
    await fetchContacts();
    handleModalClose();
  };

  const toggleActif = async (contact: ContactCrise) => {
    setLoading(true);
    setError(null);
    try {
      await api.put<ContactCrise>(`/api/annuaire-crise/${contact.id}`, {
        actif: !contact.actif,
      });
      await fetchContacts();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour du contact.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce contact ?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/annuaire-crise/${id}`);
      await fetchContacts();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression du contact.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading && contacts.length === 0) {
    return <div className="page-container">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Annuaire de crise</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAdd}>
            + Ajouter un contact
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <SearchBar
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Structure</th>
            <th>Fonction</th>
            <th>Tél. Bureau</th>
            <th>Tél. Portable</th>
            <th>Email</th>
            <th>Actif</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredContacts.map((contact) => (
            <tr key={contact.id}>
              <td>{contact.nom}</td>
              <td>{contact.prenom}</td>
              <td>{contact.structure || '-'}</td>
              <td>{contact.fonction || '-'}</td>
              <td>{contact.tel_bureau || '-'}</td>
              <td>{contact.tel_portable || '-'}</td>
              <td>{contact.mail || '-'}</td>
              <td>
                {isAdmin ? (
                  <button
                    type="button"
                    className={`btn btn-sm ${contact.actif ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => toggleActif(contact)}
                    disabled={loading}
                  >
                    {contact.actif ? 'Actif' : 'Inactif'}
                  </button>
                ) : (
                  <span>{contact.actif ? 'Actif' : 'Inactif'}</span>
                )}
              </td>
              {isAdmin && (
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(contact)}
                    disabled={loading}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(contact.id)}
                    disabled={loading}
                  >
                    Supprimer
                  </button>
                </td>
              )}
            </tr>
          ))}
          {filteredContacts.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 9 : 8}>Aucun contact trouvé.</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <ContactModal
          contact={selectedContact}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default AnnuaireCrise;

