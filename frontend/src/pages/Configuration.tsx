import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Configuration.css';

interface Structure {
  id?: number;
  nom_structure: string;
  type?: string;
  aasc: boolean;
  num_rue?: string;
  nom_rue?: string;
  code_postal?: string;
  ville?: string;
  responsable?: string;
  telephone_fixe?: string;
  telephone_portable?: string;
  telephone_astreinte?: string;
  fax?: string;
  email?: string;
  remarque?: string;
  logo_banniere?: string;
  logo_impression?: string;
  logo_general?: string;
}

const Configuration: React.FC = () => {
  const [structure, setStructure] = useState<Structure>({
    nom_structure: '',
    type: '',
    aasc: false,
    num_rue: '',
    nom_rue: '',
    code_postal: '',
    ville: '',
    responsable: '',
    telephone_fixe: '',
    telephone_portable: '',
    telephone_astreinte: '',
    fax: '',
    email: '',
    remarque: '',
    logo_banniere: '',
    logo_impression: '',
    logo_general: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      const response = await api.get('/api/structure');
      setStructure(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Structure n'existe pas encore, on garde les valeurs par défaut
        setStructure({
          nom_structure: '',
          type: '',
          aasc: false,
          num_rue: '',
          nom_rue: '',
          code_postal: '',
          ville: '',
          responsable: '',
          telephone_fixe: '',
          telephone_portable: '',
          telephone_astreinte: '',
          fax: '',
          email: '',
          remarque: '',
          logo_banniere: '',
          logo_impression: '',
          logo_general: '',
        });
      } else {
        const errorMsg = error.response?.data?.detail || error.message || 'Erreur lors du chargement de la structure';
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validation
      if (!structure.nom_structure.trim()) {
        setError("Le nom de la structure est requis");
        setSaving(false);
        return;
      }

      // Préparer les données (enlever les champs vides optionnels)
      const structureData: any = {
        nom_structure: structure.nom_structure.trim(),
        type: structure.type?.trim() || undefined,
        aasc: structure.aasc,
        num_rue: structure.num_rue?.trim() || undefined,
        nom_rue: structure.nom_rue?.trim() || undefined,
        code_postal: structure.code_postal?.trim() || undefined,
        ville: structure.ville?.trim() || undefined,
        responsable: structure.responsable?.trim() || undefined,
        telephone_fixe: structure.telephone_fixe?.trim() || undefined,
        telephone_portable: structure.telephone_portable?.trim() || undefined,
        telephone_astreinte: structure.telephone_astreinte?.trim() || undefined,
        fax: structure.fax?.trim() || undefined,
        email: structure.email?.trim() || undefined,
        remarque: structure.remarque?.trim() || undefined,
        logo_banniere: structure.logo_banniere?.trim() || undefined,
        logo_impression: structure.logo_impression?.trim() || undefined,
        logo_general: structure.logo_general?.trim() || undefined,
      };

      if (structure.id) {
        // Mise à jour
        await api.put('/api/structure', structureData);
        setSuccess('Structure mise à jour avec succès');
      } else {
        // Création ou mise à jour (PUT crée si n'existe pas)
        await api.put('/api/structure', structureData);
        setSuccess('Structure enregistrée avec succès');
        await fetchStructure(); // Recharger pour avoir l'ID
      }
    } catch (err: any) {
      let errorMsg = 'Erreur lors de la sauvegarde';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // Erreurs de validation Pydantic
          errorMsg = err.response.data.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else {
          errorMsg = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setStructure(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return <div>Accès non autorisé. Seuls les administrateurs peuvent accéder à cette page.</div>;
  }

  return (
    <div className="configuration">
      <div className="page-header">
        <h1>Configuration - Structure Utilisatrice</h1>
      </div>

      <div className="card">
        {error && <div className="error-message">{String(error)}</div>}
        {success && <div className="success-message">{String(success)}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Informations générales</h2>
            
            <div className="form-group">
              <label htmlFor="nom_structure">Nom de la structure *</label>
              <input
                type="text"
                id="nom_structure"
                name="nom_structure"
                value={structure.nom_structure}
                onChange={handleChange}
                required
                placeholder="Ex: Le village des schtroumpfs"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={structure.type || ''}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Villes">Villes</option>
                  <option value="Communauté de communes">Communauté de communes</option>
                  <option value="Syndicat">Syndicat</option>
                  <option value="Association">Association</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="aasc"
                    name="aasc"
                    checked={structure.aasc}
                    onChange={handleChange}
                  />
                  <span>AASC</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Adresse</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="num_rue">Numéro de rue</label>
                <input
                  type="text"
                  id="num_rue"
                  name="num_rue"
                  value={structure.num_rue || ''}
                  onChange={handleChange}
                  placeholder="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nom_rue">Nom de rue</label>
                <input
                  type="text"
                  id="nom_rue"
                  name="nom_rue"
                  value={structure.nom_rue || ''}
                  onChange={handleChange}
                  placeholder="rue fantôme"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code_postal">Code postal</label>
                <input
                  type="text"
                  id="code_postal"
                  name="code_postal"
                  value={structure.code_postal || ''}
                  onChange={handleChange}
                  placeholder="001234"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ville">Ville</label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={structure.ville || ''}
                  onChange={handleChange}
                  placeholder="schtroumpfs land"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Contact</h2>
            
            <div className="form-group">
              <label htmlFor="responsable">Responsable</label>
              <input
                type="text"
                id="responsable"
                name="responsable"
                value={structure.responsable || ''}
                onChange={handleChange}
                placeholder="le grand schtroumpfs"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telephone_fixe">Téléphone fixe</label>
                <input
                  type="tel"
                  id="telephone_fixe"
                  name="telephone_fixe"
                  value={structure.telephone_fixe || ''}
                  onChange={handleChange}
                  placeholder="tel fixe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telephone_portable">Téléphone portable</label>
                <input
                  type="tel"
                  id="telephone_portable"
                  name="telephone_portable"
                  value={structure.telephone_portable || ''}
                  onChange={handleChange}
                  placeholder="port"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telephone_astreinte">Téléphone astreinte</label>
                <input
                  type="tel"
                  id="telephone_astreinte"
                  name="telephone_astreinte"
                  value={structure.telephone_astreinte || ''}
                  onChange={handleChange}
                  placeholder="astreinte"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fax">Fax</label>
                <input
                  type="tel"
                  id="fax"
                  name="fax"
                  value={structure.fax || ''}
                  onChange={handleChange}
                  placeholder="fax"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={structure.email || ''}
                onChange={handleChange}
                placeholder="email"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Logos</h2>
            
            <div className="form-group">
              <label htmlFor="logo_banniere">Logo bannière (chemin)</label>
              <input
                type="text"
                id="logo_banniere"
                name="logo_banniere"
                value={structure.logo_banniere || ''}
                onChange={handleChange}
                placeholder="doc/logo_banniere.png"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="logo_impression">Logo impression (chemin)</label>
                <input
                  type="text"
                  id="logo_impression"
                  name="logo_impression"
                  value={structure.logo_impression || ''}
                  onChange={handleChange}
                  placeholder="doc/logo_impression.png"
                />
              </div>

              <div className="form-group">
                <label htmlFor="logo_general">Logo général (chemin)</label>
                <input
                  type="text"
                  id="logo_general"
                  name="logo_general"
                  value={structure.logo_general || ''}
                  onChange={handleChange}
                  placeholder="doc/logo_general.png"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Remarques</h2>
            
            <div className="form-group">
              <label htmlFor="remarque">Remarque</label>
              <textarea
                id="remarque"
                name="remarque"
                value={structure.remarque || ''}
                onChange={handleChange}
                rows={4}
                placeholder="aucune, on est les peilleurs pardie"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuration;

