import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './MainCouranteModal.css';

interface MainCouranteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  activationId: number;
}


const MainCouranteModal: React.FC<MainCouranteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activationId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState<number[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<number[]>([]);
  const [personnelEngagesList, setPersonnelEngagesList] = useState<any[]>([]);
  const [selectedPersonnelLiberer, setSelectedPersonnelLiberer] = useState<number[]>([]);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [newPersonnelData, setNewPersonnelData] = useState<any>(null);
  const [personnelSearch, setPersonnelSearch] = useState({
    texte: '',
    matricule: '',
    nom: '',
    prenom: '',
    fonction: '',
    service: ''
  });
  const [filteredPersonnel, setFilteredPersonnel] = useState<any[]>([]);
  
  // États pour les moyens
  const [moyensList, setMoyensList] = useState<any[]>([]);
  const [selectedMoyens, setSelectedMoyens] = useState<number[]>([]);
  const [moyensEngagesList, setMoyensEngagesList] = useState<any[]>([]);
  const [selectedMoyensLiberer, setSelectedMoyensLiberer] = useState<number[]>([]);
  const [moyensSearch, setMoyensSearch] = useState({
    texte: '',
    code: '',
    nom: '',
    categorie: ''
  });
  const [filteredMoyens, setFilteredMoyens] = useState<any[]>([]);
  
  // États pour les véhicules
  const [vehiculesList, setVehiculesList] = useState<any[]>([]);
  const [selectedVehicules, setSelectedVehicules] = useState<number[]>([]);
  const [vehiculesEngagesList, setVehiculesEngagesList] = useState<any[]>([]);
  const [selectedVehiculesLiberer, setSelectedVehiculesLiberer] = useState<number[]>([]);
  const [vehiculesSearch, setVehiculesSearch] = useState({
    texte: '',
    immatriculation: '',
    type_vehicule: '',
    marque: ''
  });
  const [filteredVehicules, setFilteredVehicules] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date_heure: new Date().toISOString().slice(0, 16),
    contenu: '',
    type_entree: '',
    type_entree_libre: '',
    tags: '',
    etat: 'Valide'
  });

  const typeEntreeOptions = [
    'information',
    'action',
    'alerte',
    'decision',
    'contact',
    'intervention',
    'retour',
    'autre'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPersonnel();
      fetchMoyens();
      fetchVehicules();
      fetchRessourcesEngagees();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      // Réinitialiser le formulaire
      setFormData({
        date_heure: new Date().toISOString().slice(0, 16),
        contenu: '',
        type_entree: '',
        type_entree_libre: '',
        tags: '',
        etat: 'Valide'
      });
      setUploadingFiles([]);
      setUploadingDocuments([]);
      setUploadProgress({});
      setSelectedPersonnel([]);
      setSelectedMoyens([]);
      setSelectedVehicules([]);
      setSelectedPersonnelLiberer([]);
      setSelectedMoyensLiberer([]);
      setSelectedVehiculesLiberer([]);
      setNewPersonnelData(null);
      setPersonnelSearch({
        texte: '',
        matricule: '',
        nom: '',
        prenom: '',
        fonction: '',
        service: ''
      });
      setMoyensSearch({
        texte: '',
        code: '',
        nom: '',
        categorie: ''
      });
      setVehiculesSearch({
        texte: '',
        immatriculation: '',
        type_vehicule: '',
        marque: ''
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activationId]);

  const fetchPersonnel = async () => {
    try {
      const response = await api.get('/api/personnel/?skip=0&limit=1000');
      // Filtrer le personnel : seulement disponible, occupé, repos (exclure absent et non_disponible)
      const personnelDisponible = response.data.filter((p: any) => {
        const statut = p.statut?.toLowerCase();
        return statut === 'disponible' || statut === 'occupe' || statut === 'repos' || statut === 'engage';
      });
      setPersonnelList(personnelDisponible);
      setFilteredPersonnel(personnelDisponible);
    } catch (err: any) {
      console.error('Erreur lors du chargement du personnel:', err);
    }
  };

  const fetchMoyens = async () => {
    try {
      const response = await api.get('/api/moyens/?skip=0&limit=1000&actif=true');
      // Filtrer les moyens disponibles (état = disponible)
      const moyensDisponibles = response.data.filter((m: any) => {
        const etat = m.etat?.toLowerCase();
        return etat === 'disponible';
      });
      setMoyensList(moyensDisponibles);
      setFilteredMoyens(moyensDisponibles);
    } catch (err: any) {
      console.error('Erreur lors du chargement des moyens:', err);
    }
  };

  const fetchVehicules = async () => {
    try {
      const response = await api.get('/api/vehicules/?skip=0&limit=1000&actif=true');
      // Filtrer les véhicules disponibles (pour engagement)
      const vehiculesDisponibles = response.data.filter((v: any) => {
        const statut = v.statut?.toLowerCase();
        return statut === 'disponible' || statut === 'en_mission' || statut === 'en_maintenance';
      });
      setVehiculesList(vehiculesDisponibles);
      setFilteredVehicules(vehiculesDisponibles);
    } catch (err: any) {
      console.error('Erreur lors du chargement des véhicules:', err);
    }
  };

  const fetchRessourcesEngagees = async () => {
    try {
      // Récupérer les entrées de main courante pour cette activation
      const response = await api.get(`/api/main-courante/?activation_id=${activationId}&skip=0&limit=1000`);
      const entries = response.data || [];
      
      // Extraire les ressources engagées (sans date de libération)
      const personnelEngages: any[] = [];
      const moyensEngages: any[] = [];
      const vehiculesEngages: any[] = [];
      
      entries.forEach((entry: any) => {
        if (entry.personnel_engages) {
          entry.personnel_engages.forEach((pe: any) => {
            if (!pe.date_liberation && pe.personnel) {
              personnelEngages.push(pe.personnel);
            }
          });
        }
        if (entry.moyens_engages) {
          entry.moyens_engages.forEach((me: any) => {
            if (!me.date_liberation && me.moyen) {
              moyensEngages.push(me.moyen);
            }
          });
        }
        if (entry.vehicules_engages) {
          entry.vehicules_engages.forEach((ve: any) => {
            if (!ve.date_liberation && ve.vehicule) {
              vehiculesEngages.push(ve.vehicule);
            }
          });
        }
      });
      
      setPersonnelEngagesList(personnelEngages);
      setMoyensEngagesList(moyensEngages);
      setVehiculesEngagesList(vehiculesEngages);
    } catch (err: any) {
      console.error('Erreur lors du chargement des ressources engagées:', err);
    }
  };

  // Fonction de filtrage du personnel
  useEffect(() => {
    if (personnelList.length === 0) {
      setFilteredPersonnel([]);
      return;
    }

    // Vérifier si tous les critères de recherche sont vides
    const allEmpty = !personnelSearch.texte && 
                     !personnelSearch.matricule && 
                     !personnelSearch.nom && 
                     !personnelSearch.prenom && 
                     !personnelSearch.fonction && 
                     !personnelSearch.service;

    // Si tous les critères sont vides, afficher tout le personnel
    if (allEmpty) {
      setFilteredPersonnel(personnelList);
      return;
    }

    const filtered = personnelList.filter(person => {
      // Recherche par texte général (tous les champs) - si rempli, ignore les autres critères spécifiques
      if (personnelSearch.texte && personnelSearch.texte.trim()) {
        const searchText = personnelSearch.texte.toLowerCase().trim();
        const matchesText = 
          (person.matricule && person.matricule.toLowerCase().includes(searchText)) ||
          (person.nom && person.nom.toLowerCase().includes(searchText)) ||
          (person.prenom && person.prenom.toLowerCase().includes(searchText)) ||
          (person.nom_court && person.nom_court.toLowerCase().includes(searchText)) ||
          (person.fonction && person.fonction.toLowerCase().includes(searchText)) ||
          (person.service && person.service.toLowerCase().includes(searchText));
        
        if (!matchesText) return false;
      } else {
        // Si pas de recherche texte générale, utiliser les critères spécifiques
        
        // Recherche par matricule
        if (personnelSearch.matricule && personnelSearch.matricule.trim()) {
          const searchMatricule = personnelSearch.matricule.toLowerCase().trim();
          if (!person.matricule || !person.matricule.toLowerCase().includes(searchMatricule)) {
            return false;
          }
        }

        // Recherche par nom
        if (personnelSearch.nom && personnelSearch.nom.trim()) {
          const searchNom = personnelSearch.nom.toLowerCase().trim();
          if (!person.nom || !person.nom.toLowerCase().includes(searchNom)) {
            return false;
          }
        }

        // Recherche par prénom
        if (personnelSearch.prenom && personnelSearch.prenom.trim()) {
          const searchPrenom = personnelSearch.prenom.toLowerCase().trim();
          if (!person.prenom || !person.prenom.toLowerCase().includes(searchPrenom)) {
            return false;
          }
        }

        // Recherche par fonction
        if (personnelSearch.fonction && personnelSearch.fonction.trim()) {
          const searchFonction = personnelSearch.fonction.toLowerCase().trim();
          if (!person.fonction || !person.fonction.toLowerCase().includes(searchFonction)) {
            return false;
          }
        }

        // Recherche par service
        if (personnelSearch.service && personnelSearch.service.trim()) {
          const searchService = personnelSearch.service.toLowerCase().trim();
          if (!person.service || !person.service.toLowerCase().includes(searchService)) {
            return false;
          }
        }
      }

      return true;
    });

    setFilteredPersonnel(filtered);
  }, [personnelSearch, personnelList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit appelé');
    
    // Vérifier s'il y a des fichiers en cours d'upload
    if (uploadingFiles.length > 0) {
      setError('Veuillez attendre la fin de l\'upload des fichiers avant de créer l\'entrée.');
      return;
    }
    
    // Validation des champs requis
    if (!formData.contenu.trim()) {
      setError('Le contenu est requis.');
      return;
    }
    
    if (!formData.date_heure) {
      setError('La date et l\'heure sont requises.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('Préparation du payload...');
      
      // Déterminer le type d'entrée (prédéfini ou libre)
      const typeEntree = formData.type_entree === 'autre' 
        ? formData.type_entree_libre 
        : formData.type_entree || formData.type_entree_libre;

      // Préparer les pièces jointes (JSON array d'IDs)
      // Utiliser uniquement les documents uploadés
      const piecesJointes = uploadingDocuments.length > 0 
        ? JSON.stringify(uploadingDocuments) 
        : null;

      // Préparer les tags (JSON array)
      const tags = formData.tags.trim() 
        ? JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t))
        : null;

      const payload = {
        activation_id: activationId,
        date_heure: new Date(formData.date_heure).toISOString(),
        contenu: formData.contenu.trim(),
        type_entree: typeEntree || null,
        pieces_jointes: piecesJointes,
        tags: tags,
        etat: formData.etat,
        personnel_ids: selectedPersonnel.length > 0 ? selectedPersonnel : undefined,
        moyens_ids: selectedMoyens.length > 0 ? selectedMoyens : undefined,
        vehicules_ids: selectedVehicules.length > 0 ? selectedVehicules : undefined,
        personnel_ids_liberer: selectedPersonnelLiberer.length > 0 ? selectedPersonnelLiberer : undefined,
        moyens_ids_liberer: selectedMoyensLiberer.length > 0 ? selectedMoyensLiberer : undefined,
        vehicules_ids_liberer: selectedVehiculesLiberer.length > 0 ? selectedVehiculesLiberer : undefined
      };

      console.log('Payload:', payload);
      console.log('Envoi de la requête à /api/main-courante/...');
      
      const response = await api.post('/api/main-courante/', payload);
      console.log('Réponse reçue:', response.data);
      
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'entrée:', err);
      console.error('Détails de l\'erreur:', err.response?.data);
      setError(err.response?.data?.detail || err.message || "Impossible de créer l'entrée.");
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingFiles(prev => [...prev, ...fileArray]);

    // Uploader chaque fichier
    for (const file of fileArray) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('titre', file.name);
        uploadData.append('auteur', 'Main courante'); // Auteur par défaut
        
        // Simuler la progression
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await api.post('/api/documents/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
            }
          },
        });

        // Ajouter le document uploadé à la liste des documents
        const newDocId = response.data.document_id;
        setUploadingDocuments(prev => [...prev, newDocId]);
        
        // Retirer le fichier de la liste d'upload
        setUploadingFiles(prev => prev.filter(f => f !== file));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      } catch (err: any) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, err);
        setError(`Erreur lors de l'upload de ${file.name}: ${err.response?.data?.detail || err.message}`);
        // Retirer le fichier de la liste d'upload même en cas d'erreur
        setUploadingFiles(prev => prev.filter(f => f !== file));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
  };

  const handleRemoveUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f !== file));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="main-courante-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nouvelle entrée de main courante</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date_heure">Date et heure *</label>
            <input
              id="date_heure"
              type="datetime-local"
              value={formData.date_heure}
              onChange={(e) => setFormData({ ...formData, date_heure: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contenu">Contenu *</label>
            <textarea
              id="contenu"
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              required
              rows={6}
              placeholder="Décrivez l'événement, l'action, l'information..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="type_entree">Type d'entrée</label>
            <select
              id="type_entree"
              value={formData.type_entree}
              onChange={(e) => setFormData({ ...formData, type_entree: e.target.value })}
            >
              <option value="">-- Sélectionner un type prédéfini --</option>
              {typeEntreeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
            {(formData.type_entree === 'autre' || !formData.type_entree) && (
              <input
                type="text"
                value={formData.type_entree_libre}
                onChange={(e) => setFormData({ ...formData, type_entree_libre: e.target.value })}
                placeholder={formData.type_entree === 'autre' 
                  ? "Saisir un type personnalisé" 
                  : "Ou saisir un type libre"}
                className="mt-2"
              />
            )}
            <small>Vous pouvez choisir un type prédéfini ou saisir un type libre</small>
          </div>

          <div className="form-group">
            <label htmlFor="pieces_jointes">Pièces jointes (documents)</label>
            
            {/* Section d'upload de nouveaux fichiers */}
            <div className="file-upload-section" style={{ 
              marginBottom: '1.5rem', 
              padding: '1.5rem', 
              border: '2px dashed var(--primary-color)', 
              borderRadius: '0.5rem', 
              backgroundColor: 'var(--background)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!loading) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              if (!loading) {
                document.getElementById('file-upload')?.click();
              }
            }}>
              <div style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: 700, 
                color: 'var(--primary-color)',
                fontSize: '1.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                pointerEvents: 'none'
              }}>
                📎 Cliquez ici ou glissez-déposez pour ajouter un nouveau fichier
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={(e) => {
                  handleFileUpload(e.target.files);
                  // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
                  e.target.value = '';
                }}
                style={{ 
                  display: 'none'
                }}
                disabled={loading}
              />
              <small style={{ 
                display: 'block', 
                color: 'var(--text-secondary)',
                fontSize: '0.9em',
                lineHeight: '1.5'
              }}>
                Les fichiers uploadés seront automatiquement ajoutés à la base documentaire et attachés à cette entrée de main courante.
              </small>
              
              {/* Afficher les fichiers en cours d'upload */}
              {uploadingFiles.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '0.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                    📤 Fichiers en cours d'upload :
                  </strong>
                  {uploadingFiles.map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      <span style={{ flex: 1, fontWeight: 500 }}>{file.name}</span>
                      {uploadProgress[file.name] !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '6px', 
                            backgroundColor: 'var(--border-color)', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${uploadProgress[file.name]}%`, 
                              height: '100%', 
                              backgroundColor: 'var(--primary-color)',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '40px' }}>
                            {uploadProgress[file.name]}%
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUploadingFile(file);
                        }}
                        style={{
                          background: 'var(--danger-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          minWidth: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Annuler l'upload"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Afficher les fichiers uploadés avec succès */}
              {uploadingDocuments.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#22c55e' }}>
                    ✅ Fichiers uploadés avec succès ({uploadingDocuments.length}) :
                  </strong>
                  <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                    Ces fichiers ont été ajoutés à la base documentaire et seront attachés à cette entrée.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="personnel" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Personnel engagé
            </label>
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setNewPersonnelData({
                    matricule: '',
                    nom: '',
                    prenom: '',
                    fonction: '',
                    service: '',
                    telephone: '',
                    statut: 'engage'
                  });
                  setShowPersonnelModal(true);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                + Créer un nouveau personnel
              </button>
            </div>

            {/* Moteur de recherche multi-critères */}
            {personnelList.length > 0 && (
              <div style={{ 
                marginBottom: '0.75rem', 
                padding: '1rem', 
                backgroundColor: 'var(--background)', 
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  🔍 Recherche multi-critères
                </div>
                
                {/* Recherche texte générale */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Recherche générale (nom, prénom, matricule, fonction, service...)"
                    value={personnelSearch.texte}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, texte: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Critères détaillés */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    placeholder="Matricule"
                    value={personnelSearch.matricule}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, matricule: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={personnelSearch.nom}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, nom: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={personnelSearch.prenom}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, prenom: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={personnelSearch.fonction}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, fonction: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Service"
                    value={personnelSearch.service}
                    onChange={(e) => setPersonnelSearch({ ...personnelSearch, service: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      gridColumn: 'span 2'
                    }}
                  />
                </div>

                {/* Bouton réinitialiser */}
                {(personnelSearch.texte || personnelSearch.matricule || personnelSearch.nom || personnelSearch.prenom || personnelSearch.fonction || personnelSearch.service) && (
                  <button
                    type="button"
                    onClick={() => setPersonnelSearch({
                      texte: '',
                      matricule: '',
                      nom: '',
                      prenom: '',
                      fonction: '',
                      service: ''
                    })}
                    style={{
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'var(--text-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Réinitialiser la recherche
                  </button>
                )}

                {/* Compteur de résultats */}
                {filteredPersonnel.length !== personnelList.length && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    {filteredPersonnel.length} résultat{filteredPersonnel.length > 1 ? 's' : ''} sur {personnelList.length}
                  </div>
                )}
              </div>
            )}

            {personnelList.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun personnel disponible. Cliquez sur le bouton ci-dessus pour en créer un.
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun résultat trouvé. Modifiez vos critères de recherche.
              </div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: '250px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  padding: '0.5rem',
                  backgroundColor: 'var(--surface)'
                }}>
                  {filteredPersonnel.map(person => (
                    <label 
                      key={person.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.75rem', 
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        transition: 'background-color 0.2s',
                        marginBottom: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPersonnel.includes(person.id)}
                        onChange={() => {
                          if (selectedPersonnel.includes(person.id)) {
                            setSelectedPersonnel(selectedPersonnel.filter(id => id !== person.id));
                          } else {
                            setSelectedPersonnel([...selectedPersonnel, person.id]);
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: '0.95rem' }}>
                          {person.nom_court || `${person.prenom || ''} ${person.nom || ''}`.trim() || 'Sans nom'}
                        </span>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {person.matricule || 'Sans matricule'} {person.fonction ? ` • ${person.fonction}` : ''} {person.service ? ` • ${person.service}` : ''}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedPersonnel.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    borderRadius: '0.25rem', 
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {selectedPersonnel.length} personne{selectedPersonnel.length > 1 ? 's' : ''} sélectionnée{selectedPersonnel.length > 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Sélectionnez le personnel engagé pour cette entrée. Vous pouvez également créer un nouveau personnel.
            </small>
          </div>

          {showPersonnelModal && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowPersonnelModal(false); setNewPersonnelData(null); }}>
              <div style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: '0.5rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 0 }}>Créer un nouveau personnel</h3>
                  <button 
                    type="button"
                    onClick={() => { setShowPersonnelModal(false); setNewPersonnelData(null); }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '1.5rem', 
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '0',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newPersonnelData || !newPersonnelData.matricule || !newPersonnelData.nom || !newPersonnelData.prenom) {
                    setError('Veuillez remplir tous les champs obligatoires (matricule, nom, prénom).');
                    return;
                  }
                  try {
                    const response = await api.post('/api/personnel', newPersonnelData);
                    setSelectedPersonnel([...selectedPersonnel, response.data.id]);
                    await fetchPersonnel();
                    setShowPersonnelModal(false);
                    setNewPersonnelData(null);
                    setError(null);
                  } catch (err: any) {
                    setError(err.response?.data?.detail || err.message || "Impossible de créer le personnel.");
                  }
                }}>
                  <div className="form-group">
                    <label>Matricule *</label>
                    <input
                      type="text"
                      value={newPersonnelData?.matricule || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, matricule: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={newPersonnelData?.nom || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={newPersonnelData?.prenom || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fonction</label>
                    <input
                      type="text"
                      value={newPersonnelData?.fonction || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, fonction: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Service</label>
                    <input
                      type="text"
                      value={newPersonnelData?.service || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, service: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      value={newPersonnelData?.telephone || ''}
                      onChange={(e) => setNewPersonnelData({ ...newPersonnelData, telephone: e.target.value })}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowPersonnelModal(false); setNewPersonnelData(null); }}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Créer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section Moyens engagés */}
          <div className="form-group">
            <label htmlFor="moyens" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Moyens engagés
            </label>

            {/* Moteur de recherche pour les moyens */}
            {moyensList.length > 0 && (
              <div style={{ 
                marginBottom: '0.75rem', 
                padding: '1rem', 
                backgroundColor: 'var(--background)', 
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  🔍 Recherche de moyens
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Recherche générale (code, nom, catégorie...)"
                    value={moyensSearch.texte}
                    onChange={(e) => setMoyensSearch({ ...moyensSearch, texte: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    placeholder="Code"
                    value={moyensSearch.code}
                    onChange={(e) => setMoyensSearch({ ...moyensSearch, code: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={moyensSearch.nom}
                    onChange={(e) => setMoyensSearch({ ...moyensSearch, nom: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Catégorie"
                    value={moyensSearch.categorie}
                    onChange={(e) => setMoyensSearch({ ...moyensSearch, categorie: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {(moyensSearch.texte || moyensSearch.code || moyensSearch.nom || moyensSearch.categorie) && (
                  <button
                    type="button"
                    onClick={() => setMoyensSearch({ texte: '', code: '', nom: '', categorie: '' })}
                    style={{
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'var(--text-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Réinitialiser la recherche
                  </button>
                )}

                {filteredMoyens.length !== moyensList.length && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    {filteredMoyens.length} résultat{filteredMoyens.length > 1 ? 's' : ''} sur {moyensList.length}
                  </div>
                )}
              </div>
            )}

            {moyensList.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun moyen disponible.
              </div>
            ) : filteredMoyens.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun résultat trouvé. Modifiez vos critères de recherche.
              </div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  padding: '0.5rem',
                  backgroundColor: 'var(--surface)'
                }}>
                  {filteredMoyens.map(moyen => (
                    <label 
                      key={moyen.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.75rem', 
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        transition: 'background-color 0.2s',
                        marginBottom: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMoyens.includes(moyen.id)}
                        onChange={() => {
                          if (selectedMoyens.includes(moyen.id)) {
                            setSelectedMoyens(selectedMoyens.filter(id => id !== moyen.id));
                          } else {
                            setSelectedMoyens([...selectedMoyens, moyen.id]);
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: '0.95rem' }}>
                          {moyen.code || 'Sans code'} - {moyen.nom || 'Sans nom'}
                        </span>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {moyen.categorie || 'Sans catégorie'} {moyen.statut ? ` • ${moyen.statut}` : ''}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedMoyens.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    borderRadius: '0.25rem', 
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {selectedMoyens.length} moyen{selectedMoyens.length > 1 ? 's' : ''} sélectionné{selectedMoyens.length > 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Sélectionnez les moyens engagés pour cette entrée.
            </small>
          </div>

          {/* Section Véhicules engagés */}
          <div className="form-group">
            <label htmlFor="vehicules" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Véhicules engagés
            </label>

            {/* Moteur de recherche pour les véhicules */}
            {vehiculesList.length > 0 && (
              <div style={{ 
                marginBottom: '0.75rem', 
                padding: '1rem', 
                backgroundColor: 'var(--background)', 
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  🔍 Recherche de véhicules
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Recherche générale (immatriculation, type, marque, modèle...)"
                    value={vehiculesSearch.texte}
                    onChange={(e) => setVehiculesSearch({ ...vehiculesSearch, texte: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    placeholder="Immatriculation"
                    value={vehiculesSearch.immatriculation}
                    onChange={(e) => setVehiculesSearch({ ...vehiculesSearch, immatriculation: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Type"
                    value={vehiculesSearch.type_vehicule}
                    onChange={(e) => setVehiculesSearch({ ...vehiculesSearch, type_vehicule: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Marque"
                    value={vehiculesSearch.marque}
                    onChange={(e) => setVehiculesSearch({ ...vehiculesSearch, marque: e.target.value })}
                    style={{
                      padding: '0.4rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {(vehiculesSearch.texte || vehiculesSearch.immatriculation || vehiculesSearch.type_vehicule || vehiculesSearch.marque) && (
                  <button
                    type="button"
                    onClick={() => setVehiculesSearch({ texte: '', immatriculation: '', type_vehicule: '', marque: '' })}
                    style={{
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'var(--text-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Réinitialiser la recherche
                  </button>
                )}

                {filteredVehicules.length !== vehiculesList.length && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    {filteredVehicules.length} résultat{filteredVehicules.length > 1 ? 's' : ''} sur {vehiculesList.length}
                  </div>
                )}
              </div>
            )}

            {vehiculesList.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun véhicule disponible.
              </div>
            ) : filteredVehicules.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                Aucun résultat trouvé. Modifiez vos critères de recherche.
              </div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  padding: '0.5rem',
                  backgroundColor: 'var(--surface)'
                }}>
                  {filteredVehicules.map(vehicule => (
                    <label 
                      key={vehicule.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.75rem', 
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        transition: 'background-color 0.2s',
                        marginBottom: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVehicules.includes(vehicule.id)}
                        onChange={() => {
                          if (selectedVehicules.includes(vehicule.id)) {
                            setSelectedVehicules(selectedVehicules.filter(id => id !== vehicule.id));
                          } else {
                            setSelectedVehicules([...selectedVehicules, vehicule.id]);
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: '0.95rem' }}>
                          {vehicule.immatriculation || 'Sans immatriculation'}
                        </span>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {vehicule.type_vehicule || 'Sans type'} {vehicule.marque ? ` • ${vehicule.marque}` : ''} {vehicule.modele ? ` • ${vehicule.modele}` : ''}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedVehicules.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    borderRadius: '0.25rem', 
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {selectedVehicules.length} véhicule{selectedVehicules.length > 1 ? 's' : ''} sélectionné{selectedVehicules.length > 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Sélectionnez les véhicules engagés pour cette entrée.
            </small>
          </div>

          {/* Section Libération de ressources */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#22c55e', fontSize: '1.1rem' }}>
              🔓 Libération de ressources
            </h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Sélectionnez les ressources à libérer (remettre en statut "disponible"). Utile lors de la fermeture d'un centre d'accueil par exemple.
            </p>

            {/* Libération du personnel */}
            {personnelEngagesList.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Personnel à libérer
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.25rem',
                  padding: '0.5rem'
                }}>
                  {personnelEngagesList.map((person: any) => (
                    <label key={person.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedPersonnelLiberer.includes(person.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPersonnelLiberer([...selectedPersonnelLiberer, person.id]);
                          } else {
                            setSelectedPersonnelLiberer(selectedPersonnelLiberer.filter(id => id !== person.id));
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>
                        {person.nom_court || `${person.prenom || ''} ${person.nom || ''}`.trim()}
                        {person.matricule && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({person.matricule})</span>}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedPersonnelLiberer.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#22c55e', fontSize: '0.9rem' }}>
                    {selectedPersonnelLiberer.length} personne{selectedPersonnelLiberer.length > 1 ? 's' : ''} sélectionnée{selectedPersonnelLiberer.length > 1 ? 's' : ''} pour libération
                  </div>
                )}
              </div>
            )}

            {/* Libération des moyens */}
            {moyensEngagesList.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Moyens à libérer
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.25rem',
                  padding: '0.5rem'
                }}>
                  {moyensEngagesList.map((moyen: any) => (
                    <label key={moyen.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedMoyensLiberer.includes(moyen.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMoyensLiberer([...selectedMoyensLiberer, moyen.id]);
                          } else {
                            setSelectedMoyensLiberer(selectedMoyensLiberer.filter(id => id !== moyen.id));
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>
                        {moyen.code || 'Sans code'} - {moyen.nom || 'Sans nom'}
                        {moyen.categorie && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({moyen.categorie})</span>}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedMoyensLiberer.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#22c55e', fontSize: '0.9rem' }}>
                    {selectedMoyensLiberer.length} moyen{selectedMoyensLiberer.length > 1 ? 's' : ''} sélectionné{selectedMoyensLiberer.length > 1 ? 's' : ''} pour libération
                  </div>
                )}
              </div>
            )}

            {/* Libération des véhicules */}
            {vehiculesEngagesList.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Véhicules à libérer
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.25rem',
                  padding: '0.5rem'
                }}>
                  {vehiculesEngagesList.map((vehicule: any) => (
                    <label key={vehicule.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedVehiculesLiberer.includes(vehicule.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVehiculesLiberer([...selectedVehiculesLiberer, vehicule.id]);
                          } else {
                            setSelectedVehiculesLiberer(selectedVehiculesLiberer.filter(id => id !== vehicule.id));
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>
                        {vehicule.immatriculation || 'Sans immatriculation'}
                        {vehicule.type_vehicule && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({vehicule.type_vehicule})</span>}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedVehiculesLiberer.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#22c55e', fontSize: '0.9rem' }}>
                    {selectedVehiculesLiberer.length} véhicule{selectedVehiculesLiberer.length > 1 ? 's' : ''} sélectionné{selectedVehiculesLiberer.length > 1 ? 's' : ''} pour libération
                  </div>
                )}
              </div>
            )}

            {personnelEngagesList.length === 0 && moyensEngagesList.length === 0 && vehiculesEngagesList.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Aucune ressource engagée pour cette activation
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="urgent, personnel, moyens, intervention..."
            />
            <small>Séparez les tags par des virgules</small>
          </div>

          <div className="form-group">
            <label htmlFor="etat">État</label>
            <select
              id="etat"
              value={formData.etat}
              onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
            >
              <option value="Valide">Valide</option>
              <option value="erreur de saisie">Erreur de saisie</option>
            </select>
            <small>Par défaut : Valide. Vous pourrez modifier l'état après création.</small>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={loading}
              onClick={async (e) => {
                e.preventDefault();
                console.log('Bouton cliqué - soumission manuelle');
                
                // Validation
                if (!formData.contenu.trim()) {
                  setError('Le contenu est requis.');
                  return;
                }
                if (!formData.date_heure) {
                  setError('La date et l\'heure sont requises.');
                  return;
                }
                
                // Appeler handleSubmit manuellement
                const fakeEvent = {
                  preventDefault: () => {}
                } as React.FormEvent;
                await handleSubmit(fakeEvent);
              }}
            >
              {loading ? 'Création...' : 'Créer l\'entrée'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MainCouranteModal;

