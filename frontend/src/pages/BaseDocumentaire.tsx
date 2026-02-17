import React, { useState, useEffect } from 'react';
import './BaseDocumentaire.css';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DocumentModal from '../components/DocumentModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import DocumentSearch, { SearchCriteria } from '../components/DocumentSearch';

interface Document {
  id: number;
  titre: string;
  auteur: string;
  description?: string;
  isbn?: string;
  type_document: string;
  statut: string;
  nom_fichier_original: string;
  mime_type: string;
  taille_octets: number;
  date_publication?: string;
  date_creation_doc?: string;
  created_at: string;
  tags?: string[];
}

const BaseDocumentaire: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'edit' | 'url'>('upload');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const pageSize = 20;

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operateur';
  const canUpload = user !== null && user !== undefined; // Tous les utilisateurs authentifiés peuvent uploader
  const canValidate = user?.role === 'super_admin' || user?.role === 'admin'; // Seuls les admins peuvent valider

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/documents/', {
        params: {
          skip: currentPage * pageSize,
          limit: pageSize
        }
      });
      setDocuments(response.data);
      // Note: L'API ne retourne pas le total, on suppose qu'il y a plus si on a pageSize résultats
      setTotalDocuments(response.data.length === pageSize ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + response.data.length);
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic
      let errorMessage = 'Erreur lors du chargement des documents';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || JSON.stringify(err.response.data.detail);
        } else {
          errorMessage = String(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (criteria: SearchCriteria) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/documents/search', {
        ...criteria,
        skip: 0,
        limit: pageSize
      });
      setDocuments(response.data);
      setCurrentPage(0);
      setTotalDocuments(response.data.length);
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic
      let errorMessage = 'Erreur lors de la recherche';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || JSON.stringify(err.response.data.detail);
        } else {
          errorMessage = String(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPage(0);
    loadDocuments();
  };

  const handleUpload = () => {
    setModalMode('upload');
    setSelectedDocument(null);
    setIsModalOpen(true);
  };

  const handleUploadFromURL = () => {
    setModalMode('url');
    setSelectedDocument(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (document: Document) => {
    try {
      // Charger les détails complets du document (avec tags) depuis l'API
      const response = await api.get(`/api/documents/${document.id}`);
      setModalMode('edit');
      setSelectedDocument(response.data);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Erreur lors du chargement du document:', err);
      setError('Erreur lors du chargement des détails du document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await api.delete(`/api/documents/${id}`);
      await loadDocuments();
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic
      let errorMessage = 'Erreur lors de la suppression';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || JSON.stringify(err.response.data.detail);
        } else {
          errorMessage = String(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const domDocument = window.document;
      const link = domDocument.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.nom_fichier_original);
      domDocument.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic
      let errorMessage = 'Erreur lors du téléchargement';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || JSON.stringify(err.response.data.detail);
        } else {
          errorMessage = String(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'pdf': return '📄';
      case 'word': return '📝';
      case 'excel': return '📊';
      case 'image': return '🖼️';
      case 'texte': return '📃';
      default: return '📎';
    }
  };

  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'valide': return 'statut-valide';
      case 'brouillon': return 'statut-brouillon';
      case 'archive': return 'statut-archive';
      case 'supprime': return 'statut-supprime';
      default: return '';
    }
  };

  return (
    <div className="base-documentaire">
      <div className="page-header">
        <h1>Base Documentaire</h1>
        {canUpload && (
          <div className="header-actions">
            <button onClick={handleUploadFromURL} className="btn btn-secondary">
              📥 Depuis URL
            </button>
            <button onClick={handleUpload} className="btn btn-primary">
              📤 Uploader
            </button>
          </div>
        )}
      </div>

      <DocumentSearch onSearch={handleSearch} onReset={handleReset} />

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Chargement...</div>}

      {!loading && documents.length === 0 && (
        <div className="card empty-state">
          <p>Aucun document trouvé.</p>
          {canUpload && (
            <button onClick={handleUpload} className="btn btn-primary">
              Uploader un premier document
            </button>
          )}
        </div>
      )}

      {!loading && documents.length > 0 && (
        <>
          <div className="documents-list">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Auteur</th>
                  <th>Fichier</th>
                  <th>Taille</th>
                  <th>Publication</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="document-icon-cell">
                      <span className="document-icon">{getTypeIcon(doc.type_document)}</span>
                    </td>
                    <td className="document-title-cell">
                      <strong>{doc.titre}</strong>
                    </td>
                    <td className="document-description-cell">
                      {doc.description || '-'}
                    </td>
                    <td>
                      <span className={`document-statut ${getStatutColor(doc.statut)}`}>
                        {doc.statut}
                      </span>
                    </td>
                    <td>{doc.auteur}</td>
                    <td className="document-filename-cell">{doc.nom_fichier_original}</td>
                    <td>{formatFileSize(doc.taille_octets)}</td>
                    <td>
                      {doc.date_publication 
                        ? new Date(doc.date_publication).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td>
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="document-actions-cell">
                      <div className="document-actions">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="btn btn-sm btn-info"
                          title="Prévisualiser"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="btn btn-sm btn-primary"
                          title="Télécharger"
                        >
                          ⬇️
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEdit(doc)}
                              className="btn btn-sm btn-secondary"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            {(user?.role === 'super_admin' || user?.role === 'admin') && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="btn btn-sm btn-danger"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-secondary"
            >
              ← Précédent
            </button>
            <span className="page-info">
              Page {currentPage + 1} ({totalDocuments} documents)
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={documents.length < pageSize}
              className="btn btn-secondary"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadDocuments}
        document={selectedDocument}
        mode={modalMode}
      />

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
        document={previewDocument}
      />
    </div>
  );
};

export default BaseDocumentaire;
