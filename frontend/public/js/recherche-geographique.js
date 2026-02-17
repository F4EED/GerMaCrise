/**
 * Module de recherche géographique pour cartoff3.html
 * Permet de rechercher et zoomer sur des départements et communes
 */

(function(){
  console.log('[Recherche Geo] ==========================================');
  console.log('[Recherche Geo] Script recherche-geographique.js chargé');
  console.log('[Recherche Geo] Timestamp:', new Date().toISOString());
  console.log('[Recherche Geo] document.readyState:', document.readyState);
  console.log('[Recherche Geo] ==========================================');
  
  if (window.__recherche_geo_init__) {
    console.log('[Recherche Geo] init déjà effectué, arrêt');
    return;
  }

  function initRechercheGeoModule(){
    console.log('[Recherche Geo] Tentative d\'initialisation...');
    console.log('[Recherche Geo] map défini?', typeof map !== 'undefined');
    console.log('[Recherche Geo] document.readyState:', document.readyState);
    console.log('[Recherche Geo] document.body existe?', !!document.body);
    
    // Vérifier que le body existe
    if (!document.body) {
      console.warn('[Recherche Geo] Body non disponible, réessai dans 200ms');
      setTimeout(initRechercheGeoModule, 200);
      return;
    }
    
    if (typeof map === 'undefined') {
      console.warn('[Recherche Geo] Map indisponible, réessai dans 200ms');
      setTimeout(initRechercheGeoModule, 200);
      return;
    }
    if (window.__recherche_geo_init__) {
      console.log('[Recherche Geo] Déjà initialisé, arrêt');
      return;
    }
    window.__recherche_geo_init__ = true;
    console.log('[Recherche Geo] Initialisation module de recherche géographique');

    // Déterminer l'URL de l'API
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : `${window.location.protocol}//${window.location.hostname}:8000`;
    console.log('[Recherche Geo] API Base URL:', apiBaseUrl);

    // Attendre un peu pour que tous les éléments soient dans le DOM
    setTimeout(() => {
      const departementSelect = document.getElementById('searchDepartementSelect');
      const communeSelect = document.getElementById('searchCommuneSelect');
      const rueSelect = document.getElementById('searchRueSelect');
      const numeroSelect = document.getElementById('searchNumeroSelect');
      
      console.log('[Recherche Geo] Éléments DOM trouvés:', {
        departementSelect: !!departementSelect,
        communeSelect: !!communeSelect,
        rueSelect: !!rueSelect,
        numeroSelect: !!numeroSelect
      });
      
      if (!departementSelect || !communeSelect) {
        console.error('[Recherche Geo] Éléments DOM non trouvés - departementSelect:', !!departementSelect, 'communeSelect:', !!communeSelect);
        console.error('[Recherche Geo] Tentative de recherche alternative...');
        // Essayer de trouver les éléments avec querySelector
        const altDepartement = document.querySelector('#searchDepartementSelect');
        const altCommune = document.querySelector('#searchCommuneSelect');
        console.error('[Recherche Geo] querySelector résultats:', {
          departement: !!altDepartement,
          commune: !!altCommune
        });
        // Afficher tous les selects dans le document pour déboguer
        const allSelects = document.querySelectorAll('select');
        console.error('[Recherche Geo] Tous les selects trouvés:', allSelects.length);
        allSelects.forEach((sel, idx) => {
          console.error(`[Recherche Geo] Select ${idx}: id="${sel.id}", name="${sel.name}"`);
        });
        // Réessayer une dernière fois après un délai
        console.error('[Recherche Geo] Réessai dans 1 seconde...');
        setTimeout(() => {
          const retryDepartement = document.getElementById('searchDepartementSelect');
          const retryCommune = document.getElementById('searchCommuneSelect');
          const retryRue = document.getElementById('searchRueSelect');
          const retryNumero = document.getElementById('searchNumeroSelect');
          if (retryDepartement && retryCommune) {
            console.log('[Recherche Geo] Éléments trouvés au réessai, initialisation...');
            initializeModule(retryDepartement, retryCommune, retryRue, retryNumero, apiBaseUrl);
          } else {
            console.error('[Recherche Geo] Éléments toujours introuvables après réessai');
          }
        }, 1000);
        return;
      }
      
      initializeModule(departementSelect, communeSelect, rueSelect, numeroSelect, apiBaseUrl);
    }, 300);
  }
  
  function initializeModule(departementSelect, communeSelect, rueSelect, numeroSelect, apiBaseUrl) {
    console.log('[Recherche Geo] Début de initializeModule');
    // Vérifier que les éléments sont bien dans le DOM
    console.log('[Recherche Geo] Vérification des éléments:', {
      departementSelectParent: departementSelect.parentElement?.tagName,
      communeSelectParent: communeSelect.parentElement?.tagName,
      rueSelectParent: rueSelect?.parentElement?.tagName,
      numeroSelectParent: numeroSelect?.parentElement?.tagName,
      departementSelectDisabled: departementSelect.disabled,
      communeSelectDisabled: communeSelect.disabled,
      rueSelectDisabled: rueSelect?.disabled,
      numeroSelectDisabled: numeroSelect?.disabled
    });

    // Calque temporaire pour afficher la sélection
    let currentLayer = null;
    let currentLayerType = null; // 'departement' ou 'commune'

    // Charger les départements
    async function loadDepartements() {
      console.log('[Recherche Geo] loadDepartements appelé');
      try {
        if (!departementSelect) {
          console.error('[Recherche Geo] departementSelect est null dans loadDepartements');
          return;
        }
        departementSelect.innerHTML = '<option value="">-- Chargement... --</option>';
        const url = `${apiBaseUrl}/api/geographie/departements?limit=200`;
        console.log('[Recherche Geo] Appel API:', url);
        const response = await fetch(url);
        console.log('[Recherche Geo] Réponse reçue:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const departements = await response.json();
        console.log('[Recherche Geo] Départements reçus:', departements.length);
        
        departementSelect.innerHTML = '<option value="">-- Choisir un département --</option>';
        departements.forEach(dep => {
          const option = document.createElement('option');
          option.value = dep.code_insee;
          option.textContent = `${dep.nom} (${dep.code_insee})`;
          departementSelect.appendChild(option);
        });
        console.log(`[Recherche Geo] ${departements.length} départements chargés dans le select`);
      } catch (err) {
        console.error('[Recherche Geo] Erreur lors du chargement des départements:', err);
        console.error('[Recherche Geo] Stack:', err.stack);
        if (departementSelect) {
          departementSelect.innerHTML = '<option value="">-- Erreur de chargement --</option>';
        }
        if (typeof showMessage === 'function') {
          showMessage('Erreur lors du chargement des départements', 5);
        }
      }
    }

    // Charger les communes d'un département
    async function loadCommunes(codeDepartement) {
      if (!codeDepartement) {
        communeSelect.innerHTML = '<option value="">-- Choisir d\'abord un département --</option>';
        communeSelect.disabled = true;
        return;
      }

      try {
        communeSelect.innerHTML = '<option value="">-- Chargement... --</option>';
        communeSelect.disabled = true;
        
        const response = await fetch(`${apiBaseUrl}/api/geographie/communes/departement/${codeDepartement}?limit=1000`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const communes = await response.json();
        
        communeSelect.innerHTML = '<option value="">-- Choisir une commune --</option>';
        communes.forEach(commune => {
          const option = document.createElement('option');
          option.value = commune.code_insee;
          option.textContent = `${commune.nom} (${commune.code_insee})`;
          communeSelect.appendChild(option);
        });
        communeSelect.disabled = false;
        console.log(`[Recherche Geo] ${communes.length} communes chargées pour le département ${codeDepartement}`);
      } catch (err) {
        console.error('[Recherche Geo] Erreur lors du chargement des communes:', err);
        communeSelect.innerHTML = '<option value="">-- Erreur de chargement --</option>';
        communeSelect.disabled = true;
        if (typeof showMessage === 'function') {
          showMessage('Erreur lors du chargement des communes', 5);
        }
      }
    }

    // Charger les rues d'une commune
    async function loadRues(codeCommune) {
      // Récupérer rueSelect directement au cas où il ne serait pas dans la portée
      const currentRueSelect = rueSelect || document.getElementById('searchRueSelect');
      
      if (!codeCommune || !currentRueSelect) {
        console.warn('[Recherche Geo] loadRues ignoré (codeCommune ou rueSelect manquant)', { 
          codeCommune, 
          rueSelect: !!rueSelect,
          currentRueSelect: !!currentRueSelect,
          elementById: !!document.getElementById('searchRueSelect')
        });
        if (currentRueSelect) {
          currentRueSelect.innerHTML = '<option value="">-- Choisir d\'abord une commune --</option>';
          currentRueSelect.disabled = true;
        }
        return;
      }

      try {
        console.log('[Recherche Geo] loadRues() début', { codeCommune, apiBaseUrl, rueSelect: !!currentRueSelect });
        if (typeof showMessage === 'function') {
          showMessage(`Chargement des rues (BAN) pour ${codeCommune}…`, 2);
        }
        currentRueSelect.innerHTML = '<option value="">-- Chargement... --</option>';
        currentRueSelect.disabled = true;
        
        const url = `${apiBaseUrl}/api/geographie/ban/rues/${codeCommune}`;
        console.log('[Recherche Geo] loadRues() fetch', url);
        const response = await fetch(url);
        console.log('[Recherche Geo] loadRues() response', { status: response.status, ok: response.ok });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const rues = data.rues || [];
        console.log('[Recherche Geo] loadRues() data', { count: rues.length, sample: rues.slice(0, 5) });
        
        currentRueSelect.innerHTML = '<option value="">-- Choisir une rue --</option>';
        rues.forEach(rue => {
          const option = document.createElement('option');
          option.value = rue;
          option.textContent = rue;
          currentRueSelect.appendChild(option);
        });
        currentRueSelect.disabled = false;
        console.log(`[Recherche Geo] ✓ ${rues.length} rues chargées pour la commune ${codeCommune}`);
      } catch (err) {
        console.error('[Recherche Geo] ❌ Erreur lors du chargement des rues:', err);
        console.error('[Recherche Geo] Stack:', err.stack);
        if (currentRueSelect) {
          currentRueSelect.innerHTML = '<option value="">-- Erreur de chargement --</option>';
          currentRueSelect.disabled = true;
        }
        if (typeof showMessage === 'function') {
          showMessage(`Erreur chargement rues (BAN). Ouvre la console (F12) pour le détail.`, 6);
        }
      }
    }

    // Zoomer sur un département
    async function zoomOnDepartement(codeDepartement) {
      if (!codeDepartement) return;

      try {
        // Retirer le calque précédent
        if (currentLayer) {
          if (map.hasLayer(currentLayer)) {
            map.removeLayer(currentLayer);
          }
          currentLayer = null;
          currentLayerType = null;
        }

        const response = await fetch(`${apiBaseUrl}/api/geographie/departements/${codeDepartement}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const departement = await response.json();
        console.log('[Recherche Geo] Département récupéré:', departement);
        console.log('[Recherche Geo] Géométrie:', JSON.stringify(departement.geom).substring(0, 200));

        if (!departement.geom) {
          console.warn('[Recherche Geo] Le département n\'a pas de géométrie');
          if (typeof showMessage === 'function') {
            showMessage(`Le département ${departement.nom || codeDepartement} n'a pas de géométrie disponible`, 5);
          }
          return;
        }

        // Vérifier que la géométrie est valide
        if (!departement.geom || !departement.geom.type || !departement.geom.coordinates) {
          console.error('[Recherche Geo] Géométrie invalide:', departement.geom);
          if (typeof showMessage === 'function') {
            showMessage(`Géométrie invalide pour le département ${departement.nom}`, 5);
          }
          return;
        }

        // Vérifier le type de géométrie
        console.log('[Recherche Geo] Type de géométrie:', departement.geom.type);
        
        // Extraire un échantillon de coordonnées pour vérification
        function getFirstCoordinates(coords, depth = 0) {
          if (depth > 5) return '...';
          if (Array.isArray(coords)) {
            if (coords.length === 2 && typeof coords[0] === 'number') {
              return `[${coords[0]}, ${coords[1]}]`;
            }
            if (coords.length > 0) {
              return `[${getFirstCoordinates(coords[0], depth + 1)}, ...]`;
            }
          }
          return '?';
        }
        
        // Fonction récursive pour extraire toutes les coordonnées et vérifier si elles sont inversées
        function extractFirstCoordPair(coords, depth = 0) {
          if (depth > 10) return null;
          if (Array.isArray(coords)) {
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              return [coords[0], coords[1]];
            }
            for (let i = 0; i < coords.length; i++) {
              const result = extractFirstCoordPair(coords[i], depth + 1);
              if (result) return result;
            }
          }
          return null;
        }
        
        const firstCoords = getFirstCoordinates(departement.geom.coordinates);
        console.log('[Recherche Geo] Premières coordonnées:', firstCoords);
        
        // Vérifier si les coordonnées sont inversées (lat/lon au lieu de lon/lat)
        const coordPair = extractFirstCoordPair(departement.geom.coordinates);
        let fixedGeom = departement.geom;
        let needsSwap = false;
        
        if (coordPair) {
          const [x, y] = coordPair;
          console.log('[Recherche Geo] Première paire de coordonnées extraite:', x, y);
          
          // Vérifier si les coordonnées sont inversées
          // France métropolitaine: longitude entre -5 et 10, latitude entre 41 et 51
          // Si x (première valeur) est dans la plage de latitude ET y (deuxième valeur) est dans la plage de longitude,
          // alors les coordonnées sont probablement inversées [lat, lon] au lieu de [lon, lat]
          const isLatitude = (val) => val >= 40 && val <= 55; // Latitude France
          const isLongitude = (val) => val >= -10 && val <= 15; // Longitude France
          
          if (isLatitude(x) && isLongitude(y)) {
            console.warn('[Recherche Geo] Coordonnées DÉTECTÉES comme inversées [lat, lon]:', x, y);
            console.warn('[Recherche Geo] Correction en cours: [lat, lon] -> [lon, lat]');
            needsSwap = true;
          } else if (isLongitude(x) && isLatitude(y)) {
            console.log('[Recherche Geo] Coordonnées correctes [lon, lat]:', x, y);
            needsSwap = false;
          } else {
            // Coordonnées hors de France, on essaie quand même de détecter
            // Si x > 50 (probablement latitude) et y < 20 (probablement longitude), inverser
            if (x > 50 && Math.abs(y) < 20) {
              console.warn('[Recherche Geo] Coordonnées hors France mais probablement inversées:', x, y);
              needsSwap = true;
            } else {
              console.log('[Recherche Geo] Coordonnées:', x, y, '(format non déterminé, on garde tel quel)');
            }
          }
          
          if (needsSwap) {
            // Fonction pour inverser les coordonnées dans toute la géométrie
            function swapCoordinates(coords) {
              if (Array.isArray(coords)) {
                if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                  return [coords[1], coords[0]]; // Inverser [lat, lon] -> [lon, lat]
                }
                return coords.map(swapCoordinates);
              }
              return coords;
            }
            fixedGeom = {
              ...departement.geom,
              coordinates: swapCoordinates(departement.geom.coordinates)
            };
            console.log('[Recherche Geo] Coordonnées corrigées, nouvelle première paire:', extractFirstCoordPair(fixedGeom.coordinates));
          }
        } else {
          console.warn('[Recherche Geo] Impossible d\'extraire une paire de coordonnées pour vérification');
        }

        // Créer un calque GeoJSON temporaire avec le département (identique au code des communes)
        const departementFeature = {
          type: 'Feature',
          geometry: fixedGeom,
          properties: {
            code_insee: departement.code_insee,
            nom: departement.nom,
            code_region: departement.code_region
          }
        };

        // Vérifier que le GeoJSON est valide avant de créer le calque
        try {
          const departementLayer = L.geoJSON(departementFeature, {
            style: {
              color: '#0066cc',
              weight: 3,
              fillOpacity: 0.2,
              fillColor: '#0066cc'
            }
          });

          // Vérifier que le calque a été créé
          const layers = departementLayer.getLayers();
          console.log('[Recherche Geo] Nombre de layers créés:', layers.length);
          
          if (layers.length === 0) {
            throw new Error('Aucun layer créé dans le GeoJSON');
          }

          // Ajouter le calque à la carte
          departementLayer.addTo(map);
          
          // Stocker le calque pour pouvoir le retirer plus tard
          currentLayer = departementLayer;
          currentLayerType = 'departement';

          // Attendre un peu que le calque soit complètement rendu avant de calculer les bounds
          console.log('[Recherche Geo] Attente de 300ms avant calcul des bounds...');
          setTimeout(() => {
            try {
              console.log('[Recherche Geo] Calcul des bounds...');
              const bounds = departementLayer.getBounds();
              console.log('[Recherche Geo] Bounds calculés:', bounds);
              console.log('[Recherche Geo] Bounds type:', typeof bounds);
              console.log('[Recherche Geo] Bounds isValid existe?', typeof bounds?.isValid === 'function');
              
              if (!bounds) {
                console.error('[Recherche Geo] Bounds est null ou undefined');
                if (typeof showMessage === 'function') {
                  showMessage(`Impossible de calculer les limites pour ${departement.nom}`, 5);
                }
                return;
              }
              
              // Vérifier si bounds est valide
              let isValid = false;
              if (typeof bounds.isValid === 'function') {
                isValid = bounds.isValid();
              } else if (bounds.getSouthWest && bounds.getNorthEast) {
                // Essayer de calculer manuellement
                const sw = bounds.getSouthWest();
                const ne = bounds.getNorthEast();
                isValid = sw && ne && 
                  Math.abs(sw.lat) <= 90 && Math.abs(sw.lng) <= 180 && 
                  Math.abs(ne.lat) <= 90 && Math.abs(ne.lng) <= 180 &&
                  sw.lat !== ne.lat && sw.lng !== ne.lng;
              }
              
              console.log('[Recherche Geo] Bounds valides?', isValid);
              
              if (isValid) {
                const sw = bounds.getSouthWest();
                const ne = bounds.getNorthEast();
                console.log('[Recherche Geo] SW (SouthWest):', sw);
                console.log('[Recherche Geo] NE (NorthEast):', ne);
                console.log('[Recherche Geo] SW lat:', sw.lat, 'lng:', sw.lng);
                console.log('[Recherche Geo] NE lat:', ne.lat, 'lng:', ne.lng);
                
                // Vérifier que les coordonnées sont raisonnables (France métropolitaine)
                const isInFrance = sw.lat >= 40 && sw.lat <= 55 && 
                                   sw.lng >= -10 && sw.lng <= 15 &&
                                   ne.lat >= 40 && ne.lat <= 55 && 
                                   ne.lng >= -10 && ne.lng <= 15;
                
                console.log('[Recherche Geo] Coordonnées dans la France métropolitaine?', isInFrance);
                
                if (Math.abs(sw.lat) <= 90 && Math.abs(sw.lng) <= 180 && 
                    Math.abs(ne.lat) <= 90 && Math.abs(ne.lng) <= 180 &&
                    sw.lat !== ne.lat && sw.lng !== ne.lng) {
                  
                  if (!isInFrance) {
                    console.warn('[Recherche Geo] ATTENTION: Coordonnées hors de France métropolitaine, zoom peut être incorrect');
                    console.warn('[Recherche Geo] SW:', sw.lat, sw.lng, 'NE:', ne.lat, ne.lng);
                  }
                  
                  console.log('[Recherche Geo] Appel de map.fitBounds avec padding [50, 50]');
                  map.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 18,  // Limiter le zoom maximum pour éviter que le fond de carte disparaisse
                    animate: true,
                    duration: 0.5
                  });
                  
                  // Vérifier le zoom après un court délai
                  setTimeout(() => {
                    const currentZoom = map.getZoom();
                    const currentCenter = map.getCenter();
                    console.log('[Recherche Geo] Zoom effectué - Niveau de zoom:', currentZoom);
                    console.log('[Recherche Geo] Centre de la carte:', currentCenter);
                  }, 100);
                  
                  console.log('[Recherche Geo] ✓ Zoom effectué sur le département:', departement.nom);
                  
                  // Afficher un message
                  if (typeof showMessage === 'function') {
                    showMessage(`Zoom sur ${departement.nom} (${departement.code_insee})`, 3);
                  }
                  
                  // Retirer le calque après 8 secondes
                  setTimeout(() => {
                    if (currentLayer && map.hasLayer(currentLayer)) {
                      map.removeLayer(currentLayer);
                      currentLayer = null;
                      currentLayerType = null;
                      console.log('[Recherche Geo] Calque du département retiré après délai.');
                    }
                  }, 8000);
                } else {
                  console.error('[Recherche Geo] Coordonnées hors limites ou invalides:', { sw, ne });
                  console.error('[Recherche Geo] SW lat:', sw.lat, 'lng:', sw.lng);
                  console.error('[Recherche Geo] NE lat:', ne.lat, 'lng:', ne.lng);
                  if (typeof showMessage === 'function') {
                    showMessage(`Coordonnées invalides pour ${departement.nom}`, 5);
                  }
                }
              } else {
                console.error('[Recherche Geo] Bounds invalides pour le département');
                console.error('[Recherche Geo] Bounds object:', bounds);
                if (typeof showMessage === 'function') {
                  showMessage(`Impossible de calculer les limites pour ${departement.nom}`, 5);
                }
              }
            } catch (boundsError) {
              console.error('[Recherche Geo] Erreur lors du calcul des bounds:', boundsError);
              console.error('[Recherche Geo] Stack:', boundsError.stack);
              if (typeof showMessage === 'function') {
                showMessage(`Erreur lors du zoom sur ${departement.nom}: ${boundsError.message}`, 5);
              }
            }
          }, 300);
        } catch (geoError) {
          console.error('[Recherche Geo] Erreur lors de la création du calque GeoJSON:', geoError);
          console.error('[Recherche Geo] Géométrie (premiers 500 caractères):', JSON.stringify(departement.geom).substring(0, 500));
          if (typeof showMessage === 'function') {
            showMessage(`Erreur lors de l'affichage du département ${departement.nom}`, 5);
          }
          currentLayer = null;
        }

      } catch (err) {
        console.error('[Recherche Geo] Erreur lors du zoom sur le département:', err);
        if (typeof showMessage === 'function') {
          showMessage(`Erreur lors du zoom sur le département: ${err.message}`, 6);
        }
      }
    }

    // Zoomer sur une commune
    async function zoomOnCommune(codeCommune) {
      if (!codeCommune) return;

      try {
        // Retirer le calque précédent
        if (currentLayer) {
          if (map.hasLayer(currentLayer)) {
            map.removeLayer(currentLayer);
          }
          currentLayer = null;
          currentLayerType = null;
        }

        const response = await fetch(`${apiBaseUrl}/api/geographie/communes/${codeCommune}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const commune = await response.json();
        console.log('[Recherche Geo] Commune récupérée:', commune);
        console.log('[Recherche Geo] SRID de la commune:', commune.srid);
        if (commune.geom) {
          console.log('[Recherche Geo] Géométrie (premiers 300 caractères):', JSON.stringify(commune.geom).substring(0, 300));
          // Extraire et afficher les premières coordonnées brutes
          if (commune.geom.coordinates) {
            try {
              const coords = commune.geom.coordinates;
              let firstCoords = null;
              // Pour MultiPolygon: [[[[lon, lat], ...]]]
              if (Array.isArray(coords) && coords.length > 0) {
                if (Array.isArray(coords[0]) && coords[0].length > 0) {
                  if (Array.isArray(coords[0][0]) && coords[0][0].length > 0) {
                    if (Array.isArray(coords[0][0][0]) && coords[0][0][0].length >= 2) {
                      firstCoords = coords[0][0][0].slice(0, 2);
                    }
                  }
                }
              }
              if (firstCoords) {
                console.log('[Recherche Geo] Premières coordonnées brutes de l\'API:', firstCoords);
                console.log('[Recherche Geo] Format attendu: [lon, lat] en degrés WGS84');
                console.log('[Recherche Geo] Vérification: lon devrait être entre -10 et 15, lat entre 40 et 55 pour la France');
              }
            } catch (e) {
              console.warn('[Recherche Geo] Impossible d\'extraire les premières coordonnées:', e);
            }
          }
        }

        if (!commune.geom) {
          console.warn('[Recherche Geo] La commune n\'a pas de géométrie');
          if (typeof showMessage === 'function') {
            showMessage(`La commune ${commune.nom || codeCommune} n'a pas de géométrie disponible`, 5);
          }
          return;
        }

        // Vérifier que la géométrie est valide
        if (!commune.geom || !commune.geom.type || !commune.geom.coordinates) {
          console.error('[Recherche Geo] Géométrie invalide:', commune.geom);
          if (typeof showMessage === 'function') {
            showMessage(`Géométrie invalide pour la commune ${commune.nom}`, 5);
          }
          return;
        }

        // Vérifier le type de géométrie
        console.log('[Recherche Geo] Type de géométrie:', commune.geom.type);
        
        // Extraire un échantillon de coordonnées pour vérification
        function getFirstCoordinates(coords, depth = 0) {
          if (depth > 5) return '...';
          if (Array.isArray(coords)) {
            if (coords.length === 2 && typeof coords[0] === 'number') {
              return `[${coords[0]}, ${coords[1]}]`;
            }
            if (coords.length > 0) {
              return `[${getFirstCoordinates(coords[0], depth + 1)}, ...]`;
            }
          }
          return '?';
        }
        
        // Fonction récursive pour extraire toutes les coordonnées et vérifier si elles sont inversées
        function extractFirstCoordPair(coords, depth = 0) {
          if (depth > 10) return null;
          if (Array.isArray(coords)) {
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              return [coords[0], coords[1]];
            }
            for (let i = 0; i < coords.length; i++) {
              const result = extractFirstCoordPair(coords[i], depth + 1);
              if (result) return result;
            }
          }
          return null;
        }
        
        const firstCoords = getFirstCoordinates(commune.geom.coordinates);
        console.log('[Recherche Geo] Premières coordonnées:', firstCoords);
        
        // Vérifier si les coordonnées sont inversées (lat/lon au lieu de lon/lat)
        const coordPair = extractFirstCoordPair(commune.geom.coordinates);
        let fixedGeom = commune.geom;
        let needsSwap = false;
        
        if (coordPair) {
          const [x, y] = coordPair;
          console.log('[Recherche Geo] Première paire de coordonnées extraite:', x, y);
          
          // Vérifier si les coordonnées sont inversées
          const isLatitude = (val) => val >= 40 && val <= 55; // Latitude France
          const isLongitude = (val) => val >= -10 && val <= 15; // Longitude France
          
          if (isLatitude(x) && isLongitude(y)) {
            console.warn('[Recherche Geo] Coordonnées DÉTECTÉES comme inversées [lat, lon]:', x, y);
            console.warn('[Recherche Geo] Correction en cours: [lat, lon] -> [lon, lat]');
            needsSwap = true;
          } else if (isLongitude(x) && isLatitude(y)) {
            console.log('[Recherche Geo] Coordonnées correctes [lon, lat]:', x, y);
            needsSwap = false;
          } else {
            // Coordonnées hors de France, on essaie quand même de détecter
            if (x > 50 && Math.abs(y) < 20) {
              console.warn('[Recherche Geo] Coordonnées hors France mais probablement inversées:', x, y);
              needsSwap = true;
            } else {
              console.log('[Recherche Geo] Coordonnées:', x, y, '(format non déterminé, on garde tel quel)');
            }
          }
          
          if (needsSwap) {
            // Fonction pour inverser les coordonnées dans toute la géométrie
            function swapCoordinates(coords) {
              if (Array.isArray(coords)) {
                if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                  return [coords[1], coords[0]]; // Inverser [lat, lon] -> [lon, lat]
                }
                return coords.map(swapCoordinates);
              }
              return coords;
            }
            fixedGeom = {
              ...commune.geom,
              coordinates: swapCoordinates(commune.geom.coordinates)
            };
            console.log('[Recherche Geo] Coordonnées corrigées, nouvelle première paire:', extractFirstCoordPair(fixedGeom.coordinates));
          }
        } else {
          console.warn('[Recherche Geo] Impossible d\'extraire une paire de coordonnées pour vérification');
        }

        // Créer un calque GeoJSON temporaire avec la commune
        const communeFeature = {
          type: 'Feature',
          geometry: fixedGeom,
          properties: {
            code_insee: commune.code_insee,
            nom: commune.nom,
            code_departement: commune.code_departement
          }
        };

        try {
          currentLayer = L.geoJSON(communeFeature, {
            style: {
              color: 'blue',
              weight: 3,
              fillOpacity: 0.3,
              fillColor: 'blue'
            }
          });

          // Vérifier que le calque a été créé correctement
          const layers = currentLayer.getLayers();
          if (layers.length === 0) {
            console.error('[Recherche Geo] Aucun layer créé dans le GeoJSON de la commune');
            currentLayer = null;
            if (typeof showMessage === 'function') {
              showMessage(`Erreur: géométrie invalide pour ${commune.nom}`, 5);
            }
            return;
          }

          // Ajouter le calque à la carte
          currentLayer.addTo(map);
          currentLayerType = 'commune';
          
          // Log très visible pour déboguer
          console.log('═══════════════════════════════════════════════════════════');
          console.log('[Recherche Geo] ⚠️ CALQUE COMMUNE AJOUTÉ - DÉBUT DU ZOOM');
          console.log('[Recherche Geo] Commune:', commune.nom, '(', commune.code_insee, ')');
          console.log('[Recherche Geo] SRID:', commune.srid);
          if (commune.geom && commune.geom.coordinates) {
            try {
              const coords = commune.geom.coordinates;
              let firstCoords = null;
              if (Array.isArray(coords) && coords.length > 0) {
                if (Array.isArray(coords[0]) && coords[0].length > 0) {
                  if (Array.isArray(coords[0][0]) && coords[0][0].length > 0) {
                    if (Array.isArray(coords[0][0][0]) && coords[0][0][0].length >= 2) {
                      firstCoords = coords[0][0][0].slice(0, 2);
                    }
                  }
                }
              }
              if (firstCoords) {
                console.log('[Recherche Geo] Premières coordonnées:', firstCoords);
                console.log('[Recherche Geo] Format: [lon, lat] - lon devrait être entre -10 et 15, lat entre 40 et 55');
              }
            } catch (e) {
              console.error('[Recherche Geo] Erreur extraction coordonnées:', e);
            }
          }
          console.log('═══════════════════════════════════════════════════════════');

          // Attendre un peu que le calque soit complètement rendu avant de calculer les bounds
          console.log('[Recherche Geo] Attente de 300ms avant calcul des bounds pour la commune...');
          setTimeout(() => {
            try {
              console.log('[Recherche Geo] Calcul des bounds pour la commune...');
              const bounds = currentLayer.getBounds();
              console.log('[Recherche Geo] Bounds calculés:', bounds);
              console.log('[Recherche Geo] Bounds type:', typeof bounds);
              console.log('[Recherche Geo] Bounds isValid existe?', typeof bounds?.isValid === 'function');
              
              if (!bounds) {
                console.error('[Recherche Geo] Bounds est null ou undefined pour la commune');
                if (typeof showMessage === 'function') {
                  showMessage(`Impossible de calculer les limites pour ${commune.nom}`, 5);
                }
                return;
              }
              
              // Récupérer les bounds pour afficher les valeurs (même si invalides)
              const sw = bounds.getSouthWest ? bounds.getSouthWest() : null;
              const ne = bounds.getNorthEast ? bounds.getNorthEast() : null;
              
              // Afficher TOUJOURS les valeurs pour déboguer
              if (sw && ne) {
                console.log('[Recherche Geo] SW (SouthWest):', sw);
                console.log('[Recherche Geo] NE (NorthEast):', ne);
                console.log('[Recherche Geo] SW lat:', sw.lat, 'lng:', sw.lng);
                console.log('[Recherche Geo] NE lat:', ne.lat, 'lng:', ne.lng);
                console.log('[Recherche Geo] Valeurs exactes SW: lat =', sw.lat, ', lng =', sw.lng);
                console.log('[Recherche Geo] Valeurs exactes NE: lat =', ne.lat, ', lng =', ne.lng);
                
                // Vérifier si les coordonnées sont en mètres (Lambert 93) au lieu de degrés
                const looksLikeMeters = Math.abs(sw.lat) > 1000 || Math.abs(sw.lng) > 1000 || 
                                       Math.abs(ne.lat) > 1000 || Math.abs(ne.lng) > 1000;
                if (looksLikeMeters) {
                  console.error('[Recherche Geo] ⚠️ PROBLÈME: Coordonnées semblent être en MÈTRES (Lambert 93) au lieu de DEGRÉS (WGS84)');
                  console.error('[Recherche Geo] Les valeurs > 1000 indiquent des coordonnées en mètres');
                  console.error('[Recherche Geo] La transformation backend n\'a peut-être pas fonctionné pour la commune');
                }
              }
              
              // Vérifier si bounds est valide
              let isValid = false;
              if (typeof bounds.isValid === 'function') {
                isValid = bounds.isValid();
              } else if (sw && ne) {
                isValid = Math.abs(sw.lat) <= 90 && Math.abs(sw.lng) <= 180 && 
                          Math.abs(ne.lat) <= 90 && Math.abs(ne.lng) <= 180 &&
                          sw.lat !== ne.lat && sw.lng !== ne.lng;
              }
              
              console.log('[Recherche Geo] Bounds valides?', isValid);
              
              if (isValid && sw && ne) {
                
                // Vérifier que les coordonnées sont raisonnables (France métropolitaine)
                const isInFrance = sw.lat >= 40 && sw.lat <= 55 && 
                                   sw.lng >= -10 && sw.lng <= 15 &&
                                   ne.lat >= 40 && ne.lat <= 55 && 
                                   ne.lng >= -10 && ne.lng <= 15;
                
                console.log('[Recherche Geo] Coordonnées dans la France métropolitaine?', isInFrance);
                
                // Afficher toujours les valeurs exactes pour déboguer
                console.log('[Recherche Geo] Valeurs exactes SW: lat =', sw.lat, ', lng =', sw.lng);
                console.log('[Recherche Geo] Valeurs exactes NE: lat =', ne.lat, ', lng =', ne.lng);
                
                // Vérifier si les coordonnées sont en mètres (Lambert 93) au lieu de degrés
                const looksLikeMeters = Math.abs(sw.lat) > 1000 || Math.abs(sw.lng) > 1000 || 
                                       Math.abs(ne.lat) > 1000 || Math.abs(ne.lng) > 1000;
                if (looksLikeMeters) {
                  console.error('[Recherche Geo] ⚠️ PROBLÈME: Coordonnées semblent être en MÈTRES (Lambert 93) au lieu de DEGRÉS (WGS84)');
                  console.error('[Recherche Geo] Les valeurs > 1000 indiquent des coordonnées en mètres');
                  console.error('[Recherche Geo] La transformation backend n\'a peut-être pas fonctionné pour la commune');
                }
                
                if (Math.abs(sw.lat) <= 90 && Math.abs(sw.lng) <= 180 && 
                    Math.abs(ne.lat) <= 90 && Math.abs(ne.lng) <= 180 &&
                    sw.lat !== ne.lat && sw.lng !== ne.lng) {
                  
                  // Vérifier que les coordonnées sont dans la France métropolitaine AVANT de zoomer
                  if (!isInFrance) {
                    console.error('[Recherche Geo] ❌ ERREUR: Coordonnées hors de France métropolitaine - zoom annulé');
                    console.error('[Recherche Geo] SW: lat =', sw.lat, ', lng =', sw.lng);
                    console.error('[Recherche Geo] NE: lat =', ne.lat, ', lng =', ne.lng);
                    console.error('[Recherche Geo] Attendu pour la France: lat entre 40-55, lng entre -10 et 15');
                    if (typeof showMessage === 'function') {
                      showMessage(`Coordonnées invalides pour ${commune.nom} - zoom annulé`, 5);
                    }
                    // Retirer le calque si les coordonnées sont invalides
                    if (currentLayer && map.hasLayer(currentLayer)) {
                      map.removeLayer(currentLayer);
                      currentLayer = null;
                      currentLayerType = null;
                    }
                    return;
                  }
                  
                  // Vérifier que les bounds ne sont pas trop petits (éviter le zoom extrême)
                  const latDiff = Math.abs(ne.lat - sw.lat);
                  const lngDiff = Math.abs(ne.lng - sw.lng);
                  console.log('[Recherche Geo] Différence de coordonnées: lat =', latDiff, ', lng =', lngDiff);
                  
                  if (latDiff < 0.0001 || lngDiff < 0.0001) {
                    console.error('[Recherche Geo] ❌ ERREUR: Bounds trop petits - zoom annulé');
                    if (typeof showMessage === 'function') {
                      showMessage(`Géométrie trop petite pour ${commune.nom} - zoom annulé`, 5);
                    }
                    return;
                  }
                  
                  console.log('[Recherche Geo] ✓ Coordonnées valides, zoom en cours...');
                  console.log('[Recherche Geo] Appel de map.fitBounds avec padding [50, 50] pour la commune');
                  
                  // Utiliser fitBounds avec des options pour éviter le zoom trop extrême
                  map.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 18,  // Limiter le zoom maximum pour éviter que le fond de carte disparaisse
                    animate: true,
                    duration: 0.5
                  });
                  
                  // Vérifier le zoom après un court délai
                  setTimeout(() => {
                    const currentZoom = map.getZoom();
                    const currentCenter = map.getCenter();
                    const currentBounds = map.getBounds();
                    console.log('[Recherche Geo] Zoom effectué - Niveau de zoom:', currentZoom);
                    console.log('[Recherche Geo] Centre de la carte:', currentCenter);
                    console.log('[Recherche Geo] Bounds actuels de la carte:', currentBounds);
                    
                    // Vérifier que le zoom n'est pas trop extrême
                    if (currentZoom > 20) {
                      console.warn('[Recherche Geo] ⚠️ Zoom très élevé (', currentZoom, ') - risque de perte du fond de carte');
                      // Réduire le zoom si nécessaire
                      map.setZoom(Math.min(currentZoom, 18));
                    }
                    
                    // Vérifier que le centre est dans des limites raisonnables
                    if (currentCenter) {
                      const centerLat = currentCenter.lat;
                      const centerLng = currentCenter.lng;
                      if (centerLat < 40 || centerLat > 55 || centerLng < -10 || centerLng > 15) {
                        console.error('[Recherche Geo] ❌ Centre de la carte hors de France métropolitaine!');
                        console.error('[Recherche Geo] Centre: lat =', centerLat, ', lng =', centerLng);
                      }
                    }
                  }, 100);
                  
                  console.log('[Recherche Geo] ✓ Zoom effectué sur la commune:', commune.nom);
                  
                  // Afficher un message
                  if (typeof showMessage === 'function') {
                    showMessage(`Zoom sur ${commune.nom} (${commune.code_insee})`, 3);
                  }
                  
                  // Retirer le calque après 8 secondes
                  setTimeout(() => {
                    if (currentLayer && map.hasLayer(currentLayer)) {
                      map.removeLayer(currentLayer);
                      currentLayer = null;
                      currentLayerType = null;
                      console.log('[Recherche Geo] Calque de la commune retiré après délai.');
                    }
                  }, 8000);
                } else {
                  console.error('[Recherche Geo] Coordonnées hors limites ou invalides pour la commune:', { sw, ne });
                  console.error('[Recherche Geo] SW lat:', sw.lat, 'lng:', sw.lng);
                  console.error('[Recherche Geo] NE lat:', ne.lat, 'lng:', ne.lng);
                  if (typeof showMessage === 'function') {
                    showMessage(`Coordonnées invalides pour ${commune.nom}`, 5);
                  }
                }
              } else {
                console.error('[Recherche Geo] Bounds invalides pour la commune');
                console.error('[Recherche Geo] Bounds object:', bounds);
                // Afficher les valeurs même si invalides pour déboguer
                if (sw && ne) {
                  console.error('[Recherche Geo] Valeurs SW (même si invalides): lat =', sw.lat, ', lng =', sw.lng);
                  console.error('[Recherche Geo] Valeurs NE (même si invalides): lat =', ne.lat, ', lng =', ne.lng);
                  // Vérifier si les coordonnées sont en mètres
                  const looksLikeMeters = Math.abs(sw.lat) > 1000 || Math.abs(sw.lng) > 1000 || 
                                         Math.abs(ne.lat) > 1000 || Math.abs(ne.lng) > 1000;
                  if (looksLikeMeters) {
                    console.error('[Recherche Geo] ⚠️ Les coordonnées sont en MÈTRES (Lambert 93) - transformation backend nécessaire');
                  }
                } else {
                  console.error('[Recherche Geo] Impossible de récupérer SW ou NE depuis bounds');
                }
                if (typeof showMessage === 'function') {
                  showMessage(`Impossible de calculer les limites pour ${commune.nom}`, 5);
                }
              }
            } catch (boundsError) {
              console.error('[Recherche Geo] Erreur lors du calcul des bounds pour la commune:', boundsError);
              console.error('[Recherche Geo] Stack:', boundsError.stack);
              if (typeof showMessage === 'function') {
                showMessage(`Erreur lors du zoom sur ${commune.nom}: ${boundsError.message}`, 5);
              }
            }
          }, 300);
        } catch (geoError) {
          console.error('[Recherche Geo] Erreur lors de la création du calque GeoJSON:', geoError);
          if (typeof showMessage === 'function') {
            showMessage(`Erreur lors de l'affichage de la commune ${commune.nom}`, 5);
          }
          currentLayer = null;
        }

      } catch (err) {
        console.error('[Recherche Geo] Erreur lors du zoom sur la commune:', err);
        if (typeof showMessage === 'function') {
          showMessage(`Erreur lors du zoom sur la commune: ${err.message}`, 6);
        }
      }
    }

    // Gestionnaire de changement de département
    let isProcessingDepartement = false;
    departementSelect.addEventListener('change', async (e) => {
      const codeDepartement = e.target.value;
      
      // Éviter les appels multiples
      if (isProcessingDepartement) {
        console.log('[Recherche Geo] Traitement en cours, ignore la requête');
        return;
      }
      
      isProcessingDepartement = true;
      
      try {
        // Réinitialiser la commune
        communeSelect.innerHTML = '<option value="">-- Choisir une commune --</option>';
        communeSelect.disabled = !codeDepartement;
        
        if (codeDepartement) {
          // Charger les communes du département
          await loadCommunes(codeDepartement);
          
          // Zoomer sur le département
          await zoomOnDepartement(codeDepartement);
        } else {
          // Retirer le calque si aucun département n'est sélectionné
          if (currentLayer) {
            if (map.hasLayer(currentLayer)) {
              map.removeLayer(currentLayer);
            }
            currentLayer = null;
            currentLayerType = null;
          }
        }
      } finally {
        isProcessingDepartement = false;
      }
    });

    // Gestionnaire de changement de commune
    let isProcessingCommune = false;
    communeSelect.addEventListener('change', async (e) => {
      const codeCommune = e.target.value;
      const currentRueSelect = rueSelect || document.getElementById('searchRueSelect');
      console.log('[Recherche Geo] 🔵 change communeSelect', { 
        codeCommune, 
        rueSelect: !!rueSelect,
        currentRueSelect: !!currentRueSelect,
        elementById: !!document.getElementById('searchRueSelect')
      });
      
      // Éviter les appels multiples
      if (isProcessingCommune) {
        console.log('[Recherche Geo] Traitement commune en cours, ignore la requête');
        return;
      }
      
      isProcessingCommune = true;
      
      try {
        const currentNumeroSelect = numeroSelect || document.getElementById('searchNumeroSelect');
        
        // Réinitialiser la rue et le numéro
        if (currentRueSelect) {
          currentRueSelect.innerHTML = '<option value="">-- Choisir une rue --</option>';
          currentRueSelect.disabled = !codeCommune;
        } else {
          console.warn('[Recherche Geo] ⚠️ currentRueSelect est null dans le gestionnaire change');
        }
        
        if (currentNumeroSelect) {
          currentNumeroSelect.innerHTML = '<option value="">-- Choisir d\'abord une rue --</option>';
          currentNumeroSelect.disabled = true;
        }
        
        if (codeCommune) {
          // Charger les rues de la commune
          console.log('[Recherche Geo] Appel de loadRues pour', codeCommune);
          await loadRues(codeCommune);
          
          // Zoomer sur la commune
          await zoomOnCommune(codeCommune);
        } else {
          // Réinitialiser la rue si aucune commune n'est sélectionnée
          if (currentRueSelect) {
            currentRueSelect.innerHTML = '<option value="">-- Choisir d\'abord une commune --</option>';
            currentRueSelect.disabled = true;
          }
        }
      } catch (err) {
        console.error('[Recherche Geo] ❌ Erreur dans le gestionnaire change commune:', err);
      } finally {
        isProcessingCommune = false;
      }
    });

    // Hook de debug accessible depuis la console
    window.__recherche_geo_debug__ = window.__recherche_geo_debug__ || {};
    window.__recherche_geo_debug__.loadRues = loadRues;
    window.__recherche_geo_debug__.apiBaseUrl = apiBaseUrl;

    // Charger les numéros d'une rue
    async function loadNumeros(codeCommune, nomRue) {
      const currentNumeroSelect = numeroSelect || document.getElementById('searchNumeroSelect');
      
      if (!codeCommune || !nomRue || !currentNumeroSelect) {
        console.warn('[Recherche Geo] loadNumeros ignoré', { codeCommune, nomRue, numeroSelect: !!currentNumeroSelect });
        if (currentNumeroSelect) {
          currentNumeroSelect.innerHTML = '<option value="">-- Choisir d\'abord une rue --</option>';
          currentNumeroSelect.disabled = true;
        }
        return;
      }

      try {
        console.log('[Recherche Geo] loadNumeros() début', { codeCommune, nomRue });
        currentNumeroSelect.innerHTML = '<option value="">-- Chargement... --</option>';
        currentNumeroSelect.disabled = true;
        
        const url = `${apiBaseUrl}/api/geographie/ban/numeros/${codeCommune}/${encodeURIComponent(nomRue)}`;
        console.log('[Recherche Geo] loadNumeros() fetch', url);
        const response = await fetch(url);
        console.log('[Recherche Geo] loadNumeros() response', { status: response.status, ok: response.ok });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const numeros = data.numeros || [];
        console.log('[Recherche Geo] loadNumeros() data', { count: numeros.length, sample: numeros.slice(0, 5) });
        
        currentNumeroSelect.innerHTML = '<option value="">-- Choisir un numéro --</option>';
        numeros.forEach(num => {
          const option = document.createElement('option');
          option.value = num.numero;
          option.textContent = num.libelle;
          option.dataset.rep = num.rep || '';
          option.dataset.adresseComplete = num.adresse_complete || '';
          currentNumeroSelect.appendChild(option);
        });
        currentNumeroSelect.disabled = false;
        console.log(`[Recherche Geo] ✓ ${numeros.length} numéros chargés pour la rue ${nomRue}`);
      } catch (err) {
        console.error('[Recherche Geo] ❌ Erreur lors du chargement des numéros:', err);
        if (currentNumeroSelect) {
          currentNumeroSelect.innerHTML = '<option value="">-- Erreur de chargement --</option>';
          currentNumeroSelect.disabled = true;
        }
        if (typeof showMessage === 'function') {
          showMessage('Erreur lors du chargement des numéros', 5);
        }
      }
    }

    // Gestionnaire de changement de rue
    const currentRueSelectForHandler = rueSelect || document.getElementById('searchRueSelect');
    if (currentRueSelectForHandler) {
      let isProcessingRue = false;
      currentRueSelectForHandler.addEventListener('change', async (e) => {
        const nomRue = e.target.value;
        const codeCommune = communeSelect.value;
        const currentNumeroSelect = numeroSelect || document.getElementById('searchNumeroSelect');
        
        // Réinitialiser le numéro
        if (currentNumeroSelect) {
          currentNumeroSelect.innerHTML = '<option value="">-- Choisir un numéro --</option>';
          currentNumeroSelect.disabled = !nomRue || !codeCommune;
        }
        
        if (!nomRue || !codeCommune) {
          return;
        }
        
        // Éviter les appels multiples
        if (isProcessingRue) {
          console.log('[Recherche Geo] Traitement rue en cours, ignore la requête');
          return;
        }
        
        isProcessingRue = true;
        
        try {
          // Charger les numéros de la rue
          await loadNumeros(codeCommune, nomRue);
          
          // Zoomer sur l'emprise de la voie
          try {
            const boundsUrl = `${apiBaseUrl}/api/geographie/ban/voie/bounds?code_commune=${codeCommune}&nom_voie=${encodeURIComponent(nomRue)}`;
            console.log('[Recherche Geo] 🔵 voie bounds fetch', boundsUrl);
            const response = await fetch(boundsUrl);
            console.log('[Recherche Geo] voie bounds response', { status: response.status, ok: response.ok });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Recherche Geo] ❌ Erreur HTTP', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const b = await response.json();
            console.log('[Recherche Geo] voie bounds data', b);
            
            // Vérifier que les bounds sont valides
            if (b.min_lat != null && b.min_lon != null && b.max_lat != null && b.max_lon != null) {
              // Vérifier que les bounds ne sont pas trop petites
              const latDiff = Math.abs(b.max_lat - b.min_lat);
              const lonDiff = Math.abs(b.max_lon - b.min_lon);
              console.log('[Recherche Geo] Différence bounds', { latDiff, lonDiff });
              
              if (latDiff < 0.0001 || lonDiff < 0.0001) {
                console.warn('[Recherche Geo] ⚠️ Bounds trop petites, utilisation d\'un padding plus grand');
              }
              
              // Leaflet attend [lat, lon] pour chaque point
              const bounds = L.latLngBounds(
                [b.min_lat, b.min_lon],  // Sud-Ouest
                [b.max_lat, b.max_lon]    // Nord-Est
              );
              
              console.log('[Recherche Geo] bounds créées', bounds);
              console.log('[Recherche Geo] bounds isValid?', bounds.isValid());
              console.log('[Recherche Geo] bounds getSouthWest', bounds.getSouthWest());
              console.log('[Recherche Geo] bounds getNorthEast', bounds.getNorthEast());
              
              if (bounds.isValid()) {
                // Retirer le calque précédent avant de zoomer
                if (currentLayer && map.hasLayer(currentLayer)) {
                  map.removeLayer(currentLayer);
                }
                
                // Utiliser un padding plus grand si les bounds sont petites
                const padding = (latDiff < 0.001 || lonDiff < 0.001) ? [100, 100] : [50, 50];
                map.fitBounds(bounds, { 
                  padding: padding, 
                  maxZoom: 18,
                  animate: true,
                  duration: 0.5
                });
                console.log('[Recherche Geo] ✓ Zoom effectué sur la voie avec padding', padding);

                // Attendre un peu pour que le zoom se termine
                setTimeout(() => {
                  const currentZoom = map.getZoom();
                  const currentCenter = map.getCenter();
                  console.log('[Recherche Geo] Zoom terminé', { zoom: currentZoom, center: currentCenter });
                  
                  // Ajouter un marqueur au centre pour feedback utilisateur
                  const marker = L.circleMarker(currentCenter, { 
                    radius: 8, 
                    color: '#d35400', 
                    weight: 3, 
                    fillOpacity: 0.7,
                    fillColor: '#d35400'
                  }).addTo(map);
                  marker.bindPopup(`<b>${nomRue}</b>`).openPopup();
                  currentLayer = marker;
                  currentLayerType = 'voie';

                  // Retirer le marqueur après 10 secondes
                  setTimeout(() => {
                    if (currentLayer && map.hasLayer(currentLayer) && currentLayerType === 'voie') {
                      map.removeLayer(currentLayer);
                      currentLayer = null;
                      currentLayerType = null;
                      console.log('[Recherche Geo] Marqueur de voie retiré après délai');
                    }
                  }, 10000);
                }, 300);

                if (typeof showMessage === 'function') {
                  showMessage(`Zoom sur la voie: ${nomRue}`, 3);
                }
              } else {
                console.error('[Recherche Geo] ❌ Bounds invalides pour la voie');
                if (typeof showMessage === 'function') {
                  showMessage(`Impossible de zoomer sur ${nomRue}`, 5);
                }
              }
            } else {
              console.error('[Recherche Geo] ❌ Données de bounds incomplètes', b);
              if (typeof showMessage === 'function') {
                showMessage(`Données incomplètes pour ${nomRue}`, 5);
              }
            }
          } catch (boundsErr) {
            console.error('[Recherche Geo] ❌ Erreur lors du zoom sur la voie:', boundsErr);
            if (typeof showMessage === 'function') {
              showMessage(`Erreur lors du zoom sur ${nomRue}: ${boundsErr.message}`, 5);
            }
          }
        } catch (err) {
          console.error('[Recherche Geo] Erreur lors du chargement des numéros:', err);
        } finally {
          isProcessingRue = false;
        }
      });
    }

    // Gestionnaire de changement de numéro
    const currentNumeroSelectForHandler = numeroSelect || document.getElementById('searchNumeroSelect');
    if (currentNumeroSelectForHandler) {
      let isProcessingNumero = false;
      currentNumeroSelectForHandler.addEventListener('change', async (e) => {
        const numero = e.target.value;
        // Récupérer le nom de la rue depuis le select (plus fiable que rueSelect qui peut être undefined)
        const currentRueSelectForNumero = rueSelect || document.getElementById('searchRueSelect');
        const nomRue = currentRueSelectForNumero?.value || '';
        const codeCommune = communeSelect.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const adresseComplete = selectedOption?.dataset?.adresseComplete || '';
        const rep = selectedOption?.dataset?.rep || '';
        
        console.log('[Recherche Geo] 🔵 change numeroSelect', { 
          numero, 
          nomRue, 
          codeCommune,
          rueSelect: !!currentRueSelectForNumero,
          adresseComplete
        });
        
        if (!numero || !nomRue || !codeCommune) {
          console.warn('[Recherche Geo] ⚠️ Données manquantes pour le zoom sur le numéro', { numero, nomRue, codeCommune });
          return;
        }
        
        // Éviter les appels multiples
        if (isProcessingNumero) {
          console.log('[Recherche Geo] Traitement numéro en cours, ignore la requête');
          return;
        }
        
        isProcessingNumero = true;
        
        try {
          // Rechercher l'adresse exacte dans la table BAN
          const searchUrl = `${apiBaseUrl}/api/geographie/ban/search?code_commune=${codeCommune}&nom_voie=${encodeURIComponent(nomRue)}&numero=${encodeURIComponent(numero)}`;
          console.log('[Recherche Geo] 🔵 search adresse fetch', searchUrl);
          console.log('[Recherche Geo] Paramètres de recherche:', { codeCommune, nomRue, numero, rep });
          
          const response = await fetch(searchUrl);
          console.log('[Recherche Geo] search response', { status: response.status, ok: response.ok, statusText: response.statusText });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Recherche Geo] ❌ Erreur HTTP', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
          }
          
          const addresses = await response.json();
          console.log('[Recherche Geo] addresses reçues', { count: addresses?.length || 0, addresses });
          
          if (addresses && addresses.length > 0) {
            // Prendre la première adresse trouvée (ou celle avec le bon REP si disponible)
            let address = addresses[0];
            if (rep && addresses.length > 1) {
              const addressWithRep = addresses.find(a => a.rep === rep);
              if (addressWithRep) {
                console.log('[Recherche Geo] Adresse avec REP trouvée:', addressWithRep);
                address = addressWithRep;
              }
            }
            
            console.log('[Recherche Geo] Adresse sélectionnée:', address);
            console.log('[Recherche Geo] Géométrie de l\'adresse:', address.geom);
            
            // Si l'adresse a une géométrie, zoomer dessus
            if (address.geom) {
              let lon, lat;
              
              // Gérer différents formats de géométrie GeoJSON
              if (address.geom.coordinates && Array.isArray(address.geom.coordinates)) {
                // Format GeoJSON Point: { type: "Point", coordinates: [lon, lat] }
                if (address.geom.type === 'Point' && address.geom.coordinates.length >= 2) {
                  [lon, lat] = address.geom.coordinates;
                } else if (address.geom.coordinates.length >= 2 && typeof address.geom.coordinates[0] === 'number') {
                  // Format simple [lon, lat]
                  [lon, lat] = address.geom.coordinates;
                } else {
                  console.error('[Recherche Geo] ❌ Format de coordonnées non reconnu:', address.geom);
                  if (typeof showMessage === 'function') {
                    showMessage(`Format de géométrie non supporté pour ${adresseComplete || numero}`, 5);
                  }
                  return;
                }
              } else {
                console.error('[Recherche Geo] ❌ Pas de coordonnées dans la géométrie:', address.geom);
                if (typeof showMessage === 'function') {
                  showMessage(`Géométrie invalide pour ${adresseComplete || numero}`, 5);
                }
                return;
              }
              
              // Vérifier que les coordonnées sont valides
              if (typeof lon !== 'number' || typeof lat !== 'number' || isNaN(lon) || isNaN(lat)) {
                console.error('[Recherche Geo] ❌ Coordonnées invalides:', { lon, lat });
                if (typeof showMessage === 'function') {
                  showMessage(`Coordonnées invalides pour ${adresseComplete || numero}`, 5);
                }
                return;
              }
              
              console.log('[Recherche Geo] ✓ Adresse trouvée avec géométrie valide:', { lon, lat, adresseComplete });
              
              // Retirer le calque précédent
              if (currentLayer && map.hasLayer(currentLayer)) {
                map.removeLayer(currentLayer);
              }
              
              // Créer une petite zone autour du point pour utiliser fitBounds (zoom + centrage)
              // Cela garantit un meilleur centrage et une vue cohérente avec les autres niveaux
              const pointOffset = 0.0001; // Environ 10 mètres
              const bounds = L.latLngBounds(
                [lat - pointOffset, lon - pointOffset],  // Sud-Ouest
                [lat + pointOffset, lon + pointOffset]    // Nord-Est
              );
              
              // Zoomer et centrer sur le point avec fitBounds
              map.fitBounds(bounds, {
                padding: [100, 100],  // Padding pour avoir une vue dégagée
                maxZoom: 19,          // Zoom maximum pour une vue précise
                animate: true,
                duration: 0.5
              });
              
              console.log('[Recherche Geo] ✓ Zoom + centrage effectué sur le numéro:', { lat, lon, bounds });
              
              // Attendre un peu pour que le zoom se termine avant d'ajouter le marqueur
              setTimeout(() => {
                // Ajouter un marqueur sur l'adresse
                const marker = L.marker([lat, lon], {
                  icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })
                }).addTo(map);
                
                // Construire le texte de la popup
                const popupText = adresseComplete || address.adresse_display || address.adresse_complete || `${address.numero}${address.rep ? ' ' + address.rep : ''} ${address.nom_voie}`;
                marker.bindPopup(`<b>${popupText}</b>`).openPopup();
                
                currentLayer = marker;
                currentLayerType = 'adresse';
                
                console.log('[Recherche Geo] ✓ Marqueur ajouté sur l\'adresse:', popupText);
                
                // Retirer le marqueur après 30 secondes
                setTimeout(() => {
                  if (currentLayer && map.hasLayer(currentLayer) && currentLayerType === 'adresse') {
                    map.removeLayer(currentLayer);
                    currentLayer = null;
                    currentLayerType = null;
                    console.log('[Recherche Geo] Marqueur retiré après délai');
                  }
                }, 30000);
              }, 300);
              
              if (typeof showMessage === 'function') {
                const popupText = adresseComplete || address.adresse_display || address.adresse_complete || `${address.numero}${address.rep ? ' ' + address.rep : ''} ${address.nom_voie}`;
                showMessage(`Zoom sur ${popupText}`, 3);
              }
            } else {
              console.warn('[Recherche Geo] ⚠️ Adresse trouvée mais sans géométrie:', address);
              if (typeof showMessage === 'function') {
                showMessage(`Adresse trouvée mais sans géométrie: ${adresseComplete || address.adresse_display || numero}`, 5);
              }
            }
          } else {
            console.warn('[Recherche Geo] ⚠️ Aucune adresse trouvée pour:', { numero, nomRue, codeCommune });
            if (typeof showMessage === 'function') {
              showMessage(`Aucune adresse trouvée pour ${numero} ${nomRue}`, 5);
            }
          }
        } catch (err) {
          console.error('[Recherche Geo] Erreur lors de la recherche d\'adresse:', err);
          if (typeof showMessage === 'function') {
            showMessage(`Erreur lors de la recherche d'adresse: ${err.message}`, 5);
          }
        } finally {
          isProcessingNumero = false;
        }
      });
    }

    // Initialiser le chargement des départements quand la carte est prête
    console.log('[Recherche Geo] Attente de map.whenReady...');
    if (map.whenReady) {
      map.whenReady(() => {
        console.log('[Recherche Geo] map.whenReady déclenché, chargement des départements');
        loadDepartements();
      });
    } else {
      console.warn('[Recherche Geo] map.whenReady non disponible, tentative directe');
      // Si whenReady n'est pas disponible, essayer directement après un court délai
      setTimeout(() => {
        console.log('[Recherche Geo] Chargement des départements après délai');
        loadDepartements();
      }, 500);
    }
    
    console.log('[Recherche Geo] Module initialisé avec succès');
  }

  // Fonction pour démarrer l'initialisation
  function startInit() {
    console.log('[Recherche Geo] startInit appelé');
    console.log('[Recherche Geo] readyState:', document.readyState);
    console.log('[Recherche Geo] document.body existe?', !!document.body);
    
    // Vérifier que le body existe
    if (!document.body) {
      console.warn('[Recherche Geo] Body non disponible, attente de 200ms...');
      setTimeout(startInit, 200);
      return;
    }
    
    // Vérifier si les éléments existent déjà
    const testDepartement = document.getElementById('searchDepartementSelect');
    const testCommune = document.getElementById('searchCommuneSelect');
    console.log('[Recherche Geo] Test éléments DOM:', {
      departement: !!testDepartement,
      commune: !!testCommune
    });
    
    // Attendre un peu pour que les autres scripts se chargent
    setTimeout(() => {
      console.log('[Recherche Geo] Appel de initRechercheGeoModule après délai');
      initRechercheGeoModule();
    }, 500);
  }

  // Attendre que le DOM soit complètement chargé
  if (document.readyState === 'loading'){
    console.log('[Recherche Geo] DOM en cours de chargement, attente de DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Recherche Geo] DOMContentLoaded déclenché');
      startInit();
    }, {once:true});
  } else {
    console.log('[Recherche Geo] DOM déjà chargé, initialisation immédiate');
    // Même si le DOM est chargé, attendre un peu pour que tous les scripts soient exécutés
    setTimeout(() => {
      startInit();
    }, 200);
  }
})();
