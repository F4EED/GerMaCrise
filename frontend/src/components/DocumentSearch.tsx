import React, { useState } from 'react';
import './DocumentSearch.css';

interface DocumentSearchProps {
  onSearch: (criteria: SearchCriteria) => void;
  onReset: () => void;
}

export interface SearchCriteria {
  q?: string;
  auteur?: string;
  titre?: string;
  isbn?: string;
  type_document?: string;
  statut?: string;
  date_publication_debut?: string;
  date_publication_fin?: string;
  tags?: string[];
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ onSearch, onReset }) => {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    q: '',
    auteur: '',
    titre: '',
    isbn: '',
    type_document: '',
    statut: '',
    date_publication_debut: '',
    date_publication_fin: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchCriteria = {
      ...criteria,
      tags: tags.length > 0 ? tags : undefined
    };
    // Retirer les champs vides
    Object.keys(searchCriteria).forEach(key => {
      if (searchCriteria[key as keyof SearchCriteria] === '' || 
          searchCriteria[key as keyof SearchCriteria] === undefined) {
        delete searchCriteria[key as keyof SearchCriteria];
      }
    });
    onSearch(searchCriteria);
  };

  const handleReset = () => {
    setCriteria({
      q: '',
      auteur: '',
      titre: '',
      isbn: '',
      type_document: '',
      statut: '',
      date_publication_debut: '',
      date_publication_fin: ''
    });
    setTags([]);
    setTagInput('');
    onReset();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="document-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-main">
          <input
            type="text"
            placeholder="Recherche plein texte..."
            value={criteria.q || ''}
            onChange={(e) => setCriteria({ ...criteria, q: e.target.value })}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            🔍 Rechercher
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary">
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="btn btn-link"
          >
            {isAdvanced ? '▼' : '▶'} Recherche avancée
          </button>
        </div>

        {isAdvanced && (
          <div className="search-advanced">
            <div className="form-row">
              <div className="form-group">
                <label>Auteur</label>
                <input
                  type="text"
                  value={criteria.auteur || ''}
                  onChange={(e) => setCriteria({ ...criteria, auteur: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={criteria.titre || ''}
                  onChange={(e) => setCriteria({ ...criteria, titre: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={criteria.isbn || ''}
                  onChange={(e) => setCriteria({ ...criteria, isbn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={criteria.type_document || ''}
                  onChange={(e) => setCriteria({ ...criteria, type_document: e.target.value })}
                >
                  <option value="">Tous</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="excel">Excel</option>
                  <option value="image">Image</option>
                  <option value="texte">Texte</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date publication (début)</label>
                <input
                  type="date"
                  value={criteria.date_publication_debut || ''}
                  onChange={(e) => setCriteria({ ...criteria, date_publication_debut: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date publication (fin)</label>
                <input
                  type="date"
                  value={criteria.date_publication_fin || ''}
                  onChange={(e) => setCriteria({ ...criteria, date_publication_fin: e.target.value })}
                />
              </div>
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
                  placeholder="Ajouter un tag"
                />
                <button type="button" onClick={addTag} className="btn-add-tag">
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="tags-list">
                  {tags.map((tag, index) => (
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
          </div>
        )}
      </form>
    </div>
  );
};

export default DocumentSearch;

