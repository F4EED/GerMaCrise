import React, { useState, useEffect } from 'react';
import './UserModal.css';

interface SiteIndustrielModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (siteData: any) => Promise<void>;
  site?: {
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
  } | null;
}

const SiteIndustrielModal: React.FC<SiteIndustrielModalProps> = ({ isOpen, onClose, onSave, site }) => {
  const [formData, setFormData] = useState({
    nom: '',
    nom_entreprise: '',
    secteur_activite: '',
    nom_dirigeant: '',
    tel_dirigeant: '',
    tel_std: '',
    adresse_postale: '',
    num_rue: '',
    nom_rue: '',
    code_postal: '',
    ville: '',
    latitude: '',
    longitude: '',
    surface: '',
    nb_batiment: '',
    risques: '',
    ppi: false,
    chemin_acces_ppi: '',
    status_ppi: '',
    capacite_production: '',
    effectif: '',
    observations: '',
    telephone_fixe: '',
    telephone_portable: '',
    telephone_astreinte: '',
    fax: '',
    email: '',
    commentaire: '',
    actif: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        nom: site.nom || '',
        nom_entreprise: site.nom_entreprise || '',
        secteur_activite: site.secteur_activite || '',
        nom_dirigeant: site.nom_dirigeant || '',
        tel_dirigeant: site.tel_dirigeant || '',
        tel_std: site.tel_std || '',
        adresse_postale: site.adresse_postale || '',
        num_rue: site.num_rue || '',
        nom_rue: site.nom_rue || '',
        code_postal: site.code_postal || '',
        ville: site.ville || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        surface: site.surface || '',
        nb_batiment: site.nb_batiment || '',
        risques: site.risques || '',
        ppi: site.ppi || false,
        chemin_acces_ppi: site.chemin_acces_ppi || '',
        status_ppi: site.status_ppi || '',
        capacite_production: site.capacite_production || '',
        effectif: site.effectif?.toString() || '',
        observations: site.observations || '',
        telephone_fixe: site.telephone_fixe || '',
        telephone_portable: site.telephone_portable || '',
        telephone_astreinte: site.telephone_astreinte || '',
        fax: site.fax || '',
        email: site.email || '',
        commentaire: site.commentaire || '',
        actif: site.actif,
      });
    } else {
      setFormData({
        nom: '',
        nom_entreprise: '',
        secteur_activite: '',
        nom_dirigeant: '',
        tel_dirigeant: '',
        tel_std: '',
        adresse_postale: '',
        num_rue: '',
        nom_rue: '',
        code_postal: '',
        ville: '',
        latitude: '',
        longitude: '',
        surface: '',
        nb_batiment: '',
        risques: '',
        ppi: false,
        chemin_acces_ppi: '',
        status_ppi: '',
        capacite_production: '',
        effectif: '',
        observations: '',
        telephone_fixe: '',
        telephone_portable: '',
        telephone_astreinte: '',
        fax: '',
        email: '',
        commentaire: '',
        actif: true,
      });
    }
    setError('');
  }, [site, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.nom.trim()) {
        throw new Error("Le nom du site est requis");
      }

      const siteData: any = {
        nom: formData.nom.trim(),
        nom_entreprise: formData.nom_entreprise.trim() || undefined,
        secteur_activite: formData.secteur_activite.trim() || undefined,
        nom_dirigeant: formData.nom_dirigeant.trim() || undefined,
        tel_dirigeant: formData.tel_dirigeant.trim() || undefined,
        tel_std: formData.tel_std.trim() || undefined,
        adresse_postale: formData.adresse_postale.trim() || undefined,
        num_rue: formData.num_rue.trim() || undefined,
        nom_rue: formData.nom_rue.trim() || undefined,
        code_postal: formData.code_postal.trim() || undefined,
        ville: formData.ville.trim() || undefined,
        latitude: formData.latitude.trim() || undefined,
        longitude: formData.longitude.trim() || undefined,
        surface: formData.surface.trim() || undefined,
        nb_batiment: formData.nb_batiment.trim() || undefined,
        risques: formData.risques.trim() || undefined,
        ppi: formData.ppi,
        chemin_acces_ppi: formData.chemin_acces_ppi.trim() || undefined,
        status_ppi: formData.status_ppi.trim() || undefined,
        capacite_production: formData.capacite_production.trim() || undefined,
        effectif: formData.effectif ? parseInt(formData.effectif) : undefined,
        observations: formData.observations.trim() || undefined,
        telephone_fixe: formData.telephone_fixe.trim() || undefined,
        telephone_portable: formData.telephone_portable.trim() || undefined,
        telephone_astreinte: formData.telephone_astreinte.trim() || undefined,
        fax: formData.fax.trim() || undefined,
        email: formData.email.trim() || undefined,
        commentaire: formData.commentaire.trim() || undefined,
        actif: formData.actif,
      };

      await onSave(siteData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>{site ? 'Modifier site industriel' : 'Nouveau site industriel'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-section">
            <h3>Informations générales</h3>
            
            <div className="form-group">
              <label htmlFor="nom">Nom du site *</label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                placeholder="Ex: Usine de production ABC"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom_entreprise">Nom de l'entreprise</label>
                <input
                  type="text"
                  id="nom_entreprise"
                  value={formData.nom_entreprise}
                  onChange={(e) => setFormData({ ...formData, nom_entreprise: e.target.value })}
                  placeholder="Ex: ABC Industries"
                />
              </div>

              <div className="form-group">
                <label htmlFor="secteur_activite">Secteur d'activité</label>
                <input
                  type="text"
                  id="secteur_activite"
                  value={formData.secteur_activite}
                  onChange={(e) => setFormData({ ...formData, secteur_activite: e.target.value })}
                  placeholder="Ex: Chimie, Pétrochimie, Métallurgie..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="surface">Surface</label>
                <input
                  type="text"
                  id="surface"
                  value={formData.surface}
                  onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                  placeholder="Ex: 12000 m²"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nb_batiment">Nombre de bâtiments</label>
                <input
                  type="text"
                  id="nb_batiment"
                  value={formData.nb_batiment}
                  onChange={(e) => setFormData({ ...formData, nb_batiment: e.target.value })}
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="capacite_production">Capacité de production</label>
                <input
                  type="text"
                  id="capacite_production"
                  value={formData.capacite_production}
                  onChange={(e) => setFormData({ ...formData, capacite_production: e.target.value })}
                  placeholder="Ex: 150 MW, 100 000 tonnes/an..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="effectif">Effectif</label>
                <input
                  type="number"
                  id="effectif"
                  value={formData.effectif}
                  onChange={(e) => setFormData({ ...formData, effectif: e.target.value })}
                  placeholder="Ex: 75"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Direction</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom_dirigeant">Nom du dirigeant</label>
                <input
                  type="text"
                  id="nom_dirigeant"
                  value={formData.nom_dirigeant}
                  onChange={(e) => setFormData({ ...formData, nom_dirigeant: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tel_dirigeant">Téléphone dirigeant</label>
                <input
                  type="tel"
                  id="tel_dirigeant"
                  value={formData.tel_dirigeant}
                  onChange={(e) => setFormData({ ...formData, tel_dirigeant: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Adresse</h3>
            
            <div className="form-group">
              <label htmlFor="adresse_postale">Adresse postale complète</label>
              <input
                type="text"
                id="adresse_postale"
                value={formData.adresse_postale}
                onChange={(e) => setFormData({ ...formData, adresse_postale: e.target.value })}
                placeholder="Ex: 12 Rue de l'Industrie, 75010 Paris"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="num_rue">Numéro de rue</label>
                <input
                  type="text"
                  id="num_rue"
                  value={formData.num_rue}
                  onChange={(e) => setFormData({ ...formData, num_rue: e.target.value })}
                  placeholder="Ex: 12"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nom_rue">Nom de rue</label>
                <input
                  type="text"
                  id="nom_rue"
                  value={formData.nom_rue}
                  onChange={(e) => setFormData({ ...formData, nom_rue: e.target.value })}
                  placeholder="Ex: Rue de l'Industrie"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code_postal">Code postal</label>
                <input
                  type="text"
                  id="code_postal"
                  value={formData.code_postal}
                  onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                  placeholder="Ex: 75010"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ville">Ville</label>
                <input
                  type="text"
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Ex: Paris"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Coordonnées GPS</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  type="text"
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Ex: 48.8566"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  type="text"
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Ex: 2.3522"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tel_std">Téléphone standard</label>
                <input
                  type="tel"
                  id="tel_std"
                  value={formData.tel_std}
                  onChange={(e) => setFormData({ ...formData, tel_std: e.target.value })}
                  placeholder="Ex: 01 23 45 67 89"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telephone_fixe">Téléphone fixe</label>
                <input
                  type="tel"
                  id="telephone_fixe"
                  value={formData.telephone_fixe}
                  onChange={(e) => setFormData({ ...formData, telephone_fixe: e.target.value })}
                  placeholder="Ex: 01 23 45 67 89"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telephone_portable">Téléphone portable</label>
                <input
                  type="tel"
                  id="telephone_portable"
                  value={formData.telephone_portable}
                  onChange={(e) => setFormData({ ...formData, telephone_portable: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telephone_astreinte">Téléphone astreinte</label>
                <input
                  type="tel"
                  id="telephone_astreinte"
                  value={formData.telephone_astreinte}
                  onChange={(e) => setFormData({ ...formData, telephone_astreinte: e.target.value })}
                  placeholder="Ex: 06 98 76 54 32"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fax">Fax</label>
                <input
                  type="tel"
                  id="fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  placeholder="Ex: 01 23 45 67 88"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: contact@site-industriel.fr"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Risques et sécurité</h3>
            
            <div className="form-group">
              <label htmlFor="risques">Risques</label>
              <textarea
                id="risques"
                value={formData.risques}
                onChange={(e) => setFormData({ ...formData, risques: e.target.value })}
                placeholder="Ex: Inondation, Tempête / Vent violent, Sismique, Incendie forestier, Explosion industrielle"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.ppi}
                    onChange={(e) => setFormData({ ...formData, ppi: e.target.checked })}
                  />
                  <span>PPI (Plan Particulier d'Intervention)</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="status_ppi">Statut PPI</label>
                <select
                  id="status_ppi"
                  value={formData.status_ppi}
                  onChange={(e) => setFormData({ ...formData, status_ppi: e.target.value })}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="valide">Valide</option>
                  <option value="en_cours">En cours</option>
                  <option value="expire">Expiré</option>
                  <option value="non_applicable">Non applicable</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="chemin_acces_ppi">Chemin d'accès PPI</label>
              <input
                type="text"
                id="chemin_acces_ppi"
                value={formData.chemin_acces_ppi}
                onChange={(e) => setFormData({ ...formData, chemin_acces_ppi: e.target.value })}
                placeholder="Ex: ppi/Site_PPI.pdf"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Observations</h3>
            
            <div className="form-group">
              <label htmlFor="observations">Observations</label>
              <textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Notes, observations, informations complémentaires..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="commentaire">Commentaire</label>
              <textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                placeholder="Commentaires supplémentaires..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              />
              <span>Site actif</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
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

export default SiteIndustrielModal;
