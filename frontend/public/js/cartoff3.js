/**
 * Fonctions complémentaires pour cartoff3.html
 * - Ajout d'un point dans un GeoJSON par clic droit
 * - Sélection des données depuis json/activation.json, json/type_point.json, json/utilisateurs.json
 */

// Fonction helper globale pour créer un toggle switch moderne
window.createToggleSwitch = function(id, labelText, checked = false) {
  const label = document.createElement('label');
  label.className = 'toggle-label';
  label.htmlFor = id;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = labelText;
  
  const toggleSwitch = document.createElement('span');
  toggleSwitch.className = 'toggle-switch';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.checked = checked;
  
  const slider = document.createElement('span');
  slider.className = 'toggle-slider';
  
  toggleSwitch.appendChild(checkbox);
  toggleSwitch.appendChild(slider);
  
  label.appendChild(textSpan);
  label.appendChild(toggleSwitch);
  
  return { label, checkbox };
};

(function(){
  if (window.__cartoff_manual_init__) {
    console.log('[cartoff3] init déjà effectué');
    return;
  }

  function initManualModule(){
    if (typeof map === 'undefined') {
      console.warn('[cartoff3] Map indisponible, réessai dans 200ms');
      setTimeout(initManualModule, 200);
      return;
    }
    if (window.__cartoff_manual_init__) return;
    window.__cartoff_manual_init__ = true;
    const startTime = Date.now();
    console.log('[cartoff3] Initialisation module complémentaire');

    map.whenReady(async () => {
      const TARGET_GEOJSON = 'geojson/custom_points.geojson';
      const TARGET_LINES = 'geojson/custom_lines.geojson';
      const manualLayerName = 'SITAC';
      const manualLayer = L.layerGroup(); // Ne pas ajouter à la carte par défaut
      layers[manualLayerName] = manualLayer;
      if(!icons[manualLayerName]){
        icons[manualLayerName] = L.icon({iconUrl:'images/CHANTIER.png', iconSize:[24,24], iconAnchor:[12,12], popupAnchor:[0,-12]});
      }
      console.log('[cartoff3] Couche "SITAC" ajoutée au map');

      const SAR_GEOJSON = 'geojson/SAR.geojson';
      const sarLayerName = 'SAR';
      const sarLayer = L.layerGroup(); // Ne pas ajouter à la carte par défaut
      layers[sarLayerName] = sarLayer;
      if(!icons[sarLayerName]){
        icons[sarLayerName] = L.icon({iconUrl:'images/objet.png', iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-11]});
      }
      console.log('[cartoff3] Couche "SAR" ajoutée au map');

      if (!document.getElementById('manualLayers')) {
        const layerMenu = document.getElementById('layerMenu');
        if(layerMenu){
          const details = document.createElement('details');
          details.open = false;
          details.disabled = true;
          details.style.opacity = '0.5';
          details.style.pointerEvents = 'none';
          details.style.cursor = 'not-allowed';
          details.innerHTML = `
            <summary>SITAC</summary>
            <div id="manualLayers"></div>
          `;
          layerMenu.insertBefore(details, document.getElementById('legend'));
        }
      }
      const manualLayersDiv = document.getElementById('manualLayers');
      if(manualLayersDiv && !document.getElementById('chk_SITAC')){
        const { label, checkbox } = window.createToggleSwitch('chk_SITAC', manualLayerName, false);
        checkbox.disabled = true;
        checkbox.addEventListener('change', (e)=>{
          if(e.target.checked){
            manualLayer.addTo(map);
          } else {
            map.removeLayer(manualLayer);
          }
          if(typeof updateLegend==='function') updateLegend();
        });
        manualLayersDiv.appendChild(label);
      }

      if (!document.getElementById('sarLayers')) {
        const layerMenu = document.getElementById('layerMenu');
        if(layerMenu){
          const details = document.createElement('details');
          details.open = false;
          details.disabled = true;
          details.style.opacity = '0.5';
          details.style.pointerEvents = 'none';
          details.style.cursor = 'not-allowed';
          details.innerHTML = `
            <summary>Recherche & Sauvetage (SAR)</summary>
            <div id="sarLayers"></div>
          `;
          layerMenu.insertBefore(details, document.getElementById('legend'));
        }
      }
      const sarLayersDiv = document.getElementById('sarLayers');
      if(sarLayersDiv && !document.getElementById('chk_SAR')){
        const label = document.createElement('label');
        label.htmlFor = 'chk_SAR';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'chk_SAR';
        checkbox.checked = false;
        checkbox.disabled = true;
        checkbox.addEventListener('change', (e)=>{
          if(e.target.checked){
            sarLayer.addTo(map);
          } else {
            map.removeLayer(sarLayer);
          }
          if(typeof updateLegend==='function') updateLegend();
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' '+sarLayerName));
        sarLayersDiv.appendChild(label);
      }

      let manualGeojson = {type:'FeatureCollection', features: []};
      let manualLinesGeojson = {type:'FeatureCollection', features: []};
      let activations = [];
      let activeActivations = [];
      let sarGeojson = {type:'FeatureCollection', features: []};
      let sarTeams = [];
      const lineDrawingState = {
        active: false,
        latlngs: [],
        tempLine: null,
        markers: [],
        previewLatLng: null,
        doubleClickWasEnabled: false
      };

  function renderManualFeatures(){
    window.__manualTypes = new Set();
    manualLayer.clearLayers();
    manualGeojson.features.forEach(feature => {
      if(!feature.geometry || feature.geometry.type !== 'Point') return;
      const [lon, lat] = feature.geometry.coordinates;
      const props = feature.properties || {};
      const typeLabel = props.type_points || props.type_point || '-';
      const dateLabel = props.date_heure || '-';
      const markerTitle = `${typeLabel} : ${dateLabel}`;
      const iconKey = `SITAC_${typeLabel}`;
      const markerIcon = icons[iconKey] || icons[manualLayerName];
      const marker = L.marker([lat, lon], {icon: markerIcon, title: markerTitle});
      const labelDivIcon = L.divIcon({
        className: 'manual-label',
        html: `<span style="background: rgba(0,0,0,0.65); color:#fff; padding:2px 6px; border-radius:4px; font-size:12px;">${typeLabel}</span>`,
        iconSize: [0,0],
        iconAnchor: [-10, 15]
      });
      if(!labelDivIcon.options.iconUrl){
        labelDivIcon.options.iconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
      }
      const label = L.marker([lat, lon], {
        icon: labelDivIcon,
        interactive: false
      }).addTo(manualLayer);
      const tooltipHtml = `
        <div style="font-size:12px; line-height:1.4;">
          <b>Type :</b> ${typeLabel}<br>
          <b>Activation :</b> ${props.activation || '-'}<br>
          <b>Date/heure :</b> ${props.date_heure || '-'}<br>
          <b>Rédacteur :</b> ${props.redacteur || '-'}<br>
          <b>Commentaire :</b> ${(props.commentaire || '').replace(/\n/g,'<br>')}
        </div>
      `;
      marker.bindTooltip(tooltipHtml, {permanent:false, direction:'top', className:'manual-tooltip'});
      marker.bindPopup(`
        <div class="popup-manual">
          <b>Latitude :</b> ${lat.toFixed(6)}<br>
          <b>Longitude :</b> ${lon.toFixed(6)}<br>
          <b>Activation :</b> ${props.activation || '-'}<br>
          <b>Type :</b> ${typeLabel}<br>
          <b>Date/heure :</b> ${props.date_heure || '-'}<br>
          <b>Rédacteur :</b> ${props.redacteur || '-'}<br>
          <b>Commentaire :</b><br>${(props.commentaire || '').replace(/\n/g,'<br>')}
        </div>
      `);
      marker.addTo(manualLayer);
    (window.__manualTypes).add(typeLabel);
    });
    manualLinesGeojson.features.forEach(feature => {
      if(!feature.geometry || feature.geometry.type !== 'LineString') return;
      const coords = feature.geometry.coordinates || [];
      if(coords.length < 2) return;
      const latlngs = coords.map(([lon, lat]) => L.latLng(lat, lon));
      const props = feature.properties || {};
      const typeLabel = props.type_points || props.type_ligne || '-';
      const lengthMeters = props.longueur_m || computeLineLength(latlngs);
      const color = props.couleur || '#1c7ed6';
      window.__manualTypes.add(typeLabel);
      const polyline = L.polyline(latlngs, {
        color,
        weight: props.epaisseur || 4,
        opacity: 0.9
      }).addTo(manualLayer);
      const tooltipHtml = `
        <div style="font-size:12px; line-height:1.4;">
          <b>${typeLabel}</b><br>
          Activation : ${props.activation || '-'}<br>
          Longueur : ${(lengthMeters/1000).toFixed(2)} km<br>
          ${props.date_heure ? `Date : ${props.date_heure}<br>` : ''}
        </div>
      `;
      const popupHtml = `
        <div class="popup-manual">
          <b>Type :</b> ${typeLabel}<br>
          <b>Activation :</b> ${props.activation || '-'}<br>
          <b>Longueur :</b> ${(lengthMeters/1000).toFixed(2)} km (${Math.round(lengthMeters)} m)<br>
          <b>Date/heure :</b> ${props.date_heure || '-'}<br>
          <b>Rédacteur :</b> ${props.redacteur || '-'}<br>
          <b>Commentaire :</b><br>${(props.commentaire || '').replace(/\n/g,'<br>')}
        </div>
      `;
      polyline.bindTooltip(tooltipHtml, {sticky:true, direction:'top', className:'manual-tooltip'});
      polyline.bindPopup(popupHtml);
    });
    if (typeof updateLegend === 'function') updateLegend();
  }

  function renderSarFeatures(){
    window.__sarTypes = new Set();
    sarLayer.clearLayers();
    if(!sarGeojson.features) sarGeojson.features = [];
    sarGeojson.features.forEach(feature=>{
      if(!feature || !feature.geometry) return;
      const props = feature.properties || {};
      const baseType = props.type || props.category || (feature.geometry.type === 'LineString' ? 'SAR Triangulation' : 'SAR Point');
      let displayType = baseType;
      if(baseType === 'sar_triangulation') displayType = 'SAR Triangulation';
      else if(baseType === 'sar_triangulation_back') displayType = 'SAR Triangulation (opposé)';
      else if(baseType === 'sar_triangulation_origin') displayType = 'SAR Triangulation (origine)';
      else if(baseType === 'sar_point') displayType = 'SAR Point';
      window.__sarTypes.add(displayType);
      if(feature.geometry.type === 'Point'){
        const [lon, lat] = feature.geometry.coordinates || [];
        if(typeof lat !== 'number' || typeof lon !== 'number') return;
        const direction = typeof props.direction_deg !== 'undefined' ? Number(props.direction_deg) : (typeof props.direction !== 'undefined' ? Number(props.direction) : 0);
        const clampedDirection = isFinite(direction) ? ((direction % 360) + 360) % 360 : 0;
        if(!icons['SAR_POINT']){
          icons['SAR_POINT'] = L.icon({
            iconUrl:'images/sar_point.png',
            iconSize:[28,28],
            iconAnchor:[14,14],
            popupAnchor:[0,-14]
          });
        }
        const marker = L.marker([lat, lon], {icon: icons['SAR_POINT'], title: props.equipe ? `SAR ${props.equipe}` : 'SAR'});
        const tooltip = `
          <div style="font-size:12px; line-height:1.4;">
            <b>${displayType}</b><br>
            Activation : ${props.activation || '-'}<br>
            Équipe : ${props.equipe || '-'}<br>
            Direction : ${isFinite(clampedDirection) ? clampedDirection.toFixed(0)+'°' : '—'}<br>
            Distance : ${props.distance_km ? props.distance_km.toFixed(2)+' km' : '—'}
          </div>`;
        marker.bindTooltip(tooltip, {direction:'top', className:'manual-tooltip'});
        const popup = `
          <div class="popup-manual">
            <b>Latitude :</b> ${lat.toFixed(6)}<br>
            <b>Longitude :</b> ${lon.toFixed(6)}<br>
            <b>Activation :</b> ${props.activation || '-'}<br>
            <b>Équipe SAR :</b> ${props.equipe || '-'}<br>
            <b>Direction :</b> ${isFinite(clampedDirection) ? clampedDirection.toFixed(0)+'°' : '—'}<br>
            <b>Distance :</b> ${props.distance_km ? `${props.distance_km.toFixed(2)} km (${Math.round((props.distance_km||0)*1000)} m)` : '—'}<br>
            <b>Rédacteur :</b> ${props.redacteur || '-'}<br>
            <b>Commentaire :</b><br>${(props.commentaire || '').replace(/\n/g,'<br>')}
          </div>`;
        marker.bindPopup(popup);
        marker.addTo(sarLayer);
      } else if(feature.geometry.type === 'LineString'){
        const coords = feature.geometry.coordinates || [];
        if(coords.length < 2) return;
        const latlngs = coords.map(([lon, lat])=>L.latLng(lat, lon));
        const color = props.couleur || '#ff922b';
        const weight = props.epaisseur || 4;
        const dash = (props.dashed === true || baseType === 'sar_triangulation_back') ? '6 8' : undefined;
        const polyline = L.polyline(latlngs, {color: color, weight, opacity:0.9, dashArray: dash}).addTo(sarLayer);
        const tooltip = `
          <div style="font-size:12px; line-height:1.4;">
            <b>${displayType}</b><br>
            Équipe : ${props.equipe || '-'}<br>
            Direction : ${typeof props.direction_deg !== 'undefined' ? Number(props.direction_deg).toFixed(0)+'°' : (props.direction ? Number(props.direction).toFixed(0)+'°' : '—')}<br>
            Distance : ${props.distance_m ? `${(props.distance_m/1000).toFixed(2)} km` : '—'}
          </div>`;
        polyline.bindTooltip(tooltip, {sticky:true, className:'manual-tooltip'});
        const popup = `
          <div class="popup-manual">
            <b>Activation :</b> ${props.activation || '-'}<br>
            <b>Équipe SAR :</b> ${props.equipe || '-'}<br>
            <b>Direction :</b> ${typeof props.direction_deg !== 'undefined' ? Number(props.direction_deg).toFixed(0)+'°' : (props.direction ? Number(props.direction).toFixed(0)+'°' : '—')}<br>
            <b>Distance :</b> ${props.distance_m ? `${Math.round(props.distance_m)} m` : '—'}<br>
            <b>Rédacteur :</b> ${props.redacteur || '-'}<br>
            <b>Commentaire :</b><br>${(props.commentaire || '').replace(/\n/g,'<br>')}
          </div>`;
        polyline.bindPopup(popup);
      }
    });
    if(typeof updateLegend === 'function') updateLegend();
  }

  async function loadManualGeojson(){
    try{
      const res = await fetch(`${TARGET_GEOJSON}?_=${Date.now()}`);
      if(!res.ok){
        if(res.status === 404){
          manualGeojson = {type:'FeatureCollection', features: []};
          renderManualFeatures();
          return;
        }
        throw new Error('HTTP '+res.status);
      }
      manualGeojson = await res.json();
      if(!manualGeojson.features) manualGeojson.features = [];
      manualGeojson.features.forEach(f=>{
        if(f && f.geometry){
          if(f.geometry.type_points && !f.geometry.type){
            f.geometry.type = f.geometry.type_points;
            delete f.geometry.type_points;
          }
        }
        if(f && f.properties && f.properties.type_point && !f.properties.type_points){
          f.properties.type_points = f.properties.type_point;
          delete f.properties.type_point;
        }
      });
      renderManualFeatures();
      console.log('[cartoff3] GeoJSON chargé, features:', manualGeojson.features.length);
    }catch(err){
      console.warn('[cartoff3] Impossible de charger', TARGET_GEOJSON, err);
      manualGeojson = {type:'FeatureCollection', features: []};
    }
  }

  async function saveManualGeojson(){
    const res = await fetch(`/api/save/${TARGET_GEOJSON}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(manualGeojson, null, 2)
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`Erreur sauvegarde (${res.status}) ${txt}`);
    }
  }

  async function loadManualLinesGeojson(){
    try{
      const res = await fetch(`${TARGET_LINES}?_=${Date.now()}`);
      if(!res.ok){
        if(res.status === 404){
          manualLinesGeojson = {type:'FeatureCollection', features: []};
          renderManualFeatures();
          return;
        }
        throw new Error('HTTP '+res.status);
      }
      manualLinesGeojson = await res.json();
      if(!manualLinesGeojson.features) manualLinesGeojson.features = [];
      renderManualFeatures();
      console.log('[cartoff3] Lignes SITAC chargées:', manualLinesGeojson.features.length);
    }catch(err){
      console.warn('[cartoff3] Impossible de charger', TARGET_LINES, err);
      manualLinesGeojson = {type:'FeatureCollection', features: []};
    }
  }

  async function saveManualLinesGeojson(){
    const res = await fetch(`/api/save/${TARGET_LINES}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(manualLinesGeojson, null, 2)
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`Erreur sauvegarde lignes (${res.status}) ${txt}`);
    }
  }

  async function loadSarGeojson(){
    try{
      const res = await fetch(`${SAR_GEOJSON}?_=${Date.now()}`);
      if(!res.ok){
        if(res.status === 404){
          sarGeojson = {type:'FeatureCollection', features: []};
          renderSarFeatures();
          return;
        }
        throw new Error('HTTP '+res.status);
      }
      sarGeojson = await res.json();
      if(!sarGeojson.features) sarGeojson.features = [];
      renderSarFeatures();
      console.log('[cartoff3] Données SAR chargées:', sarGeojson.features.length);
    }catch(err){
      console.warn('[cartoff3] Impossible de charger', SAR_GEOJSON, err);
      sarGeojson = {type:'FeatureCollection', features: []};
    }
  }

  async function saveSarGeojson(){
    const payload = {
      type:'FeatureCollection',
      features: sarGeojson.features || []
    };
    const res = await fetch(`/api/save/${SAR_GEOJSON}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload, null, 2)
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`Erreur sauvegarde SAR (${res.status}) ${txt}`);
    }
  }

  async function fetchJsonList(path){
    try{
      const res = await fetch(path);
      if(!res.ok) throw new Error(res.statusText);
      return await res.json();
    }catch(err){
      console.warn('[cartoff3] Impossible de charger', path, err);
      return [];
    }
  }

  const [mastructureData, activationsData, typePointsData, utilisateurs, sarTeamsData] = await Promise.all([
    fetchJsonList('json/mastructure.json'),
    fetchJsonList('json/activation.json'),
    fetchJsonList('json/type_point.json'),
    fetchJsonList('json/utilisateurs.json'),
    fetchJsonList('json/equipe_sar.json')
  ]);
  const structure = Array.isArray(mastructureData) ? mastructureData[0] : (mastructureData || {});
  window.__structureInfo = structure;
  activations = activationsData;
  sarTeams = Array.isArray(sarTeamsData) ? sarTeamsData : [];
  window.__typePointIcons = {};
  typePointsData.forEach(tp => {
    const id = tp.id || tp.label || tp.nom;
    if(!id) return;
    const iconPath = tp.icon || tp.image || 'images/CHANTIER.png';
    window.__typePointIcons[id] = iconPath;
    const key = `SITAC_${id}`;
    icons[key] = L.icon({iconUrl: iconPath, iconSize:[24,24], iconAnchor:[12,12], popupAnchor:[0,-12]});
  });
  activeActivations = activations.filter(act => {
    const status = (act.status || '').toLowerCase();
    return status.includes('en cours') || status.includes('encours');
  });
  const primaryActivation = activeActivations[0];
  window.__activeActivationsTitle = primaryActivation
    ? (primaryActivation.titre || primaryActivation.description || primaryActivation.id || '').toString()
    : '';

  function buildActivationOptions(){
    return activeActivations.map(item => {
      const label = item.titre ? `${item.id} – ${item.titre}` : item.id || '(ID inconnu)';
      return `<option value="${item.id || ''}">${label}</option>`;
    }).join('');
  }

  function buildTypePointOptions(){
    return typePointsData.map(item => {
      if(typeof item === 'string') return `<option value="${item}">${item}</option>`;
      const value = item.id || item.code || item.nom || item.label || '';
      const label = item.label || item.nom || item.description || value;
      return `<option value="${value}">${label}</option>`;
    }).join('');
  }

  function buildUtilisateurOptions(){
    return utilisateurs.map(user => {
      const label = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || '(Utilisateur)';
      return `<option value="${label}">${label}</option>`;
    }).join('');
  }

  function buildEquipeOptions(){
    if(!Array.isArray(sarTeams) || sarTeams.length === 0) return '<option value="">-- Aucune équipe configurée --</option>';
    return sarTeams.map(team=>{
      if(typeof team === 'string') return `<option value="${team}">${team}</option>`;
      const value = team.id || team.nom || team.name || '';
      const label = team.nom || team.name || value || '(Équipe)';
      const complement = team.description || team.zone || '';
      const display = complement ? `${label} – ${complement}` : label;
      return `<option value="${value}">${display}</option>`;
    }).join('');
  }

  function computeLineLength(latlngs){
    if(!Array.isArray(latlngs) || latlngs.length < 2) return 0;
    let total = 0;
    for(let i = 1; i < latlngs.length; i++){
      total += map.distance(latlngs[i-1], latlngs[i]);
    }
    return total;
  }

  function destinationPoint(lat, lon, bearingDeg, distanceMeters){
    const R = 6371000;
    const brng = (bearingDeg * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const angularDistance = distanceMeters / R;
    const destLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(brng));
    const destLon = lonRad + Math.atan2(
      Math.sin(brng) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLat)
    );
    return {
      lat: (destLat * 180) / Math.PI,
      lon: ((destLon * 180) / Math.PI + 540) % 360 - 180
    };
  }

  function hexToRgb(hex){
    if(!hex) return {r:0,g:0,b:0};
    const clean = hex.replace('#','');
    if(clean.length === 3){
      const r = parseInt(clean[0]+clean[0], 16);
      const g = parseInt(clean[1]+clean[1], 16);
      const b = parseInt(clean[2]+clean[2], 16);
      return {r,g,b};
    }
    if(clean.length === 6){
      const r = parseInt(clean.substring(0,2), 16);
      const g = parseInt(clean.substring(2,4), 16);
      const b = parseInt(clean.substring(4,6), 16);
      return {r,g,b};
    }
    return {r:0,g:0,b:0};
  }

  function resetLineDrawing(){
    lineDrawingState.active = false;
    lineDrawingState.latlngs = [];
    lineDrawingState.previewLatLng = null;
    if(lineDrawingState.tempLine){
      manualLayer.removeLayer(lineDrawingState.tempLine);
      lineDrawingState.tempLine = null;
    }
    if(lineDrawingState.markers.length){
      lineDrawingState.markers.forEach(m => manualLayer.removeLayer(m));
      lineDrawingState.markers = [];
    }
    map.off('click', handleLineClick);
    map.off('mousemove', handleLineMouseMove);
    map.off('dblclick', finishLineDrawing);
    document.removeEventListener('keydown', handleLineKeydown);
    if(lineDrawingState.doubleClickWasEnabled){
      map.doubleClickZoom.enable();
      lineDrawingState.doubleClickWasEnabled = false;
    }
  }

  function updateTempLine(previewLatLng){
    if(!lineDrawingState.tempLine) return;
    const path = lineDrawingState.latlngs.slice();
    if(previewLatLng){
      path.push(previewLatLng);
    }
    lineDrawingState.tempLine.setLatLngs(path);
  }

  function startLineDrawing(initialLatLng){
    if(lineDrawingState.active){
      resetLineDrawing();
    }
    lineDrawingState.active = true;
    lineDrawingState.latlngs = [initialLatLng];
    lineDrawingState.doubleClickWasEnabled = map.doubleClickZoom.enabled();
    map.doubleClickZoom.disable();
    const tempLine = L.polyline([initialLatLng], {
      color: '#1c7ed6',
      weight: 4,
      dashArray: '10 6',
      opacity: 0.9
    }).addTo(manualLayer);
    lineDrawingState.tempLine = tempLine;
    const marker = L.circleMarker(initialLatLng, {
      radius: 4,
      color: '#1c7ed6',
      weight: 2,
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(manualLayer);
    lineDrawingState.markers = [marker];
    map.on('click', handleLineClick);
    map.on('mousemove', handleLineMouseMove);
    map.on('dblclick', finishLineDrawing);
    document.addEventListener('keydown', handleLineKeydown);
    updateTempLine();
    showMessage('Mode ligne : cliquez pour ajouter des sommets, double-cliquez pour terminer, Échap pour annuler.', 6);
  }

  function handleLineClick(evt){
    if(!lineDrawingState.active) return;
    lineDrawingState.latlngs.push(evt.latlng);
    const marker = L.circleMarker(evt.latlng, {
      radius: 4,
      color: '#1c7ed6',
      weight: 2,
      fillColor: '#fff',
      fillOpacity: 1
    }).addTo(manualLayer);
    lineDrawingState.markers.push(marker);
    updateTempLine();
  }

  function handleLineMouseMove(evt){
    if(!lineDrawingState.active) return;
    lineDrawingState.previewLatLng = evt.latlng;
    updateTempLine(evt.latlng);
  }

  function handleLineKeydown(evt){
    if(!lineDrawingState.active) return;
    if(evt.key === 'Escape'){
      resetLineDrawing();
      showMessage('Tracé de ligne annulé.', 4);
    }
  }

  function finishLineDrawing(evt){
    if(!lineDrawingState.active) return;
    L.DomEvent.preventDefault(evt);
    L.DomEvent.stop(evt);
    if(lineDrawingState.latlngs.length < 2){
      resetLineDrawing();
      showMessage('Ligne ignorée : au moins deux points sont nécessaires.', 6);
      return;
    }
    const latlngs = lineDrawingState.latlngs.slice();
    resetLineDrawing();
    openLineForm(latlngs);
  }

  function openLineForm(latlngs){
    const bounds = L.latLngBounds(latlngs);
    const center = bounds.getCenter();
    const formId = `geojson-line-${Date.now()}`;
    const now = new Date();
    const datetimeValue = now.toISOString().slice(0,16);
    const lengthMeters = computeLineLength(latlngs);
    const lengthKm = (lengthMeters/1000).toFixed(2);
    const html = `
      <form id="${formId}" class="geojson-add-form">
        <label>Activation<br>
          <select name="activation">
            <option value="">-- Sélectionner --</option>
            ${buildActivationOptions()}
          </select>
        </label><br>
        <label>Type de tracé<br>
          <select name="type_points">
            <option value="">-- Sélectionner --</option>
            ${buildTypePointOptions()}
          </select>
        </label><br>
        <label>Longueur estimée<br>
          <input type="text" value="${lengthKm} km (${Math.round(lengthMeters)} m)" readonly>
        </label><br>
        <label>Date & heure<br><input name="date_heure" type="datetime-local" value="${datetimeValue}" readonly></label><br>
        <label>Rédacteur<br>
          <select name="redacteur">
            <option value="">-- Sélectionner --</option>
            ${buildUtilisateurOptions()}
          </select>
        </label><br>
        <label>Commentaire<br><textarea name="commentaire" rows="3" style="width:100%;"></textarea></label>
        <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" data-action="cancel">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
    const popup = L.popup({maxWidth: 360, closeOnClick: false})
      .setLatLng(center)
      .setContent(html)
      .openOn(map);

    setTimeout(()=>{
      const form = document.getElementById(formId);
      if(!form) return;
      form.querySelector('[data-action="cancel"]').addEventListener('click', ()=>{
        map.closePopup(popup);
      });
      form.addEventListener('submit', async evt => {
        evt.preventDefault();
        const data = new FormData(form);
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: latlngs.map(ll => [ll.lng, ll.lat])
          },
          properties: {
            type_points: data.get('type_points') || '',
            activation: data.get('activation') || '',
            date_heure: data.get('date_heure') || '',
            redacteur: data.get('redacteur') || '',
            commentaire: data.get('commentaire') || '',
            longueur_m: lengthMeters
          }
        };
        manualLinesGeojson.features.push(feature);
        try{
          await saveManualLinesGeojson();
          renderManualFeatures();
          showMessage('Ligne SITAC enregistrée.', 4);
          map.closePopup(popup);
        }catch(err){
          console.error('[cartoff3] Erreur sauvegarde ligne', err);
          showMessage('Erreur lors de la sauvegarde : '+err.message, 6);
        }
      });
    }, 0);
  }

  function openAddPopup(latlng){
    const formId = `geojson-add-${Date.now()}`;
    const now = new Date();
    const datetimeValue = now.toISOString().slice(0,16);
    const html = `
      <form id="${formId}" class="geojson-add-form">
        <label>Activation<br>
          <select name="activation">
            <option value="">-- Sélectionner --</option>
            ${buildActivationOptions()}
          </select>
        </label><br>
        <label>Type de point<br>
          <select name="type_points">
            <option value="">-- Sélectionner --</option>
            ${buildTypePointOptions()}
          </select>
        </label><br>
        <label>Latitude<br><input name="latitude" type="text" value="${latlng.lat.toFixed(6)}" readonly></label><br>
        <label>Longitude<br><input name="longitude" type="text" value="${latlng.lng.toFixed(6)}" readonly></label><br>
        <label>Date & heure<br><input name="date_heure" type="datetime-local" value="${datetimeValue}" readonly></label><br>
        <label>Rédacteur<br>
          <select name="redacteur">
            <option value="">-- Sélectionner --</option>
            ${buildUtilisateurOptions()}
          </select>
        </label><br>
        <label>Commentaire<br><textarea name="commentaire" rows="3" style="width:100%;"></textarea></label>
        <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" data-action="cancel">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;

    const popup = L.popup({maxWidth: 320, closeOnClick: true})
      .setLatLng(latlng)
      .setContent(html)
      .openOn(map);

    setTimeout(() => {
      const form = document.getElementById(formId);
      if(!form) return;
      form.querySelector('[data-action="cancel"]').addEventListener('click', ()=>{
        map.closePopup(popup);
      });
      form.addEventListener('submit', async (evt) => {
        evt.preventDefault();
        const data = new FormData(form);
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              parseFloat(data.get('longitude')),
              parseFloat(data.get('latitude'))
            ]
          },
          properties: {
            type_points: data.get('type_points') || '',
            activation: data.get('activation') || '',
            date_heure: data.get('date_heure') || '',
            redacteur: data.get('redacteur') || '',
            commentaire: data.get('commentaire') || ''
          }
        };
        manualGeojson.features.push(feature);
        try{
          await saveManualGeojson();
          renderManualFeatures();
          showMessage('Point ajouté au GeoJSON', 4);
          map.closePopup(popup);
        }catch(err){
          console.error('[cartoff3] Erreur sauvegarde', err);
          showMessage('Erreur lors de la sauvegarde : '+err.message, 6);
        }
      });
    }, 0);
  }

  function openSarTriangulationForm(originLatLng, menuPopup){
    const formId = `sar-triangulation-${Date.now()}`;
    const now = new Date();
    const datetimeValue = now.toISOString().slice(0,16);
    let currentDirection = 0;
    let currentDistanceKm = 20;
    let previewLine = null;
    let previewOppositeLine = null;
    let previewOriginPoint = null;

    function updatePreview(){
      if(previewLine){
        sarLayer.removeLayer(previewLine);
        previewLine = null;
      }
      if(previewOppositeLine){
        sarLayer.removeLayer(previewOppositeLine);
        previewOppositeLine = null;
      }
      if(previewOriginPoint){
        sarLayer.removeLayer(previewOriginPoint);
        previewOriginPoint = null;
      }
      const distanceMeters = currentDistanceKm * 1000;
      const dest = destinationPoint(originLatLng.lat, originLatLng.lng, currentDirection, distanceMeters);
      const destOpp = destinationPoint(originLatLng.lat, originLatLng.lng, (currentDirection + 180) % 360, distanceMeters);
      previewLine = L.polyline([originLatLng, L.latLng(dest.lat, dest.lon)], {
        color:'#ff922b',
        weight:3,
        opacity:0.9,
        dashArray:'8 6'
      }).addTo(sarLayer);
      previewOppositeLine = L.polyline([originLatLng, L.latLng(destOpp.lat, destOpp.lon)], {
        color:'#74c0fc',
        weight:2,
        opacity:0.8,
        dashArray:'4 6'
      }).addTo(sarLayer);
      previewOriginPoint = L.circleMarker(originLatLng, {
        radius:5,
        color:'#ff922b',
        weight:2,
        fillColor:'#fff',
        fillOpacity:1
      }).addTo(sarLayer);
    }

    updatePreview();

    const html = `
      <form id="${formId}" class="geojson-add-form">
        <fieldset style="border:none; margin:0; padding:0;">
          <legend style="font-weight:bold; margin-bottom:4px;">Triangulation SAR</legend>
          <label>Activation<br>
            <select name="activation">
              <option value="">-- Sélectionner --</option>
              ${buildActivationOptions()}
            </select>
          </label><br>
          <label>Équipe SAR<br>
            <select name="equipe">
              <option value="">-- Sélectionner --</option>
              ${buildEquipeOptions()}
            </select>
          </label><br>
          <label>Rédacteur<br>
            <select name="redacteur">
              <option value="">-- Sélectionner --</option>
              ${buildUtilisateurOptions()}
            </select>
          </label><br>
          <div style="margin:6px 0;">
            <label style="display:block;">Direction (°)<br>
              <input name="direction_deg" type="number" min="0" max="359" step="1" value="0" style="width:80px;">°
            </label>
            <input type="range" min="0" max="359" step="1" value="0" data-role="direction-slider" style="width:100%; margin-top:4px;">
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">
              ${['N','NE','E','SE','S','SO','O','NO'].map(dir=>{
                const degrees = {N:0, NE:45, E:90, SE:135, S:180, SO:225, O:270, NO:315}[dir];
                return `<button type="button" class="btn-cardinal" data-direction="${degrees}" style="flex:1 0 auto;">${dir}</button>`;
              }).join('')}
            </div>
          </div>
          <div style="margin:6px 0;">
            <label style="display:block;">Distance (km)<br>
              <input name="distance_km" type="number" min="0.1" max="150" step="0.1" value="20" style="width:100px;">
            </label>
            <input type="range" min="0.1" max="150" step="0.1" value="20" data-role="distance-slider" style="width:100%; margin-top:4px;">
          </div>
          <label>Date & heure<br><input name="date_heure" type="datetime-local" value="${datetimeValue}" readonly></label><br>
          <label>Commentaire<br><textarea name="commentaire" rows="3" style="width:100%;"></textarea></label>
          <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
            <button type="button" data-action="cancel">Annuler</button>
            <button type="submit" class="btn-primary">Enregistrer</button>
          </div>
        </fieldset>
      </form>
    `;

    const popup = L.popup({maxWidth: 360, closeOnClick: false})
      .setLatLng(originLatLng)
      .setContent(html)
      .openOn(map);

    const cleanup = () => {
      if(previewLine){
        sarLayer.removeLayer(previewLine);
        previewLine = null;
      }
      if(previewOppositeLine){
        sarLayer.removeLayer(previewOppositeLine);
        previewOppositeLine = null;
      }
      if(previewOriginPoint){
        sarLayer.removeLayer(previewOriginPoint);
        previewOriginPoint = null;
      }
    };

    setTimeout(()=>{
      const form = document.getElementById(formId);
      if(!form) return;
      const directionNumber = form.querySelector('input[name="direction_deg"]');
      const directionSlider = form.querySelector('[data-role="direction-slider"]');
      const directionButtons = form.querySelectorAll('.btn-cardinal');
      const distanceNumber = form.querySelector('input[name="distance_km"]');
      const distanceSlider = form.querySelector('[data-role="distance-slider"]');

      function syncDirectionFromNumber(){
        currentDirection = ((Number(directionNumber.value) % 360) + 360) % 360;
        directionNumber.value = currentDirection;
        directionSlider.value = currentDirection;
        updatePreview();
      }
      function syncDirectionFromSlider(){
        currentDirection = Number(directionSlider.value);
        directionNumber.value = currentDirection;
        updatePreview();
      }
      function syncDistanceFromNumber(){
        currentDistanceKm = Math.min(150, Math.max(0.1, Number(distanceNumber.value)));
        distanceSlider.value = currentDistanceKm;
        distanceNumber.value = currentDistanceKm;
        updatePreview();
      }
      function syncDistanceFromSlider(){
        currentDistanceKm = Math.min(150, Math.max(0.1, Number(distanceSlider.value)));
        distanceSlider.value = currentDistanceKm;
        distanceNumber.value = currentDistanceKm;
        updatePreview();
      }

      directionNumber.addEventListener('change', syncDirectionFromNumber);
      directionSlider.addEventListener('input', syncDirectionFromSlider);
      distanceNumber.addEventListener('change', syncDistanceFromNumber);
      distanceSlider.addEventListener('input', syncDistanceFromSlider);
      directionButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const val = Number(btn.getAttribute('data-direction'));
          directionNumber.value = val;
          directionSlider.value = val;
          syncDirectionFromSlider();
        });
      });

      form.querySelector('[data-action="cancel"]').addEventListener('click', ()=>{
        cleanup();
        if(popup && popup.remove) popup.remove();
        if(menuPopup && menuPopup.remove) menuPopup.remove();
        map.closePopup(popup);
      });

      form.addEventListener('submit', async evt=>{
        evt.preventDefault();
        const data = new FormData(form);
        const distanceMeters = currentDistanceKm * 1000;
        const dest = destinationPoint(originLatLng.lat, originLatLng.lng, currentDirection, distanceMeters);
        const destOpp = destinationPoint(originLatLng.lat, originLatLng.lng, (currentDirection + 180) % 360, distanceMeters);
        const originPointFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [originLatLng.lng, originLatLng.lat]
          },
          properties: {
            type: 'sar_triangulation_origin',
            activation: data.get('activation') || '',
            equipe: data.get('equipe') || '',
            redacteur: data.get('redacteur') || '',
            direction_deg: currentDirection,
            distance_km: currentDistanceKm,
            date_heure: data.get('date_heure') || '',
            commentaire: data.get('commentaire') || ''
          }
        };
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [originLatLng.lng, originLatLng.lat],
              [dest.lon, dest.lat]
            ]
          },
          properties: {
            type: 'sar_triangulation',
            activation: data.get('activation') || '',
            equipe: data.get('equipe') || '',
            redacteur: data.get('redacteur') || '',
            direction_deg: currentDirection,
            distance_km: currentDistanceKm,
            distance_m: distanceMeters,
            couleur: '#ff922b',
            dashed: false,
            date_heure: data.get('date_heure') || '',
            commentaire: data.get('commentaire') || ''
          }
        };
        const oppositeFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [originLatLng.lng, originLatLng.lat],
              [destOpp.lon, destOpp.lat]
            ]
          },
          properties: {
            type: 'sar_triangulation_back',
            activation: data.get('activation') || '',
            equipe: data.get('equipe') || '',
            redacteur: data.get('redacteur') || '',
            direction_deg: (currentDirection + 180) % 360,
            distance_km: currentDistanceKm,
            distance_m: distanceMeters,
            couleur: '#37b24d',
            dashed: true,
            date_heure: data.get('date_heure') || '',
            commentaire: data.get('commentaire') || ''
          }
        };
        const previousFeatures = Array.isArray(sarGeojson.features) ? sarGeojson.features.slice() : [];
        const additions = [originPointFeature, feature, oppositeFeature];
        sarGeojson.features = previousFeatures.concat(additions);
        renderSarFeatures();
        cleanup();
        if(popup && popup.remove) popup.remove();
        if(menuPopup && menuPopup.remove) menuPopup.remove();
        map.closePopup(popup);
        try{
          await saveSarGeojson();
          showMessage('Triangulation SAR enregistrée.', 4);
        }catch(err){
          console.error('[cartoff3] Erreur sauvegarde SAR triangulation', err);
          showMessage('Erreur lors de la sauvegarde SAR : '+err.message, 6);
          sarGeojson.features = previousFeatures;
          renderSarFeatures();
        }
      });
    }, 0);

    popup.on('remove', cleanup);
  }

  async function printSarTriangulation(){
    if(!window.jspdf || !window.jspdf.jsPDF){
      showMessage('Bibliothèque jsPDF non disponible.', 4);
      return;
    }
    if(typeof window.html2canvas === 'undefined'){
      showMessage('Export PDF indisponible : html2canvas manquant.', 6);
      return;
    }
    const sitacLayer = layers ? layers['SITAC'] : null;
    const sarVisible = sarLayer && map.hasLayer(sarLayer);
    const sitacVisible = sitacLayer && map.hasLayer(sitacLayer);
    try{
      if(sarVisible) map.removeLayer(sarLayer);
      if(sitacVisible) map.removeLayer(sitacLayer);
      await new Promise(resolve => requestAnimationFrame(resolve));
      showMessage('Génération du PDF triangulation SAR…', 4);
      const canvas = await window.html2canvas(document.getElementById('map'), {
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2
      });
      if(sarVisible) sarLayer.addTo(map);
      if(sitacVisible) sitacLayer.addTo(map);
      const doc = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
        compressPdf: false
      });
      const structure = window.__structureInfo || {};
      const title = structure.nom_structure || 'SAR - Triangulation (@osm)';
      const subtitle = `Imprimé le : ${new Date().toLocaleString()}`;
      const margin = 36;
      const headerHeight = 70;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const mapSize = map.getSize();
      const imgAspect = canvas.width / canvas.height;
      const pageAspect = pageWidth / (pageHeight - headerHeight - margin);
      let renderWidth = pageWidth - margin * 2;
      let renderHeight = pageHeight - headerHeight - margin * 1.5;
      if(imgAspect > pageAspect){
        renderHeight = renderWidth / imgAspect;
      } else {
        renderWidth = renderHeight * imgAspect;
      }
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = margin + headerHeight;

      doc.setFontSize(18);
      doc.text(title, margin, margin + 22);
      doc.setFontSize(12);
      doc.text(subtitle, margin, margin + 42);

      const activeLabel = (window.__activeActivationsTitle || '').trim();
      doc.setFontSize(11);
      doc.text(activeLabel ? `Activation en cours : ${activeLabel}` : 'Activation en cours : —', margin, margin + 58);

      const logoPath = structure.Logo_impression || 'images/Logo_F4EED.png';
      const logoImg = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = logoPath;
      });
      if(logoImg){
        const maxLogoWidth = 70;
        const aspect = logoImg.width / logoImg.height || 1;
        const logoWidth = Math.min(maxLogoWidth, logoImg.width || maxLogoWidth);
        const logoHeight = logoWidth / aspect;
        doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
      } else {
        doc.setFontSize(10);
        doc.setTextColor(180);
        doc.text('(Logo indisponible)', pageWidth - margin - 100, margin + 20);
        doc.setTextColor(0);
      }

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

      const scaleX = renderWidth / mapSize.x;
      const scaleY = renderHeight / mapSize.y;
      const projectPoint = (lat, lon) => {
        if(typeof lat !== 'number' || typeof lon !== 'number') return null;
        try {
          const point = map.latLngToContainerPoint(L.latLng(lat, lon));
          if(!point || typeof point.x !== 'number' || typeof point.y !== 'number') return null;
          return {
            x: offsetX + point.x * scaleX,
            y: offsetY + point.y * scaleY
          };
        } catch(err){
          console.warn('[SAR PDF] Projection invalide', lat, lon, err);
          return null;
        }
      };
      const drawLine = (coords, colorHex, width, dash) => {
        if(!Array.isArray(coords) || coords.length < 2) return;
        const rgb = hexToRgb(colorHex || '#ff922b');
        let firstPoint = null;
        const sections = [];
        coords.forEach(([lon, lat]) => {
          const p = projectPoint(lat, lon);
          if(p){
            if(!firstPoint) firstPoint = p;
            else sections.push(p);
          }
        });
        if(!firstPoint || sections.length === 0) return;
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.setLineWidth(width);
        if(doc.setLineDash){
          doc.setLineDash(dash && dash.length ? dash : [], 0);
        }
        doc.moveTo(firstPoint.x, firstPoint.y);
        sections.forEach(p=> doc.lineTo(p.x, p.y));
        doc.stroke();
        if(doc.setLineDash){
          doc.setLineDash([], 0);
        }
      };
      const drawPoint = (lat, lon, colorHex) => {
        const p = projectPoint(lat, lon);
        if(!p) return;
        const rgb = hexToRgb(colorHex || '#ff922b');
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.circle(p.x, p.y, 5, 'F');
      };

      manualLinesGeojson.features.forEach(feature => {
        if(!feature.geometry || feature.geometry.type !== 'LineString') return;
        const coords = feature.geometry.coordinates || [];
        drawLine(coords, feature.properties?.couleur || '#1c7ed6', feature.properties?.epaisseur || 4, null);
      });

      if(sarGeojson && Array.isArray(sarGeojson.features)){
        sarGeojson.features.forEach(feature => {
          if(!feature.geometry) return;
          if(feature.geometry.type === 'LineString'){
            const coords = feature.geometry.coordinates || [];
            const props = feature.properties || {};
            const colorHex = props.couleur || (props.type === 'sar_triangulation_back' ? '#37b24d' : '#ff922b');
            const width = props.type === 'sar_triangulation_back' ? 3 : 4;
            const dash = (props.dashed === true || props.type === 'sar_triangulation_back') ? [8, 6] : [];
            drawLine(coords, colorHex, width, dash);
          } else if(feature.geometry.type === 'Point'){
            const [lon, lat] = feature.geometry.coordinates || [];
            drawPoint(lat, lon, '#ff922b');
          }
        });
      }

      doc.setFontSize(18);
      doc.setTextColor(0, 102, 204);
      doc.text('Triangulation SAR sur fond de carte', pageWidth / 2, pageHeight - margin, {align: 'center'});
      doc.setTextColor(0,0,0);

      const pdfWindow = window.open('', '_blank');
      if(pdfWindow){
        const pdfData = doc.output('dataurlstring');
        pdfWindow.document.write(`
          <!DOCTYPE html>
          <html lang="fr">
            <head><meta charset="utf-8"><title>SITAC_Triangulation.pdf</title></head>
            <body style="margin:0;"><iframe src="${pdfData}" style="border:none;width:100%;height:100vh;"></iframe></body>
          </html>
        `);
        showMessage('PDF Triangulation SAR ouvert (Ctrl+S pour enregistrer).', 4);
        console.log('[SAR PDF] ouvert dans un nouvel onglet');
      } else {
        doc.save('SITAC_Triangulation.pdf');
        showMessage('PDF Triangulation SAR téléchargé.', 4);
        console.log('[SAR PDF] téléchargé en local');
      }
    }catch(err){
      console.error('[cartoff3] Erreur génération PDF SAR', err);
      showMessage('Erreur export PDF triangulation : '+err.message, 6);
    } finally {
      if(sarVisible && !map.hasLayer(sarLayer)) sarLayer.addTo(map);
      if(sitacVisible && sitacLayer && !map.hasLayer(sitacLayer)) sitacLayer.addTo(map);
    }
  }

  async function printSitac(){
    if(window.jspdf && window.jspdf.jsPDF){
      showMessage('Génération du PDF SITAC…', 4);
      console.log('[cartoff3] Début génération PDF SITAC');
      if(typeof window.html2canvas === 'undefined'){
        showMessage('Export PDF indisponible : html2canvas manquant.', 6);
        return;
      }
      const sarVisible = sarLayer && map.hasLayer(sarLayer);
      const sitacLayer = layers ? layers['SITAC'] : null;
      const sitacVisible = sitacLayer && map.hasLayer(sitacLayer);
      const meshtasticVisible = pointsLayer && map.hasLayer(pointsLayer);
      try{
        if(sarVisible) map.removeLayer(sarLayer);
        if(meshtasticVisible) map.removeLayer(pointsLayer);
        await new Promise(resolve => requestAnimationFrame(resolve));
        const canvas = await window.html2canvas(document.getElementById('map'), {
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff',
          scale: 2
        });
        if(sarVisible) sarLayer.addTo(map);
        if(meshtasticVisible) pointsLayer.addTo(map);
        const doc = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a4',
          compressPdf: false
        });
        const structure = window.__structureInfo || {};
        const title = structure.nom_structure || 'SITAC';
        const subtitle = `Imprimé le : ${new Date().toLocaleString()}`;
        const margin = 36;
        const headerHeight = 70;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const mapSize = map.getSize();
        const imgAspect = canvas.width / canvas.height;
        const pageAspect = pageWidth / (pageHeight - headerHeight - margin);
        let renderWidth = pageWidth - margin * 2;
        let renderHeight = pageHeight - headerHeight - margin * 1.5;
        if(imgAspect > pageAspect){
          renderHeight = renderWidth / imgAspect;
        } else {
          renderWidth = renderHeight * imgAspect;
        }
        const offsetX = (pageWidth - renderWidth) / 2;
        const offsetY = margin + headerHeight;

        doc.setFontSize(18);
        doc.text(title, margin, margin + 22);
        doc.setFontSize(12);
        doc.text(subtitle, margin, margin + 42);

        const activeLabel = (window.__activeActivationsTitle || '').trim();
        doc.setFontSize(11);
        doc.text(activeLabel ? `Activation en cours : ${activeLabel}` : 'Activation en cours : —', margin, margin + 58);

        const logoPath = structure.Logo_impression || 'images/Logo_F4EED.png';
        const logoImg = await new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = logoPath;
        });
        if(logoImg){
          const maxLogoWidth = 70;
          const aspect = logoImg.width / logoImg.height || 1;
          const logoWidth = Math.min(maxLogoWidth, logoImg.width || maxLogoWidth);
          const logoHeight = logoWidth / aspect;
          doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
        } else {
          doc.setFontSize(10);
          doc.setTextColor(180);
          doc.text('(Logo indisponible)', pageWidth - margin - 100, margin + 20);
          doc.setTextColor(0);
        }

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

        const scaleX = renderWidth / mapSize.x;
        const scaleY = renderHeight / mapSize.y;
        const projectPoint = (lat, lon) => {
          const point = map.latLngToContainerPoint(L.latLng(lat, lon));
          return {
            x: offsetX + point.x * scaleX,
            y: offsetY + point.y * scaleY
          };
        };
        const drawLine = (coords, colorHex, width, dash) => {
          if(!Array.isArray(coords) || coords.length < 2) return;
          doc.setDrawColor(colorHex);
          doc.setLineWidth(width);
          if(doc.setLineDash){
            doc.setLineDash(dash && dash.length ? dash : [], 0);
          }
          const first = projectPoint(coords[0][1], coords[0][0]);
          doc.moveTo(first.x, first.y);
          for(let i=1;i<coords.length;i++){
            const p = projectPoint(coords[i][1], coords[i][0]);
            doc.lineTo(p.x, p.y);
          }
          doc.stroke();
          if(doc.setLineDash){
            doc.setLineDash([], 0);
          }
        };
        const drawPoint = (lat, lon, colorHex) => {
          const p = projectPoint(lat, lon);
          doc.setFillColor(colorHex);
          doc.circle(p.x, p.y, 5, 'F');
        };

        if(manualLinesGeojson && Array.isArray(manualLinesGeojson.features)){
          manualLinesGeojson.features.forEach(feature => {
            if(!feature.geometry || feature.geometry.type !== 'LineString') return;
            const coords = feature.geometry.coordinates || [];
            const props = feature.properties || {};
            const color = props.couleur || '#1c7ed6';
            const dash = props.epaisseur === 2 ? [8,6] : [];
            drawLine(coords, color, props.epaisseur || 4, dash);
          });
        }
        if(manualGeojson && Array.isArray(manualGeojson.features)){
          manualGeojson.features.forEach(feature => {
            if(!feature.geometry || feature.geometry.type !== 'Point') return;
            const [lon, lat] = feature.geometry.coordinates || [];
            drawPoint(lat, lon, '#1c7ed6');
          });
        }

        doc.setFontSize(18);
        doc.setTextColor(0, 102, 204);
        doc.text('Impression SITAC sur fond de carte OSM', pageWidth / 2, pageHeight - margin, {align: 'center'});
        doc.setTextColor(0,0,0);

        const pdfWindow = window.open('', '_blank');
        if(pdfWindow){
          const pdfData = doc.output('dataurlstring');
          pdfWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fr">
              <head><meta charset="utf-8"><title>SITAC.pdf</title></head>
              <body style="margin:0;"><iframe src="${pdfData}" style="border:none;width:100%;height:100vh;"></iframe></body>
            </html>
          `);
          showMessage('PDF SITAC ouvert (Ctrl+S pour enregistrer).', 4);
        } else {
          doc.save('SITAC.pdf');
          showMessage('PDF SITAC téléchargé.', 4);
        }
      }catch(err){
        console.error('[cartoff3] Erreur génération PDF SITAC', err);
        showMessage('Erreur export PDF : '+err.message, 6);
        if(sarVisible && !map.hasLayer(sarLayer)) sarLayer.addTo(map);
        if(meshtasticVisible && pointsLayer && !map.hasLayer(pointsLayer)) pointsLayer.addTo(map);
      }
    } else {
      showMessage('Bibliothèque jsPDF non disponible.', 4);
    }
  }

  map.on('contextmenu', (evt) => {
    console.log('[cartoff3] contextmenu', evt.latlng);
    if(evt.originalEvent) evt.originalEvent.preventDefault();
    const latlng = evt.latlng;
    const html = `
      <div class="sitac-menu">
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin-bottom:6px;">
            <span style="font-weight:bold; display:block;">SITAC</span>
            <ul style="list-style:none; padding:4px 0 0 12px; margin:0;">
              <li><a href="#" data-action="sitac-point">SITAC Point</a></li>
              <li><a href="#" data-action="sitac-line">SITAC Ligne</a></li>
              <li><a href="#" data-action="sitac-zone">SITAC Zone</a></li>
              <li><a href="#" data-action="sitac-print">Imprimer SITAC</a></li>
            </ul>
          </li>
          <li>
            <span style="font-weight:bold; display:block;">SAR</span>
            <ul style="list-style:none; padding:4px 0 0 12px; margin:0;">
               <li><a href="#" data-action="sar-triangulation">SAR Triangulation</a></li>
               <li><a href="#" data-action="sar-print">Imprimer triangulation</a></li>
            </ul>
          </li>
        </ul>
      </div>
    `;
    const popup = L.popup({autoClose:true, closeOnClick:true, offset:[0,0]})
      .setLatLng(latlng)
      .setContent(html)
      .openOn(map);
    setTimeout(()=>{
      const links = document.querySelectorAll('.sitac-menu a');
      links.forEach(link => {
        link.addEventListener('click', async (e)=>{
          e.preventDefault();
          const action = link.getAttribute('data-action');
          map.closePopup(popup);
          if(action === 'sitac-point'){
            openAddPopup(latlng);
          } else if(action === 'sitac-line'){
            if(lineDrawingState.active){
              showMessage('Un tracé est déjà en cours. Terminez-le ou annulez-le avec Échap.', 6);
            } else {
              map.closePopup(popup);
              startLineDrawing(latlng);
            }
          } else if(action === 'sitac-zone'){
            showMessage('Mode SITAC Zone à venir.', 4);
          } else if(action === 'sitac-print'){
            await printSitac();
          } else if(action === 'sar-triangulation'){
            openSarTriangulationForm(latlng, popup);
          } else if(action === 'sar-print'){
            await printSarTriangulation();
          }
        });
      });
    }, 0);
  });

      loadManualGeojson();
      loadManualLinesGeojson();
      loadSarGeojson();
      
      // Gestion de l'affichage du menu "Départements de Corse" au survol de la Corse
      const corseMenu = document.getElementById('corseMenu');
      if(corseMenu){
        let isOverCorsica = false;
        map.on('mousemove', (evt) => {
          const latlng = evt.latlng;
          // Vérifier si on survole la Corse (latitude 41.3-43.1, longitude 8.5-9.6)
          const wasOverCorsica = isOverCorsica;
          isOverCorsica = latlng.lat >= 41.3 && latlng.lat <= 43.1 && 
                         latlng.lng >= 8.5 && latlng.lng <= 9.6;
          
          // Afficher ou masquer le menu uniquement si l'état a changé
          if(isOverCorsica !== wasOverCorsica){
            if(isOverCorsica){
              corseMenu.style.display = 'block';
            } else {
              corseMenu.style.display = 'none';
            }
          }
        });
      }
    }); // fin map.whenReady
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initManualModule, {once:true});
  } else {
    initManualModule();
  }
})();

