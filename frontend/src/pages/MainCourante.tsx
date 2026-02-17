import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useActivation, Activation as ActivationType } from '../contexts/ActivationContext';
import MainCouranteModal from '../components/MainCouranteModal';
import './MainCourante.css';

type Activation = ActivationType;

interface MainCouranteEntry {
  id: number;
  activation_id: number;
  utilisateur_id: number;
  date_heure: string;
  contenu: string;
  type_entree?: string;
  pieces_jointes?: string;  // JSON array d'IDs
  tags?: string;  // JSON array
  etat: string;
  created_at: string;
  updated_at?: string;
  utilisateur?: {
    id: number;
    username: string;
    nom?: string;
    prenom?: string;
    email?: string;
  };
  activation?: {
    id: number;
    titre: string;
  };
  personnel_engage?: Array<{
    id: number;
    personnel_id: number;
    statut: string;
    date_affectation?: string;
    date_liberation?: string;
    personnel?: {
      id: number;
      matricule: string;
      nom: string;
      prenom: string;
      nom_court?: string;
      fonction?: string;
      service?: string;
    };
  }>;
  moyens_engages?: Array<{
    id: number;
    moyen_id: number;
    date_affectation?: string;
    date_liberation?: string;
    moyen?: {
      id: number;
      code: string;
      nom: string;
      categorie?: string;
      statut?: string;
    };
  }>;
  vehicules_engages?: Array<{
    id: number;
    vehicule_id: number;
    date_affectation?: string;
    date_liberation?: string;
    vehicule?: {
      id: number;
      immatriculation: string;
      type_vehicule?: string;
      marque?: string;
      modele?: string;
      statut?: string;
    };
  }>;
}

interface DocumentInfo {
  id: number;
  titre: string;
  nom_fichier_original: string;
}


