import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DocumentPreviewModal.css';

interface Document {
  id: number;
  titre: string;
  nom_fichier_original: string;
  mime_type: string;
  type_document: string;
  taille_octets?: number;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, document }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'text' | 'unsupported'>('unsupported');

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    } else {
      // Nettoyer l'URL quand on ferme
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    return () => {
      // Nettoyer l'URL lors du démontage
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document]);

  const loadPreview = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      // Déterminer le type de prévisualisation
      const typeDoc = document.type_document?.toLowerCase() || '';
      const mimeType = document.mime_type?.toLowerCase() || '';
      
      // Pour les PDFs volumineux (>20MB), suggérer le téléchargement
      const MAX_PREVIEW_SIZE = 20 * 1024 * 1024; // 20 MB
      if ((typeDoc === 'pdf' || mimeType.includes('pdf')) && document.taille_octets && document.taille_octets > MAX_PREVIEW_SIZE) {
        setPreviewType('unsupported');
        setError(`Le fichier est trop volumineux (${formatFileSize(document.taille_octets)}) pour être prévisualisé. Veuillez le télécharger pour le consulter.`);
        setLoading(false);
        return;
      }

      if (typeDoc === 'pdf' || mimeType.includes('pdf')) {
        setPreviewType('pdf');
      } else if (typeDoc === 'image' || mimeType.startsWith('image/')) {
        setPreviewType('image');
      } else if (typeDoc === 'texte' || mimeType.startsWith('text/')) {
        setPreviewType('text');
      } else {
        setPreviewType('unsupported');
        setError('La prévisualisation n\'est pas disponible pour ce type de fichier.');
        setLoading(false);
        return;
      }

      // Récupérer le fichier avec timeout pour les gros fichiers
      const response = await api.get(`/api/documents/${document.id}/download`, {
        responseType: 'blob',
        timeout: 120000 // 2 minutes de timeout
      });

      // Créer une URL blob pour la prévisualisation
      const blob = new Blob([response.data], { type: document.mime_type });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      let errorMessage = 'Erreur lors du chargement de la prévisualisation';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
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

  if (!isOpen || !document) return null;

  return (
    <div className="modal-overlay preview-modal-overlay" onClick={onClose}>
      <div className="modal-content preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <h2>{document.titre}</h2>
          <button type="button" className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="preview-modal-body">
          {loading && (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Chargement de la prévisualisation...</p>
              {document.taille_octets && (
                <p className="preview-loading-info">
                  Taille du fichier : {formatFileSize(document.taille_octets)}
                  <br />
                  <small>Le chargement peut prendre quelques instants pour les fichiers volumineux.</small>
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="preview-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <>
              {previewType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  className="preview-iframe"
                  title={`Prévisualisation ${document.titre}`}
                />
              )}

              {previewType === 'image' && (
                <div className="preview-image-container">
                  <img
                    src={previewUrl}
                    alt={document.titre}
                    className="preview-image"
                  />
                </div>
              )}

              {previewType === 'text' && (
                <iframe
                  src={previewUrl}
                  className="preview-iframe preview-text"
                  title={`Prévisualisation ${document.titre}`}
                />
              )}
            </>
          )}

          {previewType === 'unsupported' && !loading && (
            <div className="preview-unsupported">
              <p>La prévisualisation n'est pas disponible pour ce type de fichier.</p>
              <p className="preview-file-info">Fichier : {document.nom_fichier_original}</p>
            </div>
          )}
        </div>

        <div className="preview-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;