// =======================
// Gestion des calques PostGIS (Communes)
// =======================
(function(){
  if (window.__postgis_init__) {
    console.log('[PostGIS] init déjà effectué');
    return;
  }

  function initPostGISModule(){
    if (typeof map === 'undefined') {
      console.warn('[PostGIS] Map indisponible, réessai dans 200ms');
      setTimeout(initPostGISModule, 200);
      return;
    }
    if (window.__postgis_init__) return;
    window.__postgis_init__ = true;
    console.log('[PostGIS] Initialisation module PostGIS');

    map.whenReady(() => {
      const postgisLayersDiv = document.getElementById('postgisLayers');
      if (!postgisLayersDiv) {
        console.warn('[PostGIS] Div postgisLayers introuvable');
        return;
      }

      const carroyageLayersDiv = document.getElementById('carroyageLayers');
      if (!carroyageLayersDiv) {
        console.warn('[PostGIS] Div carroyageLayers introuvable');
        return;
      }

      // Créer le calque pour les communes PostGIS
      const communesLayerName = 'Communes PostGIS';
      const communesLayer = L.layerGroup();
      if (!layers) window.layers = {};
      layers[communesLayerName] = communesLayer;

      // Créer le calque pour les DFCI 100x100 PostGIS
      const dfci100x100LayerName = 'DFCI 100x100 PostGIS';
      const dfci100x100Layer = L.layerGroup();
      layers[dfci100x100LayerName] = dfci100x100Layer;

      // Créer le calque pour les DFCI 20x20 PostGIS
      const dfci20x20LayerName = 'DFCI 20x20 PostGIS';
      const dfci20x20Layer = L.layerGroup();
      layers[dfci20x20LayerName] = dfci20x20Layer;

      // Créer le calque pour les DFCI 2x2 PostGIS
      const dfci2x2LayerName = 'DFCI 2x2 PostGIS';
      const dfci2x2Layer = L.layerGroup();
      layers[dfci2x2LayerName] = dfci2x2Layer;

      // Créer le calque pour les DFCI 1km PostGIS
      const dfci1kmLayerName = 'DFCI 1km PostGIS';
      const dfci1kmLayer = L.layerGroup();
      layers[dfci1kmLayerName] = dfci1kmLayer;

      // Créer le toggle switch pour les communes
      const checkboxId = 'chk_Communes_PostGIS';
      const MIN_ZOOM_LEVEL = 13; // Niveau de zoom minimum pour afficher les communes
      if (!document.getElementById(checkboxId)) {
        const { label, checkbox } = window.createToggleSwitch(checkboxId, 'Communes (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            const currentZoom = map.getZoom();
            if (currentZoom >= MIN_ZOOM_LEVEL) {
              await loadCommunesInView();
              communesLayer.addTo(map);
            } else {
              checkbox.checked = false;
              if (typeof showMessage === 'function') {
                showMessage(`Les communes ne s'affichent qu'à partir du niveau de zoom ${MIN_ZOOM_LEVEL}`, 4);
              }
            }
          } else {
            map.removeLayer(communesLayer);
            communesLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        postgisLayersDiv.appendChild(label);
      }

      // --- Départements PostGIS ---
      const departementsLayerName = 'Départements PostGIS';
      const departementsLayer = L.layerGroup();
      layers[departementsLayerName] = departementsLayer;

      const departementsCheckboxId = 'chk_Departements_PostGIS';
      if (!document.getElementById(departementsCheckboxId)) {
        const { label, checkbox } = window.createToggleSwitch(departementsCheckboxId, 'Départements (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            await loadDepartements();
            departementsLayer.addTo(map);
            await zoomToDepartementsExtent();
          } else {
            map.removeLayer(departementsLayer);
            departementsLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        postgisLayersDiv.appendChild(label);
      }

      // Créer le toggle switch pour DFCI 100x100
      const dfciCheckboxId = 'chk_DFCI_100x100_PostGIS';
      const DFCI_MIN_ZOOM_LEVEL = 5; // Niveau de zoom minimum pour afficher les DFCI 100x100
      if (!document.getElementById(dfciCheckboxId)) {
        const { label: dfciLabel, checkbox: dfciCheckbox } = createToggleSwitch(dfciCheckboxId, 'DFCI 100x100 (PG)', false);
        dfciCheckbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            const currentZoom = map.getZoom();
            if (currentZoom >= DFCI_MIN_ZOOM_LEVEL) {
              await loadDFCI100x100InView();
              dfci100x100Layer.addTo(map);
            } else {
              dfciCheckbox.checked = false;
              if (typeof showMessage === 'function') {
                showMessage(`Les DFCI 100x100 ne s'affichent qu'à partir du niveau de zoom ${DFCI_MIN_ZOOM_LEVEL}`, 4);
              }
            }
          } else {
            map.removeLayer(dfci100x100Layer);
            dfci100x100Layer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        carroyageLayersDiv.appendChild(dfciLabel);
      }

      // Créer le toggle switch pour DFCI 20x20
      const dfci20x20CheckboxId = 'chk_DFCI_20x20_PostGIS';
      const DFCI_20X20_MIN_ZOOM_LEVEL = 10; // Niveau de zoom minimum pour afficher les DFCI 20x20
      const DFCI_20X20_MAX_ZOOM_LEVEL = 13; // Niveau de zoom maximum pour afficher les DFCI 20x20
      if (!document.getElementById(dfci20x20CheckboxId)) {
        const { label: dfci20x20Label, checkbox: dfci20x20Checkbox } = createToggleSwitch(dfci20x20CheckboxId, 'DFCI 20x20 (PG)', false);
        dfci20x20Checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            const currentZoom = map.getZoom();
            if (currentZoom >= DFCI_20X20_MIN_ZOOM_LEVEL && currentZoom <= DFCI_20X20_MAX_ZOOM_LEVEL) {
              await loadDFCI20x20InView();
              dfci20x20Layer.addTo(map);
            } else {
              dfci20x20Checkbox.checked = false;
              if (typeof showMessage === 'function') {
                showMessage(`Les DFCI 20x20 ne s'affichent qu'entre les niveaux de zoom ${DFCI_20X20_MIN_ZOOM_LEVEL} et ${DFCI_20X20_MAX_ZOOM_LEVEL}`, 4);
              }
            }
          } else {
            map.removeLayer(dfci20x20Layer);
            dfci20x20Layer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        carroyageLayersDiv.appendChild(dfci20x20Label);
      }

      // Créer le toggle switch pour DFCI 2x2
      const dfci2x2CheckboxId = 'chk_DFCI_2x2_PostGIS';
      const DFCI_2X2_MIN_ZOOM_LEVEL = 12; // Niveau de zoom minimum pour afficher les DFCI 2x2
      const DFCI_2X2_MAX_ZOOM_LEVEL = 15; // Niveau de zoom maximum pour afficher les DFCI 2x2
      if (!document.getElementById(dfci2x2CheckboxId)) {
        const { label: dfci2x2Label, checkbox: dfci2x2Checkbox } = createToggleSwitch(dfci2x2CheckboxId, 'DFCI 2x2 (PG)', false);
        dfci2x2Checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            const currentZoom = map.getZoom();
            if (currentZoom >= DFCI_2X2_MIN_ZOOM_LEVEL && currentZoom <= DFCI_2X2_MAX_ZOOM_LEVEL) {
              await loadDFCI2x2InView();
              dfci2x2Layer.addTo(map);
            } else {
              dfci2x2Checkbox.checked = false;
              if (typeof showMessage === 'function') {
                showMessage(`Les DFCI 2x2 ne s'affichent qu'entre les niveaux de zoom ${DFCI_2X2_MIN_ZOOM_LEVEL} et ${DFCI_2X2_MAX_ZOOM_LEVEL}`, 4);
              }
            }
          } else {
            map.removeLayer(dfci2x2Layer);
            dfci2x2Layer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        carroyageLayersDiv.appendChild(dfci2x2Label);
      }

      // Créer le toggle switch pour DFCI 1km
      const dfci1kmCheckboxId = 'chk_DFCI_1km_PostGIS';
      const DFCI_1KM_MIN_ZOOM_LEVEL = 14; // Niveau de zoom minimum pour afficher les DFCI 1km
      if (!document.getElementById(dfci1kmCheckboxId)) {
        const { label: dfci1kmLabel, checkbox: dfci1kmCheckbox } = createToggleSwitch(dfci1kmCheckboxId, 'DFCI 1km (PG)', false);
        dfci1kmCheckbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            const currentZoom = map.getZoom();
            if (currentZoom >= DFCI_1KM_MIN_ZOOM_LEVEL) {
              await loadDFCI1kmInView();
              dfci1kmLayer.addTo(map);
            } else {
              dfci1kmCheckbox.checked = false;
              if (typeof showMessage === 'function') {
                showMessage(`Les DFCI 1km ne s'affichent qu'à partir du niveau de zoom ${DFCI_1KM_MIN_ZOOM_LEVEL}`, 4);
              }
            }
          } else {
            map.removeLayer(dfci1kmLayer);
            dfci1kmLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        carroyageLayersDiv.appendChild(dfci1kmLabel);
      }

      // Fonction pour charger les communes visibles à l'écran depuis la base de données PostGIS
      async function loadCommunesInView() {
        try {
          // Vérifier le niveau de zoom minimum
          const currentZoom = map.getZoom();
          if (currentZoom < MIN_ZOOM_LEVEL) {
            console.log(`[PostGIS] Zoom trop faible (${currentZoom} < ${MIN_ZOOM_LEVEL}), communes non chargées`);
            map.removeLayer(communesLayer);
            communesLayer.clearLayers();
            return;
          }

          const bounds = map.getBounds();
          const minLat = bounds.getSouth();
          const maxLat = bounds.getNorth();
          const minLon = bounds.getWest();
          const maxLon = bounds.getEast();

          console.log(`[PostGIS] Chargement communes depuis la BASE DE DONNÉES dans bbox: ${minLon}, ${minLat}, ${maxLon}, ${maxLat}`);

          // Appel à l'API qui interroge la table communes de la base de données
          // Utiliser l'URL absolue car la page est servie statiquement (pas de proxy React)
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/communes/by-bbox`;
          const params = new URLSearchParams({
            min_lon: minLon.toString(),
            min_lat: minLat.toString(),
            max_lon: maxLon.toString(),
            max_lat: maxLat.toString()
          });

          const fullUrl = `${apiUrl}?${params}`;
          console.log('[PostGIS] URL API:', fullUrl);

          const response = await fetch(fullUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const communes = await response.json();
          console.log(`[PostGIS] ${communes.length} communes chargées depuis la BASE DE DONNÉES`);
          
          if (communes.length > 0) {
            console.log('[PostGIS] Exemple de commune:', communes[0]);
            console.log('[PostGIS] Géométrie de la première commune:', communes[0].geom);
            console.log('[PostGIS] Type de géométrie:', communes[0].geom?.type);
            console.log('[PostGIS] Départements trouvés:', [...new Set(communes.map(c => c.code_departement))]);
          } else {
            console.warn('[PostGIS] Aucune commune retournée par l\'API pour cette zone');
          }

          // Nettoyer le calque existant
          communesLayer.clearLayers();

          // Créer une FeatureCollection GeoJSON avec toutes les communes
          const features = communes
            .filter(commune => {
              if (!commune.geom) {
                console.warn(`[PostGIS] Commune ${commune.code_insee} (${commune.nom}) sans géométrie`);
                return false;
              }
              // Vérifier que la géométrie est valide
              if (!commune.geom.type || !commune.geom.coordinates) {
                console.warn(`[PostGIS] Géométrie invalide pour commune ${commune.code_insee}:`, commune.geom);
                return false;
              }
              return true;
            })
            .map(commune => {
              // Créer un Feature GeoJSON à partir de la géométrie
              return {
                type: 'Feature',
                geometry: commune.geom,
                properties: {
                  code_insee: commune.code_insee,
                  nom: commune.nom,
                  code_departement: commune.code_departement,
                  statut: commune.statut || ''
                }
              };
            });

          if (features.length === 0) {
            console.warn('[PostGIS] Aucune commune avec géométrie trouvée');
            if (typeof showMessage === 'function') {
              showMessage('Aucune commune trouvée dans cette zone', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec toutes les features
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#8B4513', // Marron
                weight: 2,
                dashArray: '5, 5', // Pointillé
                fill: false, // Pas de remplissage
                fillOpacity: 0, // 100% transparent
                opacity: 1.0
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    Code INSEE: ${props.code_insee}<br>
                    Département: ${props.code_departement}<br>
                    ${props.statut ? `Statut: ${props.statut}<br>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });

            geoJsonLayer.addTo(communesLayer);
            console.log(`[PostGIS] ${features.length} communes ajoutées au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des communes: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement communes:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des communes PostGIS: ' + err.message, 6);
          }
        }
      }

      // Fonction pour charger les départements depuis la base de données
      async function loadDepartements() {
        try {
          console.log('[PostGIS] Chargement des départements depuis la BASE DE DONNÉES');

          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/departements/all`;

          console.log('[PostGIS] URL API départements:', apiUrl);

          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API départements:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const departements = await response.json();
          console.log(`[PostGIS] ${departements.length} départements chargés depuis la BASE DE DONNÉES`);
          
          departementsLayer.clearLayers();

          const features = departements
            .filter(dept => dept.geom && dept.geom.type && dept.geom.coordinates)
            .map(dept => ({
              type: 'Feature',
              geometry: dept.geom,
              properties: {
                code_insee: dept.code_insee,
                nom: dept.nom,
                nom_majuscules: dept.nom_majuscules || '',
                code_region: dept.code_region || ''
              }
            }));

          if (features.length === 0) {
            console.warn('[PostGIS] Aucun département avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun département trouvé', 4);
            }
            return;
          }

          try {
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#0066cc',
                weight: 2,
                fillColor: '#0066cc',
                fillOpacity: 0.1,
                opacity: 0.8
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    Code INSEE: ${props.code_insee}<br>
                    ${props.code_region ? `Région: ${props.code_region}<br>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });
            geoJsonLayer.addTo(departementsLayer);
            console.log(`[PostGIS] ${features.length} départements ajoutés au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON départements:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des départements: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement départements:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des départements PostGIS: ' + err.message, 6);
          }
        }
      }

      // Fonction pour zoomer sur l'étendue des départements
      async function zoomToDepartementsExtent() {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/departements/extent`;

          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const extent = await response.json();
          
          if (extent.min_lon && extent.min_lat && extent.max_lon && extent.max_lat) {
            const bounds = L.latLngBounds(
              [extent.min_lat, extent.min_lon],
              [extent.max_lat, extent.max_lon]
            );
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('[PostGIS] Zoom sur l\'étendue départements:', extent);
          } else {
            console.warn('[PostGIS] Étendue départements invalide');
          }
        } catch (err) {
          console.error('[PostGIS] Erreur récupération étendue départements:', err);
        }
      }

      // Fonction pour charger les DFCI 100x100 visibles à l'écran depuis la base de données PostGIS
      async function loadDFCI100x100InView() {
        try {
          // Vérifier le niveau de zoom minimum
          const currentZoom = map.getZoom();
          if (currentZoom < DFCI_MIN_ZOOM_LEVEL) {
            console.log(`[PostGIS] Zoom trop faible (${currentZoom} < ${DFCI_MIN_ZOOM_LEVEL}), DFCI 100x100 non chargées`);
            map.removeLayer(dfci100x100Layer);
            dfci100x100Layer.clearLayers();
            return;
          }

          const bounds = map.getBounds();
          const minLat = bounds.getSouth();
          const maxLat = bounds.getNorth();
          const minLon = bounds.getWest();
          const maxLon = bounds.getEast();

          console.log(`[PostGIS] Chargement DFCI 100x100 depuis la BASE DE DONNÉES dans bbox: ${minLon}, ${minLat}, ${maxLon}, ${maxLat}`);

          // Appel à l'API qui interroge la table dfci_100x100 de la base de données
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/dfci-100x100/by-bbox`;
          const params = new URLSearchParams({
            min_lon: minLon.toString(),
            min_lat: minLat.toString(),
            max_lon: maxLon.toString(),
            max_lat: maxLat.toString()
          });

          const fullUrl = `${apiUrl}?${params}`;
          console.log('[PostGIS] URL API DFCI:', fullUrl);

          const response = await fetch(fullUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API DFCI:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const dfciItems = await response.json();
          console.log(`[PostGIS] ${dfciItems.length} carrés DFCI 100x100 chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          dfci100x100Layer.clearLayers();

          // Créer une FeatureCollection GeoJSON avec tous les carrés DFCI
          const features = dfciItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[PostGIS] DFCI ${item.code_dfci} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[PostGIS] Géométrie invalide pour DFCI ${item.code_dfci}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  code_dfci: item.code_dfci,
                  id: item.id
                }
              };
            });

          if (features.length === 0) {
            console.warn('[PostGIS] Aucun carré DFCI 100x100 avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun carré DFCI 100x100 trouvé dans cette zone', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec toutes les features
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#ff0000',
                weight: 4,
                fill: false,
                fillOpacity: 0,
                opacity: 1.0
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>DFCI 100x100</b><br>
                    Code: <b>${props.code_dfci}</b>
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.code_dfci, {permanent: false, direction: 'center'});
              }
            });

            geoJsonLayer.addTo(dfci100x100Layer);
            console.log(`[PostGIS] ${features.length} carrés DFCI 100x100 ajoutés au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON DFCI:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des DFCI 100x100: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement DFCI 100x100:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des DFCI 100x100 PostGIS: ' + err.message, 6);
          }
        }
      }

      // Fonction pour charger les DFCI 20x20 visibles à l'écran depuis la base de données PostGIS
      async function loadDFCI20x20InView() {
        try {
          // Vérifier le niveau de zoom (entre min et max)
          const currentZoom = map.getZoom();
          if (currentZoom < DFCI_20X20_MIN_ZOOM_LEVEL || currentZoom > DFCI_20X20_MAX_ZOOM_LEVEL) {
            console.log(`[PostGIS] Zoom hors limites (${currentZoom} < ${DFCI_20X20_MIN_ZOOM_LEVEL} ou > ${DFCI_20X20_MAX_ZOOM_LEVEL}), DFCI 20x20 non chargées`);
            map.removeLayer(dfci20x20Layer);
            dfci20x20Layer.clearLayers();
            return;
          }

          const bounds = map.getBounds();
          const minLat = bounds.getSouth();
          const maxLat = bounds.getNorth();
          const minLon = bounds.getWest();
          const maxLon = bounds.getEast();

          console.log(`[PostGIS] Chargement DFCI 20x20 depuis la BASE DE DONNÉES dans bbox: ${minLon}, ${minLat}, ${maxLon}, ${maxLat}`);

          // Appel à l'API qui interroge la table dfci_20x20 de la base de données
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/dfci-20x20/by-bbox`;
          const params = new URLSearchParams({
            min_lon: minLon.toString(),
            min_lat: minLat.toString(),
            max_lon: maxLon.toString(),
            max_lat: maxLat.toString()
          });

          const fullUrl = `${apiUrl}?${params}`;
          console.log('[PostGIS] URL API DFCI 20x20:', fullUrl);

          const response = await fetch(fullUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API DFCI 20x20:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const dfciItems = await response.json();
          console.log(`[PostGIS] ${dfciItems.length} carrés DFCI 20x20 chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          dfci20x20Layer.clearLayers();

          // Créer une FeatureCollection GeoJSON avec tous les carrés DFCI
          const features = dfciItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[PostGIS] DFCI ${item.code_dfci} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[PostGIS] Géométrie invalide pour DFCI ${item.code_dfci}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  code_dfci: item.code_dfci,
                  id: item.id
                }
              };
            });

          if (features.length === 0) {
            console.warn('[PostGIS] Aucun carré DFCI 20x20 avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun carré DFCI 20x20 trouvé dans cette zone', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec toutes les features
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#ff0000',
                weight: 4,
                fill: false,
                fillOpacity: 0,
                opacity: 1.0
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>DFCI 20x20</b><br>
                    Code: <b>${props.code_dfci}</b>
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.code_dfci, {permanent: false, direction: 'center'});
              }
            });

            geoJsonLayer.addTo(dfci20x20Layer);
            console.log(`[PostGIS] ${features.length} carrés DFCI 20x20 ajoutés au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON DFCI 20x20:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des DFCI 20x20: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement DFCI 20x20:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des DFCI 20x20 PostGIS: ' + err.message, 6);
          }
        }
      }

      // Fonction pour charger les DFCI 2x2 visibles à l'écran depuis la base de données PostGIS
      async function loadDFCI2x2InView() {
        try {
          // Vérifier le niveau de zoom (entre min et max)
          const currentZoom = map.getZoom();
          if (currentZoom < DFCI_2X2_MIN_ZOOM_LEVEL || currentZoom > DFCI_2X2_MAX_ZOOM_LEVEL) {
            console.log(`[PostGIS] Zoom hors limites (${currentZoom} < ${DFCI_2X2_MIN_ZOOM_LEVEL} ou > ${DFCI_2X2_MAX_ZOOM_LEVEL}), DFCI 2x2 non chargées`);
            map.removeLayer(dfci2x2Layer);
            dfci2x2Layer.clearLayers();
            return;
          }

          const bounds = map.getBounds();
          const minLat = bounds.getSouth();
          const maxLat = bounds.getNorth();
          const minLon = bounds.getWest();
          const maxLon = bounds.getEast();

          console.log(`[PostGIS] Chargement DFCI 2x2 depuis la BASE DE DONNÉES dans bbox: ${minLon}, ${minLat}, ${maxLon}, ${maxLat}`);

          // Appel à l'API qui interroge la table dfci_2x2 de la base de données
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/dfci-2x2/by-bbox`;
          const params = new URLSearchParams({
            min_lon: minLon.toString(),
            min_lat: minLat.toString(),
            max_lon: maxLon.toString(),
            max_lat: maxLat.toString()
          });

          const fullUrl = `${apiUrl}?${params}`;
          console.log('[PostGIS] URL API DFCI 2x2:', fullUrl);

          const response = await fetch(fullUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API DFCI 2x2:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const dfciItems = await response.json();
          console.log(`[PostGIS] ${dfciItems.length} carrés DFCI 2x2 chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          dfci2x2Layer.clearLayers();

          // Créer une FeatureCollection GeoJSON avec tous les carrés DFCI
          const features = dfciItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[PostGIS] DFCI ${item.code_dfci} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[PostGIS] Géométrie invalide pour DFCI ${item.code_dfci}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  code_dfci: item.code_dfci,
                  id: item.id
                }
              };
            });

          if (features.length === 0) {
            console.warn('[PostGIS] Aucun carré DFCI 2x2 avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun carré DFCI 2x2 trouvé dans cette zone', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec toutes les features
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#ff0000',
                weight: 4,
                fill: false,
                fillOpacity: 0,
                opacity: 1.0
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>DFCI 2x2</b><br>
                    Code: <b>${props.code_dfci}</b>
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.code_dfci, {permanent: false, direction: 'center'});
              }
            });

            geoJsonLayer.addTo(dfci2x2Layer);
            console.log(`[PostGIS] ${features.length} carrés DFCI 2x2 ajoutés au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON DFCI 2x2:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des DFCI 2x2: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement DFCI 2x2:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des DFCI 2x2 PostGIS: ' + err.message, 6);
          }
        }
      }

      // Fonction pour charger les DFCI 1km visibles à l'écran depuis la base de données PostGIS
      async function loadDFCI1kmInView() {
        try {
          // Vérifier le niveau de zoom minimum
          const currentZoom = map.getZoom();
          if (currentZoom < DFCI_1KM_MIN_ZOOM_LEVEL) {
            console.log(`[PostGIS] Zoom trop faible (${currentZoom} < ${DFCI_1KM_MIN_ZOOM_LEVEL}), DFCI 1km non chargées`);
            map.removeLayer(dfci1kmLayer);
            dfci1kmLayer.clearLayers();
            return;
          }

          const bounds = map.getBounds();
          const minLat = bounds.getSouth();
          const maxLat = bounds.getNorth();
          const minLon = bounds.getWest();
          const maxLon = bounds.getEast();

          console.log(`[PostGIS] Chargement DFCI 1km depuis la BASE DE DONNÉES dans bbox: ${minLon}, ${minLat}, ${maxLon}, ${maxLat}`);

          // Appel à l'API qui interroge la table dfci_1km de la base de données
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/dfci-1km/by-bbox`;
          const params = new URLSearchParams({
            min_lon: minLon.toString(),
            min_lat: minLat.toString(),
            max_lon: maxLon.toString(),
            max_lat: maxLat.toString()
          });

          const fullUrl = `${apiUrl}?${params}`;
          console.log('[PostGIS] URL API DFCI 1km:', fullUrl);

          const response = await fetch(fullUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostGIS] Erreur API DFCI 1km:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const dfciItems = await response.json();
          console.log(`[PostGIS] ${dfciItems.length} carrés DFCI 1km chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          dfci1kmLayer.clearLayers();

          // Créer une FeatureCollection GeoJSON avec tous les carrés DFCI
          const features = dfciItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[PostGIS] DFCI ${item.code_dfci} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[PostGIS] Géométrie invalide pour DFCI ${item.code_dfci}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  code_dfci: item.code_dfci,
                  id: item.id
                }
              };
            });

          if (features.length === 0) {
            console.warn('[PostGIS] Aucun carré DFCI 1km avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun carré DFCI 1km trouvé dans cette zone', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec toutes les features
            const geoJsonLayer = L.geoJSON(features, {
              style: {
                color: '#ff0000',
                weight: 4,
                fill: false,
                fillOpacity: 0,
                opacity: 1.0
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>DFCI 1km</b><br>
                    Code: <b>${props.code_dfci}</b>
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.code_dfci, {permanent: false, direction: 'center'});
              }
            });

            geoJsonLayer.addTo(dfci1kmLayer);
            console.log(`[PostGIS] ${features.length} carrés DFCI 1km ajoutés au calque`);
          } catch (err) {
            console.error('[PostGIS] Erreur création calque GeoJSON DFCI 1km:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des DFCI 1km: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[PostGIS] Erreur chargement DFCI 1km:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des DFCI 1km PostGIS: ' + err.message, 6);
          }
        }
      }

      // Recharger les communes et DFCI lors du zoom ou du déplacement de la carte
      let loadTimeout = null;
      let dfciLoadTimeout = null;
      let dfci20x20LoadTimeout = null;
      let dfci2x2LoadTimeout = null;
      let dfci1kmLoadTimeout = null;
      map.on('moveend zoomend', () => {
        // Gestion des communes
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && checkbox.checked) {
          const currentZoom = map.getZoom();
          // Si le zoom est inférieur au minimum, retirer les communes
          if (currentZoom < MIN_ZOOM_LEVEL) {
            map.removeLayer(communesLayer);
            communesLayer.clearLayers();
            checkbox.checked = false;
            if (typeof showMessage === 'function') {
              showMessage(`Les communes ne s'affichent qu'à partir du niveau de zoom ${MIN_ZOOM_LEVEL}`, 4);
            }
            if (typeof updateLegend === 'function') updateLegend();
            return;
          }
          // Délai pour éviter trop de requêtes
          if (loadTimeout) clearTimeout(loadTimeout);
          loadTimeout = setTimeout(() => {
            loadCommunesInView();
          }, 300);
        }

        // Gestion des DFCI 100x100
        const dfciCheckbox = document.getElementById(dfciCheckboxId);
        if (dfciCheckbox && dfciCheckbox.checked) {
          const currentZoom = map.getZoom();
          // Si le zoom est inférieur au minimum, retirer les DFCI
          if (currentZoom < DFCI_MIN_ZOOM_LEVEL) {
            map.removeLayer(dfci100x100Layer);
            dfci100x100Layer.clearLayers();
            dfciCheckbox.checked = false;
            if (typeof showMessage === 'function') {
              showMessage(`Les DFCI 100x100 ne s'affichent qu'à partir du niveau de zoom ${DFCI_MIN_ZOOM_LEVEL}`, 4);
            }
            if (typeof updateLegend === 'function') updateLegend();
            return;
          }
          // Délai pour éviter trop de requêtes
          if (dfciLoadTimeout) clearTimeout(dfciLoadTimeout);
          dfciLoadTimeout = setTimeout(() => {
            loadDFCI100x100InView();
          }, 300);
        }

        // Gestion des DFCI 20x20
        const dfci20x20Checkbox = document.getElementById(dfci20x20CheckboxId);
        if (dfci20x20Checkbox && dfci20x20Checkbox.checked) {
          const currentZoom = map.getZoom();
          // Si le zoom est en dehors de la plage autorisée, retirer les DFCI 20x20
          if (currentZoom < DFCI_20X20_MIN_ZOOM_LEVEL || currentZoom > DFCI_20X20_MAX_ZOOM_LEVEL) {
            map.removeLayer(dfci20x20Layer);
            dfci20x20Layer.clearLayers();
            dfci20x20Checkbox.checked = false;
            if (typeof showMessage === 'function') {
              showMessage(`Les DFCI 20x20 ne s'affichent qu'entre les niveaux de zoom ${DFCI_20X20_MIN_ZOOM_LEVEL} et ${DFCI_20X20_MAX_ZOOM_LEVEL}`, 4);
            }
            if (typeof updateLegend === 'function') updateLegend();
            return;
          }
          // Délai pour éviter trop de requêtes
          if (dfci20x20LoadTimeout) clearTimeout(dfci20x20LoadTimeout);
          dfci20x20LoadTimeout = setTimeout(() => {
            loadDFCI20x20InView();
          }, 300);
        }

        // Gestion des DFCI 2x2
        const dfci2x2Checkbox = document.getElementById(dfci2x2CheckboxId);
        if (dfci2x2Checkbox && dfci2x2Checkbox.checked) {
          const currentZoom = map.getZoom();
          // Si le zoom est en dehors de la plage autorisée, retirer les DFCI 2x2
          if (currentZoom < DFCI_2X2_MIN_ZOOM_LEVEL || currentZoom > DFCI_2X2_MAX_ZOOM_LEVEL) {
            map.removeLayer(dfci2x2Layer);
            dfci2x2Layer.clearLayers();
            dfci2x2Checkbox.checked = false;
            if (typeof showMessage === 'function') {
              showMessage(`Les DFCI 2x2 ne s'affichent qu'entre les niveaux de zoom ${DFCI_2X2_MIN_ZOOM_LEVEL} et ${DFCI_2X2_MAX_ZOOM_LEVEL}`, 4);
            }
            if (typeof updateLegend === 'function') updateLegend();
            return;
          }
          // Délai pour éviter trop de requêtes
          if (dfci2x2LoadTimeout) clearTimeout(dfci2x2LoadTimeout);
          dfci2x2LoadTimeout = setTimeout(() => {
            loadDFCI2x2InView();
          }, 300);
        }

        // Gestion des DFCI 1km
        const dfci1kmCheckbox = document.getElementById(dfci1kmCheckboxId);
        if (dfci1kmCheckbox && dfci1kmCheckbox.checked) {
          const currentZoom = map.getZoom();
          // Si le zoom est inférieur au minimum, retirer les DFCI 1km
          if (currentZoom < DFCI_1KM_MIN_ZOOM_LEVEL) {
            map.removeLayer(dfci1kmLayer);
            dfci1kmLayer.clearLayers();
            dfci1kmCheckbox.checked = false;
            if (typeof showMessage === 'function') {
              showMessage(`Les DFCI 1km ne s'affichent qu'à partir du niveau de zoom ${DFCI_1KM_MIN_ZOOM_LEVEL}`, 4);
            }
            if (typeof updateLegend === 'function') updateLegend();
            return;
          }
          // Délai pour éviter trop de requêtes
          if (dfci1kmLoadTimeout) clearTimeout(dfci1kmLoadTimeout);
          dfci1kmLoadTimeout = setTimeout(() => {
            loadDFCI1kmInView();
          }, 300);
        }
      });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initPostGISModule, {once:true});
  } else {
    initPostGISModule();
  }
})();