const MainCourante: React.FC = () => {
  const { selectedActivation, setSelectedActivation } = useActivation();
  const [entries, setEntries] = useState<MainCouranteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loadingActivations, setLoadingActivations] = useState(false);
  const [documentsInfo, setDocumentsInfo] = useState<Map<number, DocumentInfo>>(new Map());

  useEffect(() => {
    if (selectedActivation) {
      fetchEntries();
    } else {
      setEntries([]);
      setLoading(false);
      fetchActivations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivation]);

  const fetchActivations = async () => {
    try {
      setLoadingActivations(true);
      setError(null);
      const response = await api.get<Activation[]>('/api/activations/');
      setActivations(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des activations:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de charger les activations.");
    } finally {
      setLoadingActivations(false);
    }
  };

  const handleSelectActivation = (activation: Activation) => {
    setSelectedActivation(activation);
  };

  const fetchEntries = async () => {
    if (!selectedActivation) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<MainCouranteEntry[]>(
        `/api/main-courante/?activation_id=${selectedActivation.id}`
      );
      console.log('📋 Entrées de main courante reçues:', response.data);
      // Log pour debug des véhicules et moyens engagés
      response.data.forEach((entry, idx) => {
        if (entry.vehicules_engages && entry.vehicules_engages.length > 0) {
          console.log(`🚗 Entrée ${idx} (ID: ${entry.id}): ${entry.vehicules_engages.length} véhicule(s) engagé(s)`, entry.vehicules_engages);
        }
        if (entry.moyens_engages && entry.moyens_engages.length > 0) {
          console.log(`📦 Entrée ${idx} (ID: ${entry.id}): ${entry.moyens_engages.length} moyen(s) engagé(s)`, entry.moyens_engages);
        }
      });
      setEntries(response.data);
      
      // Charger les informations des documents référencés
      await fetchDocumentsInfo(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la main courante:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de charger la main courante.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentsInfo = async (entries: MainCouranteEntry[]) => {
    // Collecter tous les IDs de documents uniques
    const docIds = new Set<number>();
    entries.forEach(entry => {
      const piecesJointes = parseJsonArray(entry.pieces_jointes);
      piecesJointes.forEach((docId: number) => {
        if (typeof docId === 'number') {
          docIds.add(docId);
        }
      });
    });

    if (docIds.size === 0) {
      setDocumentsInfo(new Map());
      return;
    }

    // Charger les informations de chaque document
    const docsMap = new Map<number, DocumentInfo>();
    const fetchPromises = Array.from(docIds).map(async (docId) => {
      try {
        const docResponse = await api.get(`/api/documents/${docId}`);
        const doc = docResponse.data;
        docsMap.set(docId, {
          id: doc.id,
          titre: doc.titre,
          nom_fichier_original: doc.nom_fichier_original || doc.titre
        });
      } catch (err: any) {
        console.error(`Erreur lors du chargement du document ${docId}:`, err);
        // En cas d'erreur, on garde juste l'ID
        docsMap.set(docId, {
          id: docId,
          titre: `Document #${docId}`,
          nom_fichier_original: `Document #${docId}`
        });
      }
    });

    await Promise.all(fetchPromises);
    setDocumentsInfo(docsMap);
  };


  const handleOpenModal = () => {
    if (!selectedActivation) {
      setError("Veuillez sélectionner une activation d'abord.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    fetchEntries();
  };

  const handleUpdateEtat = async (entryId: number, newEtat: string) => {
    try {
      setError(null);
      await api.patch(`/api/main-courante/${entryId}`, { etat: newEtat });
      await fetchEntries();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'état:', err);
      setError(err.response?.data?.detail || err.message || "Impossible de mettre à jour l'état.");
    }
  };

  const parseJsonArray = (jsonStr?: string): any[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };


  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDocumentClick = async (docId: number, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = api.defaults.baseURL || 'http://localhost:8000';
      const downloadUrl = `${apiUrl}/api/documents/${docId}/download`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Obtenir le type MIME pour déterminer si on peut l'ouvrir dans un onglet
      const contentType = response.headers.get('Content-Type') || blob.type;
      const canOpenInTab = contentType?.startsWith('image/') || 
                          contentType === 'application/pdf' ||
                          contentType?.startsWith('text/');
      
      if (canOpenInTab) {
        // Ouvrir dans un nouvel onglet
        const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Si la popup est bloquée, télécharger le fichier
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = documentsInfo.get(docId)?.nom_fichier_original || `document_${docId}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        // Nettoyer l'URL après un délai pour permettre au navigateur de charger le blob
        setTimeout(() => {
          // Ne pas révoquer immédiatement car le nouvel onglet en a besoin
          // Le navigateur le nettoiera automatiquement quand l'onglet sera fermé
        }, 100);
      } else {
        // Pour les autres types de fichiers, télécharger directement
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = documentsInfo.get(docId)?.nom_fichier_original || `document_${docId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err: any) {
      console.error('Erreur lors du téléchargement du document:', err);
      setError(`Impossible d'ouvrir le document: ${err.message}`);
    }
  };

  if (!selectedActivation) {
    return (
      <div className="main-courante-container">
        <div className="activation-selection">
          <h2>Main Courante</h2>
          <p className="selection-prompt">Aucune activation n'est sélectionnée. Veuillez choisir une activation pour accéder à sa main courante :</p>
          
          {loadingActivations ? (
            <div className="loading">Chargement des activations...</div>
          ) : activations.length === 0 ? (
            <div className="alert alert-info">
              <p>Aucune activation disponible.</p>
              <p>Vous pouvez créer une activation depuis la page <a href="/activations">Activations</a>.</p>
            </div>
          ) : (
            <div className="activations-list">
              <table className="activations-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Date de création</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((activation) => (
                    <tr key={activation.id}>
                      <td>{activation.titre}</td>
                      <td>{activation.type || '-'}</td>
                      <td>
                        <span className={`badge ${
                          activation.status === 'clôturée' ? 'badge-success' :
                          activation.status === 'en cours' ? 'badge-warning' :
                          activation.status === 'programmé' ? 'badge-info' : ''
                        }`}>
                          {activation.status || '-'}
                        </span>
                      </td>
                      <td>
                        {activation.date_creation 
                          ? new Date(activation.date_creation).toLocaleDateString('fr-FR')
                          : '-'
                        }
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSelectActivation(activation)}
                        >
                          Sélectionner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="main-courante-container">
      <div className="main-courante-header">
        <h2>Main Courante - {selectedActivation.titre}</h2>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          + Nouvelle entrée
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : entries.length === 0 ? (
        <div className="alert alert-info">Aucune entrée dans la main courante pour cette activation.</div>
      ) : (
        <div className="main-courante-entries">
          {entries.map((entry) => (
            <div key={entry.id} className={`main-courante-entry ${entry.etat === 'erreur de saisie' ? 'entry-error' : ''}`}>
              <div className="entry-header">
                <div className="entry-meta">
                  <span className="entry-date">{formatDate(entry.date_heure)}</span>
                  <span className="entry-author">
                    {entry.utilisateur 
                      ? `${entry.utilisateur.prenom || ''} ${entry.utilisateur.nom || entry.utilisateur.username}`.trim()
                      : `Utilisateur #${entry.utilisateur_id}`
                    }
                  </span>
                  {entry.type_entree && (
                    <span className="entry-type badge">{entry.type_entree}</span>
                  )}
                  <span className={`entry-etat badge ${entry.etat === 'Valide' ? 'badge-success' : 'badge-danger'}`}>
                    {entry.etat}
                  </span>
                </div>
                <div className="entry-actions">
                  <select
                    value={entry.etat}
                    onChange={(e) => handleUpdateEtat(entry.id, e.target.value)}
                    className="select-etat"
                  >
                    <option value="Valide">Valide</option>
                    <option value="erreur de saisie">Erreur de saisie</option>
                  </select>
                </div>
              </div>
              <div className="entry-content">{entry.contenu}</div>
              {parseJsonArray(entry.tags).length > 0 && (
                <div className="entry-tags">
                  {parseJsonArray(entry.tags).map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              {parseJsonArray(entry.pieces_jointes).length > 0 && (
                <div className="entry-documents">
                  <strong>Pièces jointes :</strong>
                  <ul>
                    {parseJsonArray(entry.pieces_jointes).map((docId, idx) => {
                      const docInfo = documentsInfo.get(Number(docId));
                      const docTitle = docInfo?.titre || `Document #${docId}`;
                      
                      return (
                        <li key={idx}>
                          <a 
                            href="#"
                            onClick={(e) => handleDocumentClick(Number(docId), e)}
                            style={{ 
                              color: 'var(--primary-color)',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                            title="Cliquer pour ouvrir dans un nouvel onglet"
                          >
                            📄 {docTitle}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {entry.personnel_engage && entry.personnel_engage.length > 0 && (
                <div className="entry-personnel" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '0.5rem' }}>
                  <strong>Personnel engagé :</strong>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {entry.personnel_engage.map((affectation: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>
                          {affectation.personnel?.nom_court || `${affectation.personnel?.prenom || ''} ${affectation.personnel?.nom || ''}`.trim()}
                        </span>
                        {affectation.personnel?.matricule && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                            ({affectation.personnel.matricule})
                          </span>
                        )}
                        {affectation.statut && (
                          <span className={`badge ${affectation.statut === 'engage' ? 'badge-primary' : affectation.statut === 'repos' ? 'badge-info' : affectation.statut === 'absent' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                            {affectation.statut}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entry.moyens_engages && entry.moyens_engages.length > 0 && (
                <div className="entry-moyens" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem' }}>
                  <strong>Moyens engagés :</strong>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {entry.moyens_engages.map((affectation: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>
                          {affectation.moyen?.code || 'Sans code'} - {affectation.moyen?.nom || 'Sans nom'}
                        </span>
                        {affectation.moyen?.categorie && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                            ({affectation.moyen.categorie})
                          </span>
                        )}
                        {affectation.moyen?.statut && (
                          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                            {affectation.moyen.statut}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entry.vehicules_engages && entry.vehicules_engages.length > 0 && (
                <div className="entry-vehicules" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(251, 146, 60, 0.1)', borderRadius: '0.5rem' }}>
                  <strong>Véhicules engagés :</strong>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {entry.vehicules_engages.map((affectation: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>
                          {affectation.vehicule?.immatriculation || 'Sans immatriculation'}
                        </span>
                        {affectation.vehicule?.type_vehicule && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                            ({affectation.vehicule.type_vehicule})
                          </span>
                        )}
                        {affectation.vehicule?.marque && affectation.vehicule?.modele && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                            {affectation.vehicule.marque} {affectation.vehicule.modele}
                          </span>
                        )}
                        {affectation.vehicule?.statut && (
                          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                            {affectation.vehicule.statut}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="entry-footer">
                <small>Créé le {formatDate(entry.created_at)}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      <MainCouranteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        activationId={selectedActivation.id}
      />
    </div>
  );
};

export default MainCourante;

