import React, { useState } from 'react';
import './SearchBar.css';

export interface SearchField {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
}

interface SearchBarProps {
  fields: SearchField[];
  onSearch: (filters: Record<string, string>) => void;
  onReset: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ fields, onSearch, onReset }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

  return (
    <div className="search-bar">
      <div className="search-bar-header">
        <button
          className="search-toggle"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          <span>🔍 Recherche multi-critères</span>
          <span className={`arrow ${expanded ? 'expanded' : ''}`}>▼</span>
        </button>
        {hasActiveFilters && (
          <button className="btn-reset" onClick={handleReset} type="button">
            Réinitialiser
          </button>
        )}
      </div>
      
      {expanded && (
        <div className="search-fields">
          {fields.map((field) => (
            <div key={field.key} className="search-field">
              <label htmlFor={`search-${field.key}`}>{field.label}</label>
              {field.type === 'select' && field.options ? (
                <select
                  id={`search-${field.key}`}
                  value={filters[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                >
                  <option value="">Tous</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  id={`search-${field.key}`}
                  type="date"
                  value={filters[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  id={`search-${field.key}`}
                  type="text"
                  placeholder={`Rechercher par ${field.label.toLowerCase()}...`}
                  value={filters[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

