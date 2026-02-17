import React, { useState, useEffect } from 'react';
import './DocumentModal.css';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  document?: {
    id: number;
    titre: string;
    auteur: string;
    description?: string;
    isbn?: string;
    type_document?: string;
    statut?: string;
    date_publication?: string;
    date_creation_doc?: string;
    tags?: string[];
  } | null;
  mode?: 'upload' | 'edit' | 'url';
}

const DocumentModal: React.FC<DocumentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  document,
  mode = 'upload'
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titre: '',
    auteur: '',
    description: '',
    isbn: '',
    type_document: '',
    statut: 'brouillon',
    date_publication: '',
    date_creation_doc: '',
    tags: [] as string[],
    url: '',
    file: null as File | null
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (document) {
      // Convertir le type_document en minuscules pour correspondre aux valeurs du select
      let typeDoc = '';
      if (document.type_document) {
        // Convertir en string et en minuscules pour garantir le format
        const docType = String(document.type_document).toLowerCase().trim();
        // Mapper les valeurs possibles vers les valeurs du select
        const typeMap: Record<string, string> = {
          'pdf': 'pdf',
          'word': 'word',
          'excel': 'excel',
          'image': 'image',
          'text': 'texte',  // Gérer l'ancien format "text"
          'texte': 'texte',
          'autre': 'autre'
        };
        typeDoc = typeMap[docType] || docType;
        // S'assurer que la valeur finale est valide
        if (!['pdf', 'word', 'excel', 'image', 'texte', 'autre'].includes(typeDoc)) {
          typeDoc = 'autre';  // Valeur par défaut si invalide
        }
      }
      
      setFormData({
        titre: document.titre || '',
        auteur: document.auteur || '',
        description: document.description || '',
        isbn: document.isbn || '',
        type_document: typeDoc,
        statut: document.statut ? String(document.statut).toLowerCase() : 'brouillon',
        date_publication: document.date_publication ? document.date_publication.split('T')[0] : '',
        date_creation_doc: document.date_creation_doc ? document.date_creation_doc.split('T')[0] : '',
        tags: document.tags || [],
        url: '',
        file: null
      });
    } else {
      setFormData({
        titre: '',
        auteur: '',
        description: '',
        isbn: '',
        type_document: '',
        statut: 'brouillon',
        date_publication: '',
        date_creation_doc: '',
        tags: [],
        url: '',
        file: null
      });
    }
  }, [document, isOpen]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData({ ...formData, file: e.dataTransfer.files[0] });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'url') {
        // Upload depuis URL
        await api.post('/api/documents/upload-from-url', {
          url: formData.url,
          titre: formData.titre,
          auteur: formData.auteur,
          description: formData.description || undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined
        });
      } else if (mode === 'upload') {
        // Upload fichier
        if (!formData.file) {
          throw new Error('Veuillez sélectionner un fichier');
        }

        const uploadData = new FormData();
        uploadData.append('file', formData.file);
        uploadData.append('titre', formData.titre);
        uploadData.append('auteur', formData.auteur);
        if (formData.description) uploadData.append('description', formData.description);
        if (formData.isbn) uploadData.append('isbn', formData.isbn);
        if (formData.type_document) {
          // Convertir en minuscules pour correspondre à l'enum
          const normalizedType = String(formData.type_document).toLowerCase().trim();
          // S'assurer que la valeur est valide
          if (['pdf', 'word', 'excel', 'image', 'texte', 'autre'].includes(normalizedType)) {
            uploadData.append('type_document', normalizedType);
          }
        }
        // Formater les dates au format ISO (YYYY-MM-DDTHH:mm:ss)
        if (formData.date_publication) {
          const dateStr = formData.date_publication.includes('T') 
            ? formData.date_publication 
            : `${formData.date_publication}T00:00:00`;
          uploadData.append('date_publication', dateStr);
        }
        if (formData.date_creation_doc) {
          const dateStr = formData.date_creation_doc.includes('T') 
            ? formData.date_creation_doc 
            : `${formData.date_creation_doc}T00:00:00`;
          uploadData.append('date_creation_doc', dateStr);
        }
        if (formData.tags.length > 0) uploadData.append('tags', JSON.stringify(formData.tags));

        await api.post('/api/documents/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else if (mode === 'edit' && document) {
        // Modification - convertir type_document en minuscules pour correspondre à l'enum
        let typeDoc: string | undefined = undefined;
        if (formData.type_document) {
          const normalizedType = String(formData.type_document).toLowerCase().trim();
          // S'assurer que la valeur est valide
          if (['pdf', 'word', 'excel', 'image', 'texte', 'autre'].includes(normalizedType)) {
            typeDoc = normalizedType;
          }
        }
        
        // Formater les dates au format ISO (YYYY-MM-DDTHH:mm:ss)
        let datePublication = formData.date_publication 
          ? (formData.date_publication.includes('T') 
              ? formData.date_publication 
              : `${formData.date_publication}T00:00:00`)
          : undefined;
        let dateCreationDoc = formData.date_creation_doc 
          ? (formData.date_creation_doc.includes('T') 
              ? formData.date_creation_doc 
              : `${formData.date_creation_doc}T00:00:00`)
          : undefined;
        
        // Mise à jour des métadonnées du document (y compris les tags)
        await api.put(`/api/documents/${document.id}`, {
          titre: formData.titre,
          auteur: formData.auteur,
          description: formData.description || undefined,
          isbn: formData.isbn || undefined,
          type_document: typeDoc || undefined,
          statut: formData.statut || undefined,
          date_publication: datePublication,
          date_creation_doc: dateCreationDoc,
          tags: formData.tags  // Toujours envoyer les tags (tableau vide si aucun tag)
        });
      }

      await onSave();
      onClose();
    } catch (err: any) {
      // Gérer les erreurs de validation Pydantic qui peuvent être des objets
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // Erreurs de validation multiples
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          // Erreur de validation unique (objet)
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content document-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'upload' && 'Uploader un document'}
            {mode === 'url' && 'Télécharger depuis une URL'}
            {mode === 'edit' && 'Modifier le document'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          {mode === 'url' && (
            <div className="form-group">
              <label htmlFor="url">URL du document *</label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                placeholder="https://example.com/document.pdf"
              />
            </div>
          )}

          {mode === 'upload' && (
            <div className="form-group">
              <label>Fichier *</label>
              <div
                className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="file-selected">
                    <span>📄 {formData.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file: null })}
                      className="remove-file"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <p>Glissez-déposez un fichier ici</p>
                    <p className="file-hint">ou</p>
                    <label htmlFor="file-input" className="file-input-label">
                      Sélectionner un fichier
                    </label>
                    <input
                      type="file"
                      id="file-input"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="titre">Titre *</label>
            <input
              type="text"
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auteur">Auteur *</label>
            <input
              type="text"
              id="auteur"
              value={formData.auteur}
              onChange={(e) => setFormData({ ...formData, auteur: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type_document">Type de document</label>
            <select
              id="type_document"
              value={formData.type_document}
              onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
            >
              <option value="">Sélectionner un type</option>
              <option value="pdf">PDF</option>
              <option value="word">Word</option>
              <option value="excel">Excel</option>
              <option value="image">Image</option>
              <option value="texte">Texte</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {mode === 'edit' && (
            <div className="form-group">
              <label htmlFor="statut">Statut</label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                <option value="brouillon">Brouillon</option>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <>
                    <option value="valide">Validé</option>
                    <option value="archive">Archivé</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="isbn">ISBN</label>
              <input
                type="text"
                id="isbn"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_publication">Date de publication</label>
              <input
                type="date"
                id="date_publication"
                value={formData.date_publication}
                onChange={(e) => setFormData({ ...formData, date_publication: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_creation_doc">Date de création du document</label>
            <input
              type="date"
              id="date_creation_doc"
              value={formData.date_creation_doc}
              onChange={(e) => setFormData({ ...formData, date_creation_doc: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajouter un tag et appuyer sur Entrée"
              />
              <button type="button" onClick={addTag} className="btn-add-tag">
                +
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentModal;