// ===================================================================
// Module CD2E pour le menu "Département de la Loire"
// ===================================================================
(function(){
  if (window.__cd2e_loire_init__) {
    console.log('[CD2E Loire] init déjà effectué');
    return;
  }

  function initCD2ELoireModule(){
    if (typeof map === 'undefined') {
      console.warn('[CD2E Loire] Map indisponible, réessai dans 200ms');
      setTimeout(initCD2ELoireModule, 200);
      return;
    }
    if (window.__cd2e_loire_init__) return;
    window.__cd2e_loire_init__ = true;
    console.log('[CD2E Loire] Initialisation module CD2E Loire');

    map.whenReady(() => {
      const departementLayersDiv = document.getElementById('departementLayers');
      if (!departementLayersDiv) {
        console.warn('[CD2E Loire] Div departementLayers introuvable');
        return;
      }

      // Créer le calque pour CD2E
      const cd2eLayerName = 'CD2E Loire';
      const cd2eLayer = L.layerGroup();
      if (!layers) window.layers = {};
      layers[cd2eLayerName] = cd2eLayer;

      // Créer le toggle switch pour CD2E
      const cd2eCheckboxId = 'chk_CD2E_Loire';
      if (!document.getElementById(cd2eCheckboxId)) {
        const { label, checkbox } = window.createToggleSwitch(cd2eCheckboxId, 'CD2E (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            await loadCD2E();
            cd2eLayer.addTo(map);
            // Zoomer sur l'étendue de la couche CD2E
            await zoomToCD2EExtent();
          } else {
            map.removeLayer(cd2eLayer);
            cd2eLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        departementLayersDiv.appendChild(label);
      }

      // Fonction pour charger les points CD2E depuis la base de données
      async function loadCD2E() {
        try {
          console.log('[CD2E Loire] Chargement des points CD2E depuis la BASE DE DONNÉES');

          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/cd2e/all`;

          console.log('[CD2E Loire] URL API:', apiUrl);

          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[CD2E Loire] Erreur API:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const cd2eItems = await response.json();
          console.log(`[CD2E Loire] ${cd2eItems.length} points CD2E chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          cd2eLayer.clearLayers();

          // Créer les features GeoJSON
          const features = cd2eItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[CD2E Loire] Point ${item.nom} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[CD2E Loire] Géométrie invalide pour ${item.nom}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  nom: item.nom,
                  std: item.std || ''
                }
              };
            });

          if (features.length === 0) {
            console.warn('[CD2E Loire] Aucun point CD2E avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun point CD2E trouvé', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec des marqueurs
            const geoJsonLayer = L.geoJSON(features, {
              pointToLayer: (feature, latlng) => {
                return L.marker(latlng, {
                  icon: L.icon({
                    iconUrl: 'images/objet.png',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                    popupAnchor: [0, -11]
                  })
                });
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    ${props.std ? `STD: ${props.std}<br>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });

            geoJsonLayer.addTo(cd2eLayer);
            console.log(`[CD2E Loire] ${features.length} points CD2E ajoutés au calque`);
          } catch (err) {
            console.error('[CD2E Loire] Erreur création calque GeoJSON:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des points CD2E: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[CD2E Loire] Erreur chargement CD2E:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des points CD2E: ' + err.message, 6);
          }
        }
      }

      // Fonction pour zoomer sur l'étendue de la couche CD2E
      async function zoomToCD2EExtent() {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/cd2e/extent`;

          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const extent = await response.json();
          
          if (extent.min_lon && extent.min_lat && extent.max_lon && extent.max_lat) {
            const bounds = L.latLngBounds(
              [extent.min_lat, extent.min_lon],
              [extent.max_lat, extent.max_lon]
            );
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('[CD2E Loire] Zoom sur l\'étendue CD2E:', extent);
          } else {
            console.warn('[CD2E Loire] Étendue CD2E invalide');
          }
        } catch (err) {
          console.error('[CD2E Loire] Erreur récupération étendue CD2E:', err);
        }
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initCD2ELoireModule, {once:true});
  } else {
    initCD2ELoireModule();
  }
})();

// Module Ets SEVESO pour le menu "Gestion des risques"
// ===================================================================
(function(){
  if (window.__ets_seveso_init__) {
    console.log('[Ets SEVESO] init déjà effectué');
    return;
  }

  function initEtsSevesoModule(){
    if (typeof map === 'undefined') {
      console.warn('[Ets SEVESO] Map indisponible, réessai dans 200ms');
      setTimeout(initEtsSevesoModule, 200);
      return;
    }
    if (window.__ets_seveso_init__) return;
    window.__ets_seveso_init__ = true;
    console.log('[Ets SEVESO] Initialisation module Ets SEVESO');

    map.whenReady(() => {
      const riskLayersDiv = document.getElementById('riskLayers');
      if (!riskLayersDiv) {
        console.warn('[Ets SEVESO] Div riskLayers introuvable');
        return;
      }

      // Créer le calque pour Ets SEVESO
      const etsSevesoLayerName = 'Ets SEVESO';
      const etsSevesoLayer = L.layerGroup();
      if (!layers) window.layers = {};
      layers[etsSevesoLayerName] = etsSevesoLayer;

      // Créer le toggle switch pour Ets SEVESO
      const etsSevesoCheckboxId = 'chk_Ets_SEVESO';
      if (!document.getElementById(etsSevesoCheckboxId)) {
        const { label, checkbox } = window.createToggleSwitch(etsSevesoCheckboxId, 'Ets SEVESO (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            await loadEtsSeveso();
            etsSevesoLayer.addTo(map);
            // Zoomer sur l'étendue de la couche Ets SEVESO
            await zoomToEtsSevesoExtent();
          } else {
            map.removeLayer(etsSevesoLayer);
            etsSevesoLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        riskLayersDiv.appendChild(label);
      }

      // Fonction pour charger les établissements SEVESO depuis la base de données
      async function loadEtsSeveso() {
        try {
          console.log('[Ets SEVESO] Chargement des établissements SEVESO depuis la BASE DE DONNÉES');

          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/ets-seveso/all`;

          console.log('[Ets SEVESO] URL API:', apiUrl);

          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Ets SEVESO] Erreur API:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const etsSevesoItems = await response.json();
          console.log(`[Ets SEVESO] ${etsSevesoItems.length} établissements SEVESO chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          etsSevesoLayer.clearLayers();

          // Créer les features GeoJSON
          const features = etsSevesoItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[Ets SEVESO] Point ${item.nom} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[Ets SEVESO] Géométrie invalide pour ${item.nom}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  nom: item.nom,
                  activite: item.activite || '',
                  niveau: item.niveau || '',
                  ppi: item.ppi || ''
                }
              };
            });

          if (features.length === 0) {
            console.warn('[Ets SEVESO] Aucun établissement SEVESO avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun établissement SEVESO trouvé', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec des marqueurs
            const geoJsonLayer = L.geoJSON(features, {
              pointToLayer: (feature, latlng) => {
                return L.marker(latlng, {
                  icon: L.icon({
                    iconUrl: 'images/objet.png',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                    popupAnchor: [0, -11]
                  })
                });
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    ${props.activite ? `Activité: ${props.activite}<br>` : ''}
                    ${props.niveau ? `Niveau: ${props.niveau}<br>` : ''}
                    ${props.ppi ? `PPI: ${props.ppi}<br>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });

            geoJsonLayer.addTo(etsSevesoLayer);
            console.log(`[Ets SEVESO] ${features.length} établissements SEVESO ajoutés au calque`);
          } catch (err) {
            console.error('[Ets SEVESO] Erreur création calque GeoJSON:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des établissements SEVESO: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[Ets SEVESO] Erreur chargement Ets SEVESO:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des établissements SEVESO: ' + err.message, 6);
          }
        }
      }

      // Fonction pour zoomer sur l'étendue de la couche Ets SEVESO
      async function zoomToEtsSevesoExtent() {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/ets-seveso/extent`;

          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const extent = await response.json();
          
          if (extent.min_lon && extent.min_lat && extent.max_lon && extent.max_lat) {
            const bounds = L.latLngBounds(
              [extent.min_lat, extent.min_lon],
              [extent.max_lat, extent.max_lon]
            );
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('[Ets SEVESO] Zoom sur l\'étendue Ets SEVESO:', extent);
          } else {
            console.warn('[Ets SEVESO] Étendue Ets SEVESO invalide');
          }
        } catch (err) {
          console.error('[Ets SEVESO] Erreur récupération étendue Ets SEVESO:', err);
        }
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initEtsSevesoModule, {once:true});
  } else {
    initEtsSevesoModule();
  }
})();

// Module CIS pour le menu "SDIS 42"
// ===================================================================
(function(){
  if (window.__cis_init__) {
    console.log('[CIS] init déjà effectué');
    return;
  }

  function initCISModule(){
    if (typeof map === 'undefined') {
      console.warn('[CIS] Map indisponible, réessai dans 200ms');
      setTimeout(initCISModule, 200);
      return;
    }
    if (window.__cis_init__) return;
    window.__cis_init__ = true;
    console.log('[CIS] Initialisation module CIS');

    map.whenReady(() => {
      const sdis42LayersDiv = document.getElementById('sdis42Layers');
      if (!sdis42LayersDiv) {
        console.warn('[CIS] Div sdis42Layers introuvable');
        return;
      }

      // Créer le calque pour CIS
      const cisLayerName = 'CIS';
      const cisLayer = L.layerGroup();
      if (!layers) window.layers = {};
      layers[cisLayerName] = cisLayer;

      // Créer le toggle switch pour CIS
      const cisCheckboxId = 'chk_CIS';
      if (!document.getElementById(cisCheckboxId)) {
        const { label, checkbox } = window.createToggleSwitch(cisCheckboxId, 'Centre d\'Incendie et de Secours (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            await loadCIS();
            cisLayer.addTo(map);
            // Zoomer sur l'étendue de la couche CIS
            await zoomToCISExtent();
          } else {
            map.removeLayer(cisLayer);
            cisLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        sdis42LayersDiv.appendChild(label);
      }

      // Fonction pour charger les Centres d'Incendie et de Secours depuis la base de données
      async function loadCIS() {
        try {
          console.log('[CIS] Chargement des Centres d\'Incendie et de Secours depuis la BASE DE DONNÉES');

          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/cis/all`;

          console.log('[CIS] URL API:', apiUrl);

          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[CIS] Erreur API:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const cisItems = await response.json();
          console.log(`[CIS] ${cisItems.length} Centres d'Incendie et de Secours chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          cisLayer.clearLayers();

          // Créer les features GeoJSON
          const features = cisItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[CIS] Point ${item.nom} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[CIS] Géométrie invalide pour ${item.nom}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  nom: item.nom
                }
              };
            });

          if (features.length === 0) {
            console.warn('[CIS] Aucun Centre d\'Incendie et de Secours avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun Centre d\'Incendie et de Secours trouvé', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec des marqueurs
            const geoJsonLayer = L.geoJSON(features, {
              pointToLayer: (feature, latlng) => {
                return L.marker(latlng, {
                  icon: L.icon({
                    iconUrl: 'images/objet.png',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                    popupAnchor: [0, -11]
                  })
                });
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    Centre d'Incendie et de Secours
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });

            geoJsonLayer.addTo(cisLayer);
            console.log(`[CIS] ${features.length} Centres d'Incendie et de Secours ajoutés au calque`);
          } catch (err) {
            console.error('[CIS] Erreur création calque GeoJSON:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des Centres d\'Incendie et de Secours: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[CIS] Erreur chargement CIS:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des Centres d\'Incendie et de Secours: ' + err.message, 6);
          }
        }
      }

      // Fonction pour zoomer sur l'étendue de la couche CIS
      async function zoomToCISExtent() {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/cis/extent`;

          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const extent = await response.json();
          
          if (extent.min_lon && extent.min_lat && extent.max_lon && extent.max_lat) {
            const bounds = L.latLngBounds(
              [extent.min_lat, extent.min_lon],
              [extent.max_lat, extent.max_lon]
            );
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('[CIS] Zoom sur l\'étendue CIS:', extent);
          } else {
            console.warn('[CIS] Étendue CIS invalide');
          }
        } catch (err) {
          console.error('[CIS] Erreur récupération étendue CIS:', err);
        }
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initCISModule, {once:true});
  } else {
    initCISModule();
  }
})();

// Module POI AASC pour le menu "Associations Agréées de Sécurité Civile"
// ===================================================================
(function(){
  if (window.__poi_aasc_init__) {
    console.log('[POI AASC] init déjà effectué');
    return;
  }

  function initPOIAASCModule(){
    if (typeof map === 'undefined') {
      console.warn('[POI AASC] Map indisponible, réessai dans 200ms');
      setTimeout(initPOIAASCModule, 200);
      return;
    }
    if (window.__poi_aasc_init__) return;
    window.__poi_aasc_init__ = true;
    console.log('[POI AASC] Initialisation module POI AASC');

    map.whenReady(() => {
      const aascLayersDiv = document.getElementById('AASCLayers');
      if (!aascLayersDiv) {
        console.warn('[POI AASC] Div AASCLayers introuvable');
        return;
      }

      // Créer le calque pour POI AASC
      const poiAascLayerName = 'POI AASC';
      const poiAascLayer = L.layerGroup();
      if (!layers) window.layers = {};
      layers[poiAascLayerName] = poiAascLayer;

      // Créer le toggle switch pour POI AASC
      const poiAascCheckboxId = 'chk_POI_AASC';
      if (!document.getElementById(poiAascCheckboxId)) {
        const { label, checkbox } = window.createToggleSwitch(poiAascCheckboxId, 'POI AASC (PG)', false);
        checkbox.addEventListener('change', async (e) => {
          if (e.target.checked) {
            await loadPOIAASC();
            poiAascLayer.addTo(map);
            // Zoomer sur l'étendue de la couche POI AASC
            await zoomToPOIASCExtent();
          } else {
            map.removeLayer(poiAascLayer);
            poiAascLayer.clearLayers();
          }
          if (typeof updateLegend === 'function') updateLegend();
        });
        aascLayersDiv.appendChild(label);
      }

      // Fonction pour charger les Points d'Intérêt AASC depuis la base de données
      async function loadPOIAASC() {
        try {
          console.log('[POI AASC] Chargement des Points d\'Intérêt AASC depuis la BASE DE DONNÉES');

          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/poi-aasc/all`;

          console.log('[POI AASC] URL API:', apiUrl);

          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[POI AASC] Erreur API:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const poiAascItems = await response.json();
          console.log(`[POI AASC] ${poiAascItems.length} Points d'Intérêt AASC chargés depuis la BASE DE DONNÉES`);

          // Nettoyer le calque existant
          poiAascLayer.clearLayers();

          // Créer les features GeoJSON
          const features = poiAascItems
            .filter(item => {
              if (!item.geom) {
                console.warn(`[POI AASC] Point ${item.nom} sans géométrie`);
                return false;
              }
              if (!item.geom.type || !item.geom.coordinates) {
                console.warn(`[POI AASC] Géométrie invalide pour ${item.nom}:`, item.geom);
                return false;
              }
              return true;
            })
            .map(item => {
              return {
                type: 'Feature',
                geometry: item.geom,
                properties: {
                  nom: item.nom,
                  type_points_particuliers: item.type_points_particuliers || '',
                  description: item.description || '',
                  contact: item.contact || '',
                  telephone: item.telephone || '',
                  mail: item.mail || '',
                  capacite: item.capacite || '',
                  aasc_source: item.aasc_source || ''
                }
              };
            });

          if (features.length === 0) {
            console.warn('[POI AASC] Aucun Point d\'Intérêt AASC avec géométrie trouvé');
            if (typeof showMessage === 'function') {
              showMessage('Aucun Point d\'Intérêt AASC trouvé', 4);
            }
            return;
          }

          try {
            // Créer le calque GeoJSON avec des marqueurs
            const geoJsonLayer = L.geoJSON(features, {
              pointToLayer: (feature, latlng) => {
                return L.marker(latlng, {
                  icon: L.icon({
                    iconUrl: 'images/objet.png',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                    popupAnchor: [0, -11]
                  })
                });
              },
              onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const popupContent = `
                  <div style="font-size:12px; line-height:1.4;">
                    <b>${props.nom}</b><br>
                    ${props.type_points_particuliers ? `Type: ${props.type_points_particuliers}<br>` : ''}
                    ${props.description ? `Description: ${props.description}<br>` : ''}
                    ${props.contact ? `Contact: ${props.contact}<br>` : ''}
                    ${props.telephone ? `Téléphone: ${props.telephone}<br>` : ''}
                    ${props.mail ? `Mail: ${props.mail}<br>` : ''}
                    ${props.capacite ? `Capacité: ${props.capacite}<br>` : ''}
                    ${props.aasc_source ? `Source: ${props.aasc_source}<br>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent);
                layer.bindTooltip(props.nom, {permanent: false, direction: 'top'});
              }
            });

            geoJsonLayer.addTo(poiAascLayer);
            console.log(`[POI AASC] ${features.length} Points d'Intérêt AASC ajoutés au calque`);
          } catch (err) {
            console.error('[POI AASC] Erreur création calque GeoJSON:', err);
            if (typeof showMessage === 'function') {
              showMessage('Erreur lors de l\'affichage des Points d\'Intérêt AASC: ' + err.message, 6);
            }
          }

          if (typeof updateLegend === 'function') updateLegend();
        } catch (err) {
          console.error('[POI AASC] Erreur chargement POI AASC:', err);
          if (typeof showMessage === 'function') {
            showMessage('Erreur lors du chargement des Points d\'Intérêt AASC: ' + err.message, 6);
          }
        }
      }

      // Fonction pour zoomer sur l'étendue de la couche POI AASC
      async function zoomToPOIASCExtent() {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : `${window.location.protocol}//${window.location.hostname}:8000`;
          const apiUrl = `${apiBaseUrl}/api/geographie/poi-aasc/extent`;

          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const extent = await response.json();
          
          if (extent.min_lon && extent.min_lat && extent.max_lon && extent.max_lat) {
            const bounds = L.latLngBounds(
              [extent.min_lat, extent.min_lon],
              [extent.max_lat, extent.max_lon]
            );
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('[POI AASC] Zoom sur l\'étendue POI AASC:', extent);
          } else {
            console.warn('[POI AASC] Étendue POI AASC invalide');
          }
        } catch (err) {
          console.error('[POI AASC] Erreur récupération étendue POI AASC:', err);
        }
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initPOIAASCModule, {once:true});
  } else {
    initPOIAASCModule();
  }
})();

// ===================================================================
// Module pour zoomer sur une commune depuis un paramètre URL
// ===================================================================
(function(){
  if (window.__zoom_commune_init__) {
    console.log('[Zoom Commune] init déjà effectué');
    return;
  }

  function initZoomCommuneModule(){
    if (typeof map === 'undefined') {
      console.warn('[Zoom Commune] Map indisponible, réessai dans 200ms');
      setTimeout(initZoomCommuneModule, 200);
      return;
    }
    if (window.__zoom_commune_init__) return;
    window.__zoom_commune_init__ = true;
    console.log('[Zoom Commune] Initialisation module zoom sur commune');

    map.whenReady(async () => {
      // Lire le paramètre URL code_commune
      const urlParams = new URLSearchParams(window.location.search);
      const codeCommune = urlParams.get('code_commune');
      
      if (!codeCommune) {
        console.log('[Zoom Commune] Aucun paramètre code_commune dans l\'URL');
        return;
      }

      console.log(`[Zoom Commune] Code commune trouvé dans l'URL: ${codeCommune}`);

      try {
        // Déterminer l'URL de l'API
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8000'
          : `${window.location.protocol}//${window.location.hostname}:8000`;
        
        // Appeler l'API pour obtenir la commune
        const apiUrl = `${apiBaseUrl}/api/geographie/communes/${codeCommune}`;
        console.log('[Zoom Commune] Appel API:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const commune = await response.json();
        console.log('[Zoom Commune] Commune récupérée:', commune);

        if (!commune.geom) {
          console.warn('[Zoom Commune] La commune n\'a pas de géométrie');
          if (typeof showMessage === 'function') {
            showMessage(`La commune ${commune.nom || codeCommune} n'a pas de géométrie disponible`, 5);
          }
          return;
        }

        // Créer un calque GeoJSON temporaire avec la commune
        const communeFeature = {
          type: 'Feature',
          geometry: commune.geom,
          properties: {
            code_insee: commune.code_insee,
            nom: commune.nom,
            code_departement: commune.code_departement
          }
        };

        const communeLayer = L.geoJSON(communeFeature, {
          style: {
            color: 'blue',
            weight: 3,
            fillOpacity: 0.3,
            fillColor: 'blue'
          }
        });

        // Ajouter le calque à la carte et zoomer
        communeLayer.addTo(map);
        const bounds = communeLayer.getBounds();
        map.fitBounds(bounds, { padding: [50, 50] });
        
        console.log('[Zoom Commune] Zoom effectué sur la commune:', commune.nom);

        // Retirer le calque après 8 secondes (comme dans cartoff.js)
        setTimeout(() => {
          if (communeLayer && map.hasLayer(communeLayer)) {
            map.removeLayer(communeLayer);
          }
        }, 8000);

        // Afficher un message
        if (typeof showMessage === 'function') {
          showMessage(`Zoom sur ${commune.nom} (${commune.code_insee})`, 3);
        }

      } catch (err) {
        console.error('[Zoom Commune] Erreur lors du zoom sur la commune:', err);
        if (typeof showMessage === 'function') {
          showMessage(`Erreur lors du zoom sur la commune: ${err.message}`, 6);
        }
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initZoomCommuneModule, {once:true});
  } else {
    initZoomCommuneModule();
  }
})();
