// =======================
// Thème automatique
// =======================
function applyTheme(theme){
    if(theme==='dark'){
        document.body.classList.add('dark');
        document.querySelector('.sidebar').classList.add('dark');
    } else {
        document.body.classList.remove('dark');
        document.querySelector('.sidebar').classList.remove('dark');
    }
}
applyTheme(localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
window.addEventListener('storage', (e)=>{ if(e.key==='theme'){ applyTheme(e.newValue); } });

// =======================
// Carte principale
// =======================
// Initialiser la carte
const map = L.map('map').setView([45.7885,4.1830],9);

// Charger le layer PMTiles de manière synchrone
// Attendre que tous les scripts soient chargés avant de charger le PMTiles
(function() {
  // Fonction pour charger le PMTiles une fois que protomapsL est disponible
  function initPmtiles() {
    // Vérifier que protomapsL est disponible
    if (typeof protomapsL === 'undefined' || typeof protomapsL.leafletLayer !== 'function') {
      // Si protomapsL n'est pas encore disponible, réessayer après un court délai
      setTimeout(initPmtiles, 100);
      return;
    }
    
    try {
      // Créer et ajouter le layer PMTiles
      protomapsL.leafletLayer({
        url: "pmtiles/mymap.pmtiles",
        flavor: 'light',
        lang: 'fr'
      }).addTo(map);
      console.log('✓ PMTiles layer chargé');
    } catch (error) {
      console.error('Erreur lors du chargement du PMTiles:', error);
    }
  }
  
  // Attendre que le DOM soit prêt et que les scripts soient chargés
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPmtiles);
  } else {
    // DOM déjà chargé, attendre un peu pour que les scripts se chargent
    setTimeout(initPmtiles, 50);
  }
})();

// =======================
// Coordonnées multi-système
// =======================
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs");
proj4.defs("EPSG:32631","+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:27572","+proj=lcc +lat_1=45.89891888888889 +lat_2=47.69601444444444 +lat_0=46.8 +lon_0=0 +x_0=600000 +y_0=2200000 +ellps=clrk80IGN +units=m +no_defs");

function latLonToUTM(lat, lon){
    try{ const r=proj4("EPSG:4326","EPSG:32631",[lon,lat]); return {easting:Math.round(r[0]), northing:Math.round(r[1]), zoneNumber:31}; }
    catch(e){return{easting:"-",northing:"-",zoneNumber:"-"};}
}
function latLonToLambert93(lat, lon){
    try{ const r=proj4("EPSG:4326","EPSG:2154",[lon,lat]); return 'X:'+Math.round(r[0])+' Y:'+Math.round(r[1]); }
    catch(e){return '–';}
}
function latLonToDFCI(lat, lon){
    try{
        const lambert = wgs84ToLambertIIExtended(lat, lon);
        const dfciCodes = lambertToDFCI(lambert.X, lambert.Y);
        return dfciCodes ?? '–';
    } catch(e){
        console.error('DFCI conversion error:', e);
        return '–';
    }
}

function wgs84ToLambertIIExtended(lat, lon) {
  const lambda_w = lon * Math.PI / 180;
  const phi_w = lat * Math.PI / 180;

  const a_w = 6378137.0;
  const b_w = 6356752.314;
  const e2_w = ((a_w * a_w) - (b_w * b_w)) / (a_w * a_w);
  const sinPhiW = Math.sin(phi_w);
  const N = a_w / Math.sqrt(1 - e2_w * sinPhiW * sinPhiW);
  const cosPhiW = Math.cos(phi_w);
  const X_w = N * cosPhiW * Math.cos(lambda_w);
  const Y_w = N * cosPhiW * Math.sin(lambda_w);
  const Z_w = N * (1 - e2_w) * sinPhiW;

  const X_n = X_w + 168;
  const Y_n = Y_w + 60;
  const Z_n = Z_w - 320;

  const a_n = 6378249.2;
  const b_n = 6356515.0;
  const e2_n = (a_n * a_n - b_n * b_n) / (a_n * a_n);
  const epsilon = 1e-10;

  const sqrtXY = Math.sqrt(X_n * X_n + Y_n * Y_n);
  let p0 = Math.atan((Z_n / sqrtXY) * (1 - (a_n * e2_n) / Math.sqrt(X_n * X_n + Y_n * Y_n + Z_n * Z_n)));
  let p1 = Math.atan(
    (Z_n / sqrtXY) /
    (1 - (a_n * e2_n * Math.cos(p0)) /
      Math.sqrt((X_n * X_n + Y_n * Y_n) * (1 - e2_n * Math.pow(Math.sin(p0), 2))))
  );

  while (Math.abs(p1 - p0) >= epsilon) {
    p0 = p1;
    p1 = Math.atan(
      (Z_n / sqrtXY) /
      (1 - (a_n * e2_n * Math.cos(p0)) /
        Math.sqrt((X_n * X_n + Y_n * Y_n) * (1 - e2_n * Math.pow(Math.sin(p0), 2))))
    );
  }

  const phi_n = p1;
  const lambda_n = Math.atan2(Y_n, X_n);

  const n = 0.7289686274;
  const c = 11745793.39;
  const Xs = 600000.0;
  const Ys = 8199695.768;
  const lambda0 = 0.04079234433198;
  const e_n = Math.sqrt(e2_n);
  const LI = Math.log(
    Math.tan(Math.PI / 4 + phi_n / 2) *
    Math.pow((1 - e_n * Math.sin(phi_n)) / (1 + e_n * Math.sin(phi_n)), e_n / 2)
  );
  const expPart = Math.exp(-n * LI);

  const X_l2e = Xs + c * expPart * Math.sin(n * (lambda_n - lambda0));
  const Y_l2e = Ys - c * expPart * Math.cos(n * (lambda_n - lambda0));

  return { X: X_l2e, Y: Y_l2e };
}

function lambertToDFCI(X_in, Y_in) {
  const X = Math.round(X_in);
  const Y = Math.round(Y_in);
  if (X <= 0 || X >= 1200000 || Y <= 1600000 || Y >= 2700000) {
    return null;
  }

  const ABC = "ABCDEFGHKLMN012345678902468";
  let Ywork = Y - 1600000;

  const X100 = Math.floor(X / 100000);
  const Y100 = Math.floor(Ywork / 100000);
  let dfci = ABC.charAt(X100) + ABC.charAt(Y100 + 1);

  let Xtot = X - X100 * 100000;
  let Ytot = Ywork - Y100 * 100000;
  const X20 = Math.floor(Xtot / 20000);
  const Y20 = Math.floor(Ytot / 20000);
  dfci += ABC.charAt(X20 + 22) + ABC.charAt(Y20 + 22);

  Xtot -= X20 * 20000;
  Ytot -= Y20 * 20000;
  const X2 = Math.floor(Xtot / 2000);
  const Y2 = Math.floor(Ytot / 2000);
  dfci += ABC.charAt(X2) + ABC.charAt(Y2 + 12);

  Xtot -= X2 * 2000;
  Ytot -= Y2 * 2000;
  let Xc;
  if (Xtot > 500 && Xtot < 1500 && Ytot > 500 && Ytot < 1500) Xc = 5;
  else if (Xtot < 1000 && Ytot > 1000) Xc = 1;
  else if (Xtot < 1000 && Ytot < 1000) Xc = 4;
  else if (Xtot > 1000 && Ytot > 1000) Xc = 2;
  else if (Xtot > 1000 && Ytot < 1000) Xc = 3;
  else Xc = 0;

  dfci += "." + Xc;

  return {
    code20km: dfci.substring(0, 4),
    code2km: dfci.substring(0, 6),
    code200m: dfci
  };
}

const coordsDiv = document.getElementById('coords');
let currentToponyme = null;
let currentCommune = null;
let currentDepartement = null;
let reverseGeocodeTimer = null;
let lastMouseLat = null;
let lastMouseLon = null;
let tooltipTimer = null;
let tooltipElement = null;
let lastMouseX = 0;
let lastMouseY = 0;
// Utiliser la même logique que cartoff3.js pour déterminer l'URL de l'API
const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : `${window.location.protocol}//${window.location.hostname}:8000`;

// Créer l'élément info-bulle
function createTooltip() {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.id = 'locationTooltip';
    document.body.appendChild(tooltipElement);
  }
  return tooltipElement;
}

// Afficher l'info-bulle
function showTooltip(x, y) {
  const tooltip = createTooltip();
  let content = '<div class="tooltip-title">📍 Localisation</div>';
  
  if (currentDepartement || currentCommune) {
    if (currentDepartement) {
      content += `<div class="tooltip-line"><strong>Département:</strong> ${currentDepartement}</div>`;
    }
    if (currentCommune) {
      content += `<div class="tooltip-line"><strong>Commune:</strong> ${currentCommune}</div>`;
    }
  } else {
    content += '<div class="tooltip-line">Chargement...</div>';
  }
  
  tooltip.innerHTML = content;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.classList.add('visible');
}

// Masquer l'info-bulle
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.classList.remove('visible');
  }
}

// Programmer l'affichage de l'info-bulle après 2 secondes sans mouvement
function scheduleTooltip(x, y) {
  // Annuler le timer précédent
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
  }
  
  // Masquer l'info-bulle immédiatement si la souris bouge
  hideTooltip();
  
  // Programmer l'affichage après 2 secondes
  tooltipTimer = setTimeout(() => {
    // Vérifier que la souris est toujours au même endroit (à 5px près)
    if (Math.abs(lastMouseX - x) < 5 && Math.abs(lastMouseY - y) < 5) {
      showTooltip(x, y);
    }
  }, 2000);
}

// Fonction pour effectuer le reverse geocoding avec debouncing
function reverseGeocode(lat, lon) {
  // Annuler l'appel précédent s'il existe
  if (reverseGeocodeTimer) {
    clearTimeout(reverseGeocodeTimer);
  }
  
  // Délai de 300ms avant d'appeler l'API (debouncing)
  reverseGeocodeTimer = setTimeout(async () => {
    try {
      const url = `${apiBaseUrl}/api/geographie/reverse-geocode?lat=${lat}&lon=${lon}`;
      console.log('[Reverse Geocoding] Appel API:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('[Reverse Geocoding] Réponse API:', data);
        currentCommune = data.commune ? data.commune.nom : null;
        currentDepartement = data.departement ? data.departement.nom : null;
        console.log('[Reverse Geocoding] Département:', currentDepartement, 'Commune:', currentCommune);
        // Mettre à jour l'affichage seulement si les coordonnées n'ont pas changé
        if (lastMouseLat === lat && lastMouseLon === lon) {
          updateCoordsDisplay();
          // Mettre à jour l'info-bulle si elle est visible
          if (tooltipElement && tooltipElement.classList.contains('visible')) {
            showTooltip(lastMouseX, lastMouseY);
          }
        }
      } else {
        const errorText = await response.text();
        console.warn('[Reverse Geocoding] Erreur HTTP:', response.status, errorText);
        // En cas d'erreur, réinitialiser les valeurs
        currentCommune = null;
        currentDepartement = null;
        if (lastMouseLat === lat && lastMouseLon === lon) {
          updateCoordsDisplay();
        }
      }
    } catch (error) {
      // En cas d'erreur réseau, réinitialiser les valeurs
      console.warn('[Reverse Geocoding] Erreur réseau:', error);
      currentCommune = null;
      currentDepartement = null;
      if (lastMouseLat === lat && lastMouseLon === lon) {
        updateCoordsDisplay();
      }
    }
  }, 300);
}

// Fonction pour mettre à jour l'affichage des coordonnées
function updateCoordsDisplay() {
  if (lastMouseLat === null || lastMouseLon === null) return;
  
  const lat = lastMouseLat, lon = lastMouseLon;
  const utm = latLonToUTM(lat, lon), lambert = latLonToLambert93(lat, lon), dfci = latLonToDFCI(lat, lon);
  const dfciText = dfci === '–' ? '–' : `${dfci.code2km} (${dfci.code200m})`;
  
  let locationInfo = '';
  if (currentDepartement || currentCommune) {
    const parts = [];
    if (currentDepartement) parts.push(`Dépt: ${currentDepartement}`);
    if (currentCommune) parts.push(`Commune: ${currentCommune}`);
    locationInfo = ' | ' + parts.join(' - ');
  }
  
  coordsDiv.innerHTML = `Lat:${lat.toFixed(5)}, Lon:${lon.toFixed(5)} | Zoom:${map.getZoom()}`
    + ` | UTM:${utm.easting},${utm.northing} (Zone ${utm.zoneNumber})`
    + ` | DFCI:${dfciText} | Lambert93:${lambert}` 
    + (currentToponyme ? ' | ' + currentToponyme : '')
    + locationInfo;
}

map.on('mousemove', e=>{
  const lat=e.latlng.lat, lon=e.latlng.lng;
  lastMouseLat = lat;
  lastMouseLon = lon;
  
  // Récupérer la position de la souris en pixels
  const containerPoint = map.mouseEventToContainerPoint(e.originalEvent);
  lastMouseX = containerPoint.x;
  lastMouseY = containerPoint.y;
  
  const utm=latLonToUTM(lat,lon), lambert=latLonToLambert93(lat,lon), dfci=latLonToDFCI(lat,lon);
  const dfciText = dfci === '–' ? '–' : `${dfci.code2km} (${dfci.code200m})`;
  
  let locationInfo = '';
  if (currentDepartement || currentCommune) {
    const parts = [];
    if (currentDepartement) parts.push(`Dépt: ${currentDepartement}`);
    if (currentCommune) parts.push(`Commune: ${currentCommune}`);
    locationInfo = ' | ' + parts.join(' - ');
  }
  
  coordsDiv.innerHTML=`Lat:${lat.toFixed(5)}, Lon:${lon.toFixed(5)} | Zoom:${map.getZoom()}`
    +` | UTM:${utm.easting},${utm.northing} (Zone ${utm.zoneNumber})`
    +` | DFCI:${dfciText} | Lambert93:${lambert}`+(currentToponyme?' | '+currentToponyme:'')
    +locationInfo;
  
  // Appeler le reverse geocoding avec debouncing
  reverseGeocode(lat, lon);
  
  // Programmer l'affichage de l'info-bulle après 2 secondes sans mouvement
  scheduleTooltip(containerPoint.x, containerPoint.y);
});

// Masquer l'info-bulle quand la souris quitte la carte
map.on('mouseout', () => {
  hideTooltip();
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
  }
});

// =======================
// Icônes
// =======================
const icons = {
  "Point de Repère routier":L.icon({iconUrl:'images/PR.png',iconSize:[32,32],iconAnchor:[16,32],popupAnchor:[0,-32]}),
  "Meshtastic":L.icon({iconUrl:'images/cartoff-meshtastic.png',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]}),
  "Meshtastic_History":L.icon({iconUrl:'images/meshtastic_deconnecte.png',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]}),
  "Objet":L.icon({iconUrl:'images/objet.png',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]}),
  "Route": L.icon({iconUrl:'images/objet.png',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]}),
  "SITAC": L.icon({iconUrl:'images/CHANTIER.png',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]}),
  "MéSHTASTIC_CUSTOM": L.icon({
    iconUrl: 'images/cartoff-meshtastic.png',
    iconSize: [28,28],
    iconAnchor: [14,14],
    popupAnchor: [0,-14]
  })
};
// Alias pour la légende personnalisée
icons["Gaulix/meshtastic"] = icons.Meshtastic;

// =======================
// Layers GeoJSON
// =======================
const layers = {};
const layerOptions = {};
const communesLoireIndex = {};
const communesCorseIndex = {};
let highlightLayer = null, highlightCorseLayer = null;

// =======================
// GeoJSON fichiers
// =======================
const geojsonFiles={
  departement:[
    {name:"Point de Repère routier", file:"geojson/D42/PR_Routier.geojson", style:{color:"blue", weight:3}, minZoom:15, noAutoZoom:true},
    {name:"Communes de La Loire", file:"geojson/D42/communes-42-loire.geojson", style:{color:"#A0522D", weight:2, dashArray:"4 4", fill:false}, isCommuneList:true},
    {name:"Habitation", file:"geojson/D42/Zone_habitation.geojson", style:{color:"darkred", weight:3}, minZoom:15, noAutoZoom:true},
    {name:"Lieu dit :: non habitable", file:"geojson/D42/Lieu_dit_non_habite.geojson", style:{color:"darkred", weight:3}, minZoom:15, noAutoZoom:true},
    {name:"Lieu dit :: habitable", file:"geojson/D42/Toponyme.geojson", style:{color:"darkred", weight:3}, minZoom:15, noAutoZoom:true},
    {name:"Routes", file:"geojson/D42/routes.geojson", style:{color:"orange", weight:3}, minZoom:12, noAutoZoom:true, isRoute:true}
  ],
  risks:[
    {name:"PPI - Onde de submersion du barrage de Granjean", file:"geojson/PPI_Onde_de_submersion_du_barrage_de_granjean.geojson", style:{color:"darkblue", weight:2, fillColor:"blue", fillOpacity:0.3}, noAutoZoom:false}
  ],
  AASC:[
  ],
  Corse:[
    {name:"Communes Corse", file:"geojson/Corse/communes-corse.geojson", style:{color:"#A0522D", weight:2, dashArray:"4 4", fill:false}, isCommuneList:true},
    {name:"TKNet", file:"geojson/Corse/TKNET.geojson", style:{color:"green", weight:2, dashArray:"3 3"}, minZoom:10}
  ]
};

// =======================
// Fonctions helper
// =======================
const errorDiv = document.getElementById('errorMessages');
let errorTimer = null;
function showMessage(msg, seconds=4){
  if(errorTimer) { clearTimeout(errorTimer); errorTimer=null; }
  errorDiv.textContent = msg;
  errorTimer = setTimeout(()=>{ errorDiv.textContent=''; errorTimer=null; }, seconds*1000);
}

// =======================
// Chargement GeoJSON et création checkboxes
// =======================
async function loadGeoJSONLayer(item){
  try{
    const res = await fetch(item.file);
    if(!res.ok) throw new Error("Impossible de charger "+item.file);
    const geojson = await res.json();
    // Convertir les MultiPoints en Points individuels pour un traitement uniforme
    if(geojson.features){
      geojson.features = geojson.features.flatMap(feature => {
        if(feature.geometry && feature.geometry.type === 'MultiPoint'){
          // Créer une feature Point pour chaque coordonnée du MultiPoint
          return feature.geometry.coordinates.map(coord => ({
            type: 'Feature',
            properties: feature.properties,
            geometry: {
              type: 'Point',
              coordinates: coord
            }
          }));
        }
        return [feature];
      });
    }
    
    const layer = L.geoJSON(geojson, {
      style: item.style,
      pointToLayer: (feature, latlng) => {
          // Maintenant tous les points sont de type Point après conversion
          if(feature.geometry && feature.geometry.type !== 'Point') return undefined;
          if(item.name==="Point de Repère routier") return L.marker(latlng,{icon:icons["Point de Repère routier"]});
          const icon = icons[item.name] || undefined;
          return icon ? L.marker(latlng,{icon}) : L.marker(latlng);
      },
      onEachFeature: (feature, l) => {
        if(item.isCommuneList){
          const index = item.name==="Communes de La Loire"? communesLoireIndex: communesCorseIndex;
          index[feature.properties.nom] = feature;
          const select=document.getElementById(item.name==="Communes de La Loire"?"communeSelect":"communeCorseSelect");
          const opt=document.createElement("option"); opt.value=feature.properties.nom; opt.textContent=feature.properties.nom; select.appendChild(opt);
          l.on('mouseover',()=> currentToponyme=feature.properties.nom);
          l.on('mouseout',()=> currentToponyme=null);
        }

        // =======================
        // Popups et tooltips
        // =======================
        let popupContent = '';
        if(item.name==="Routes") popupContent = `Route: ${feature.properties.voie||'-'}; Type: ${feature.properties.nature||'-'}`;
        else if(item.name==="Point de Repère routier") popupContent = `PR: ${feature.properties.pr||'-'}`;
        else {
          for(const key in feature.properties) popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
        }
        if(l.bindPopup) l.bindPopup(popupContent);
        if(l.bindTooltip) l.bindTooltip(popupContent,{permanent:false, direction:'top'});
      }
    });
    layers[item.name] = layer;
    layerOptions[item.name] = { minZoom: item.minZoom || null, noAutoZoom: !!item.noAutoZoom };
    return layer;
  }catch(err){ console.error(err); showMessage("Erreur chargement: "+item.file); return null; }
}

// =======================
// Add Checkbox
// =======================
function addCheckbox(div,name,layer,noAutoZoom){
  const id="chk_"+name.replace(/\s+/g,'_');
  if (!window.createToggleSwitch) {
    // Fallback si la fonction n'est pas disponible
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
  }
  const { label, checkbox } = window.createToggleSwitch(id, name, false);
  checkbox.addEventListener("change", e=>{
    if(e.target.checked){
      const opt = layerOptions[name] || {};
      if(opt.minZoom && map.getZoom() < opt.minZoom){
        showMessage(`Zoom insuffisant pour "${name}" (min: ${opt.minZoom}). Rezoomez pour afficher.`, 5);
        // Ne pas cocher la checkbox si zoom insuffisant
        e.target.checked = false;
      } else {
        layer.addTo(map);
        if(!noAutoZoom && layer.getBounds) map.fitBounds(layer.getBounds(),{padding:[20,20]});
      }
    } else { 
      if(map.hasLayer(layer)) map.removeLayer(layer); 
    }
    updateLegend();
  });
  div.appendChild(label);
}

// =======================
// Setup Layers
// =======================
async function setupLayers(){
  for(const [cat,items] of Object.entries(geojsonFiles)){
    const div=document.getElementById(
      cat==="departement"?"departementLayers":
      cat==="risks"?"riskLayers":
      cat==="AASC"?"AASCLayers":"CorseLayers"
    );
    for(const item of items){
      const layer = await loadGeoJSONLayer(item);
      if(layer) addCheckbox(div,item.name,layer,item.noAutoZoom);
    }
  }

  document.getElementById("communeSelect").addEventListener("change", e=>{
    const nom=e.target.value; if(!nom||!communesLoireIndex[nom]) return;
    if(highlightLayer) map.removeLayer(highlightLayer);
    highlightLayer=L.geoJSON(communesLoireIndex[nom],{style:{color:"blue",weight:3,fillOpacity:0.3}}).addTo(map);
    map.fitBounds(highlightLayer.getBounds(),{padding:[20,20]});
    setTimeout(()=>{ if(highlightLayer) { map.removeLayer(highlightLayer); highlightLayer=null; } },8000);
  });

  document.getElementById("communeCorseSelect").addEventListener("change", e=>{
    const nom=e.target.value; if(!nom||!communesCorseIndex[nom]) return;
    if(highlightCorseLayer) map.removeLayer(highlightCorseLayer);
    highlightCorseLayer=L.geoJSON(communesCorseIndex[nom],{style:{color:"blue",weight:3,fillOpacity:0.3}}).addTo(map);
    map.fitBounds(highlightCorseLayer.getBounds(),{padding:[20,20]});
    setTimeout(()=>{ if(highlightCorseLayer){ map.removeLayer(highlightCorseLayer); highlightCorseLayer=null; } },8000);
  });
}
setupLayers();

// =======================
// Gestion du zoom pour les couches avec minZoom
// =======================
const layersMinZoom15 = ["Point de Repère routier", "Lieu dit :: non habitable", "Lieu dit :: habitable"];
const layersMinZoom10 = [];

map.on('zoomend', () => {
  const currentZoom = map.getZoom();
  
  // Gestion des couches minZoom:15
  layersMinZoom15.forEach(layerName => {
    const checkboxId = "chk_" + layerName.replace(/\s+/g, '_');
    const checkbox = document.getElementById(checkboxId);
    const layer = layers[layerName];
    
    if (checkbox && layer) {
      // Si la checkbox est cochée
      if (checkbox.checked) {
        if (currentZoom < 15) {
          // Masquer la couche si zoom < 15
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        } else {
          // Afficher la couche si zoom >= 15
          if (!map.hasLayer(layer)) {
            layer.addTo(map);
          }
        }
        updateLegend();
      }
    }
  });
  
  // Gestion des couches minZoom:10
  layersMinZoom10.forEach(layerName => {
    const checkboxId = "chk_" + layerName.replace(/\s+/g, '_');
    const checkbox = document.getElementById(checkboxId);
    const layer = layers[layerName];
    
    if (checkbox && layer) {
      // Si la checkbox est cochée
      if (checkbox.checked) {
        if (currentZoom < 10) {
          // Masquer la couche si zoom < 10
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        } else {
          // Afficher la couche si zoom >= 10
          if (!map.hasLayer(layer)) {
            layer.addTo(map);
          }
        }
        updateLegend();
      }
    }
  });
});

// =======================
// Légende dynamique
// =======================
function updateLegend(){
  const legendDiv=document.getElementById("legend");
  const activeLayers=Object.keys(layers).filter(name=>map.hasLayer(layers[name]));
  if(document.getElementById('showMeshtastic').checked) activeLayers.push("Gaulix/meshtastic");
  if(activeLayers.length===0){ 
      legendDiv.innerHTML="<b>Légende :</b><br>– aucun calque actif –"; 
      return; 
  }
  let html="<b>Légende :</b><br>";
  activeLayers.forEach(name=>{
    if(icons[name]){
      html+=`<div style="display:flex; align-items:center; margin-bottom:4px;">
                <img src="${icons[name].options.iconUrl}" style="width:20px; height:20px; margin-right:6px;">
                ${name}
             </div>`;
    } else {
      const color=layers[name].options?.style?.color || (layerOptions[name]?.color || '#000');
      const weight=(layers[name].options?.style?.weight) || 3;
      html+=`<div style="display:flex; align-items:center; margin-bottom:4px;">
                <span style="display:inline-block; width:20px; height:${weight}px; background:${color}; margin-right:6px; border:1px solid ${document.body.classList.contains('dark') ? '#222':'#000'};"></span>
                ${name}
             </div>`;
    }
  });
  const historyCount = historyNodesSet.size;
  const liveOnlyCount = liveNodesSet.size;
  
  // Compter le nombre total de positions par statut
  const totalHistoricalPositions = meshtasticPositions.filter(pos => pos.status === 'historical').length;
  const totalLivePositions = meshtasticPositions.filter(pos => pos.status === 'live').length;
  const totalPositions = meshtasticPositions.length;
  
  if(historyCount>0 && icons["Meshtastic_History"]){
    html+=`<div style="display:flex; align-items:center; margin-bottom:4px;">
              <img src="${icons["Meshtastic_History"].options.iconUrl}" style="width:20px; height:20px; margin-right:6px;">
              Meshtastic (historique) : ${historyCount} nœud${historyCount > 1 ? 's' : ''}${totalHistoricalPositions > historyCount ? `, ${totalHistoricalPositions} position${totalHistoricalPositions > 1 ? 's' : ''}` : ''}
           </div>`;
  }
  if(liveOnlyCount>0 && icons["Meshtastic"]){
    html+=`<div style="display:flex; align-items:center; margin-bottom:4px;">
              <img src="${icons["Meshtastic"].options.iconUrl}" style="width:20px; height:20px; margin-right:6px;">
              Meshtastic (live) : ${liveOnlyCount} nœud${liveOnlyCount > 1 ? 's' : ''}${totalLivePositions > liveOnlyCount ? `, ${totalLivePositions} position${totalLivePositions > 1 ? 's' : ''}` : ''}
           </div>`;
  }
  
  // Afficher le total si on a des positions Meshtastic
  if(totalPositions > 0){
    html+=`<div style="margin-top:4px; padding-top:4px; border-top:1px solid ${document.body.classList.contains('dark') ? '#444':'#ccc'}; font-size:0.9em; color:${document.body.classList.contains('dark') ? '#aaa':'#666'};">
              Total Meshtastic : ${totalPositions} position${totalPositions > 1 ? 's' : ''}
           </div>`;
  }
  if (layers["SITAC"] && map.hasLayer(layers["SITAC"])) {
    const icon = icons["SITAC"] || icons["Meshtastic_History"];
    const types = Array.from(window.__manualTypes || []).join(', ') || '—';
    html+=`<div style="display:flex; align-items:flex-start; margin-bottom:4px;">
              <img src="${icon.options.iconUrl}" style="width:20px; height:20px; margin-right:6px;">
              <span>
                <b>SITAC</b><br>
                ${types}
              </span>
           </div>`;
  }
  if (layers["SAR"] && map.hasLayer(layers["SAR"])) {
    const icon = icons["SAR"] || icons["SITAC"] || icons["Meshtastic"];
    const types = Array.from(window.__sarTypes || []).join(', ') || '—';
    html+=`<div style="display:flex; align-items:flex-start; margin-bottom:4px;">
              <img src="${icon.options?.iconUrl || 'images/objet.png'}" style="width:20px; height:20px; margin-right:6px;">
              <span>
                <b>SAR</b><br>
                ${types}
              </span>
           </div>`;
  }
  legendDiv.innerHTML = html;
}

// =======================
// Version flottante
// =======================
window.currentVersion = "V3.00-Dev"; // Version par défaut (exposée globalement)

// Fonction pour obtenir l'élément versionBox de manière sécurisée
function getVersionBox() {
  return document.getElementById("versionFloating");
}

// Fonction pour mettre à jour la version flottante (exposée globalement)
window.updateVersionBox = function(){ 
  const versionBox = getVersionBox();
  if (!versionBox) {
    return;
  }
  const d=new Date(); 
  // Utiliser window.currentVersion qui sera mis à jour par version-loader.js
  // Protection: ne jamais utiliser "V2.0 Beta" ou une version inférieure
  let version = window.currentVersion || "V3.00-Dev";
  
  // Protection contre les régressions de version
  if (version.includes("V2.0") || version.includes("2.0 Beta") || version.includes("Beta")) {
    console.warn('⚠️ Tentative d\'utiliser une ancienne version détectée, utilisation de V3.00-Dev');
    version = "V3.00-Dev";
    window.currentVersion = version;
  }
  
  const text = "cartoff - "+version+" | "+d.toLocaleDateString()+" "+d.toLocaleTimeString().slice(0,5);
  
  // Vérifier que le texte ne contient pas "V2.0 Beta" avant de le définir
  if (text.includes("V2.0") || text.includes("2.0 Beta")) {
    console.error('❌ ERREUR: Tentative d\'afficher V2.0 Beta, utilisation de V3.00-Dev');
    versionBox.textContent = "cartoff - V3.00-Dev | "+d.toLocaleDateString()+" "+d.toLocaleTimeString().slice(0,5);
    window.currentVersion = "V3.00-Dev";
  } else {
    versionBox.textContent = text;
  }
}

// Initialiser après le chargement du DOM et des scripts
function initVersionBox() {
  const versionBox = getVersionBox();
  if (!versionBox) {
    // Réessayer après un court délai si l'élément n'est pas encore disponible
    setTimeout(initVersionBox, 100);
    return;
  }
  
  // Attendre que version-loader.js ait chargé la version
  (async function() {
    // Attendre que loadVersion soit disponible (depuis version-loader.js)
    let attempts = 0;
    while (typeof window.loadVersion !== 'function' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Charger la version depuis version-loader.js si disponible
    if (typeof window.loadVersion === 'function') {
      const version = await window.loadVersion();
      window.currentVersion = version;
      console.log('✅ cartoff.js: Version chargée via version-loader:', version);
    } else {
      // Fallback: charger directement depuis JSON
      try {
        const response = await fetch('json/version.json');
        if (response.ok) {
          const data = await response.json();
          if (data.Version) {
            window.currentVersion = data.Version;
            console.log('✅ cartoff.js: Version chargée directement depuis JSON:', window.currentVersion);
          }
        }
      } catch (error) {
        console.warn('⚠️ cartoff.js: Impossible de charger la version:', error);
      }
    }
    
    // Initialiser la mise à jour périodique
    window.updateVersionBox();
    setInterval(window.updateVersionBox, 1000);
  })();
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersionBox);
} else {
  // Attendre un peu pour que version-loader.js soit chargé
  setTimeout(initVersionBox, 100);
}

let isDragging=false,offsetX=0,offsetY=0;
// Vérifier que versionBox existe avant d'ajouter l'event listener
const versionBoxElement = getVersionBox();
if (versionBoxElement) {
  versionBoxElement.addEventListener("mousedown",e=>{
      isDragging=true;
      const rect=versionBoxElement.getBoundingClientRect();
      offsetX=e.clientX-rect.left;
      offsetY=e.clientY-rect.top;
  });
}
document.addEventListener("mouseup",()=>isDragging=false);
document.addEventListener("mousemove",e=>{
    if(isDragging){
        const versionBoxElement = getVersionBox();
        if (versionBoxElement) {
            versionBoxElement.style.right="auto";
            versionBoxElement.style.bottom="auto";
            versionBoxElement.style.left=(e.clientX-offsetX)+"px";
            versionBoxElement.style.top=(e.clientY-offsetY)+"px";
            versionBoxElement.style.transform="none";
        }
    }
});

// =======================
// Modale "À propos"
// =======================
const changelogHTML = `
<div style="text-align: left; line-height: 1.6;">
  <h3 style="color: #0066cc; margin-top: 0;">GerMaCrise V3 - Cartographie</h3>
  
  <h4 style="color: #28a745; margin-top: 20px;">🗺️ Intégration PostGIS</h4>
  <p style="margin: 10px 0;">
    Cette application utilise <strong>PostgreSQL/PostGIS</strong> pour la gestion et l'affichage des données géographiques.
  </p>
  
  <h5 style="margin-top: 15px; color: #333;">Calques disponibles depuis PostGIS :</h5>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li><strong>PostGIS :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>Communes (PG) - Affichage à partir du zoom 13</li>
        <li>Départements (PG) - Affichage avec zoom automatique</li>
      </ul>
    </li>
    <li><strong>Carroyage :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>DFCI 100x100 (PG) - Zoom ≥ 5</li>
        <li>DFCI 20x20 (PG) - Zoom 10-13</li>
        <li>DFCI 2x2 (PG) - Zoom 12-15</li>
        <li>DFCI 1km (PG) - Zoom ≥ 14</li>
      </ul>
    </li>
    <li><strong>SDIS 42 :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>Centre d'Incendie et de Secours (PG)</li>
      </ul>
    </li>
    <li><strong>Gestion des risques :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>Ets SEVESO (PG)</li>
        <li>CIS (PG)</li>
      </ul>
    </li>
    <li><strong>Associations Agréées de Sécurité Civile :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>POI AASC (PG)</li>
      </ul>
    </li>
    <li><strong>Département de la Loire :</strong>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>CD2E (PG)</li>
      </ul>
    </li>
  </ul>
  
  <h4 style="color: #17a2b8; margin-top: 20px;">🔍 Recherche Géographique</h4>
  <p style="margin: 10px 0;">
    Recherche et zoom automatique par <strong>département</strong>, <strong>commune</strong>, <strong>rue</strong> et <strong>numéro</strong>.
  </p>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>Recherche hiérarchique : Département → Commune → Rue → Numéro</li>
    <li>Zoom + centrage automatique avec animation fluide</li>
    <li>Intégration <strong>BAN (Base Adresse Nationale)</strong> pour les adresses</li>
    <li>Marqueurs temporaires pour visualiser les sélections</li>
    <li>Affichage des coordonnées multi-système (WGS84, Lambert 93, UTM, DFCI)</li>
  </ul>
  
  <h4 style="color: #6c757d; margin-top: 20px;">⚙️ Fonctionnalités</h4>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>Chargement dynamique des données depuis la base PostGIS</li>
    <li>Affichage conditionnel selon le niveau de zoom</li>
    <li>Zoom automatique sur l'étendue des couches</li>
    <li>Popups et tooltips informatifs</li>
    <li>Coordonnées multi-système (WGS84, Lambert 93, UTM, DFCI)</li>
    <li>Fond de carte PMTiles optimisé pour des performances fluides</li>
    <li>Export PDF de la carte</li>
    <li>Intégration Meshtastic pour le suivi en temps réel</li>
  </ul>
  
  <h4 style="color: #6c757d; margin-top: 20px;">📋 Version</h4>
  <p style="margin: 10px 0;">
    <strong>Version :</strong> V3.00-Dev<br>
    <strong>Date :</strong> Janvier 2025<br>
    <strong>Base de données :</strong> PostgreSQL + PostGIS<br>
    <strong>Fond de carte :</strong> PMTiles (Protomaps)
  </p>
  
  <h4 style="color: #6c757d; margin-top: 20px;">📝 Dernières mises à jour</h4>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>✅ Recherche géographique par département/commune/rue/numéro</li>
    <li>✅ Zoom automatique avec animation sur toutes les sélections</li>
    <li>✅ Intégration BAN pour la recherche d'adresses</li>
    <li>✅ Optimisation du chargement PMTiles</li>
    <li>✅ Amélioration des performances de rendu</li>
  </ul>
  
  <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666;">
    <strong>Sources des adresses :</strong> BAN plus IGN Juin 2025
  </p>
</div>`;

// Initialisation de la modale "À propos"
// Log immédiat pour vérifier que le code est exécuté
console.log('🔍🔍🔍 SCRIPT CART OFF.JS CHARGÉ - INITIALISATION MODALE À PROPOS 🔍🔍🔍');

function initAboutModal() {
  console.log('🔍 initAboutModal appelée');
  const aboutContent = document.getElementById('aboutContent');
  const aboutModal = document.getElementById("aboutModal");
  const aboutBtn = document.getElementById("aboutBtn");
  const closeBtn = document.querySelector(".modal-close");
  
  console.log('🔍 Éléments trouvés:', {
    aboutContent: !!aboutContent,
    aboutModal: !!aboutModal,
    aboutBtn: !!aboutBtn,
    closeBtn: !!closeBtn
  });
  
  if (!aboutContent || !aboutModal || !aboutBtn || !closeBtn) {
    console.warn('⚠️ Éléments de la modale "À propos" non trouvés, réessai dans 100ms...');
    setTimeout(initAboutModal, 100);
    return;
  }
  
  // Injecter le contenu HTML
  aboutContent.innerHTML = changelogHTML;
  console.log('🔍 Contenu HTML injecté');
  
  // Configurer les événements
  aboutBtn.onclick = () => {
    console.log('🔵 Bouton "À propos" cliqué');
    console.log('🔵 aboutModal.style.display avant:', aboutModal.style.display);
    aboutModal.style.display = "flex";
    console.log('🔵 aboutModal.style.display après:', aboutModal.style.display);
  };
  
  closeBtn.onclick = () => {
    console.log('🔴 Fermeture de la modale');
    aboutModal.style.display = "none";
  };
  
  // Utiliser addEventListener pour ne pas écraser d'autres gestionnaires
  aboutModal.addEventListener('click', (e) => {
    if (e.target == aboutModal) {
      aboutModal.style.display = "none";
    }
  });
  
  console.log('✅ Modale "À propos" initialisée avec succès');
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
  console.log('🔍 DOM en cours de chargement, attente de DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DOMContentLoaded déclenché, initialisation de la modale...');
    initAboutModal();
  });
} else {
  console.log('🔍 DOM déjà chargé, initialisation immédiate...');
  initAboutModal();
}

// =======================
// MQTT / Meshtastic (Gaulix)
// Initialisation après que le DOM soit chargé
// (MODIFIÉ : Ajout du chargement dynamique json/mqtt.json)
// =======================
const MQTT_STATUS_INFO = {
    disconnected: { color: '#dc3545', title: 'MQTT déconnecté' },
    connecting:   { color: '#ffc107', title: 'Connexion MQTT en cours...' },
    connected:    { color: '#28a745', title: 'MQTT connecté' },
    unavailable:  { color: '#dc3545', title: 'MQTT non disponible' },
    offline:      { color: '#dc3545', title: 'MQTT hors ligne' },
    error:        { color: '#dc3545', title: 'Erreur MQTT' },
    proxy_connected:   { color: '#28a745', title: 'Proxy WebSocket connecté' },
    proxy_error:       { color: '#dc3545', title: 'Erreur proxy WebSocket' },
    proxy_disconnected:{ color: '#dc3545', title: 'Proxy WebSocket déconnecté' }
};

let mqttStatusSnapshot = {
    state: 'disconnected',
    color: MQTT_STATUS_INFO.disconnected.color,
    title: MQTT_STATUS_INFO.disconnected.title,
    updatedAt: Date.now()
};

function broadcastMqttStatus(snapshot){
    try { localStorage.setItem('mqttStatus', JSON.stringify(snapshot)); } catch(e) {}
}

function applyMqttLed(snapshot){
    if (!mqttLed) return;
    mqttLed.style.background = snapshot.color;
    mqttLed.title = snapshot.title;
}

function setMqttStatus(state, overrideTitle, broadcast = true){
    const info = MQTT_STATUS_INFO[state] || MQTT_STATUS_INFO.error;
    const snapshot = {
        state,
        color: info.color,
        title: overrideTitle || info.title,
        updatedAt: Date.now()
    };
    mqttStatusSnapshot = snapshot;
    applyMqttLed(snapshot);
    if (broadcast) broadcastMqttStatus(snapshot);
}

function flashMqttActivity(){
    if (!mqttLed) return;
    const previousSnapshot = mqttStatusSnapshot;
    mqttLed.style.background = '#32ff32';
    setTimeout(()=>{
        if (mqttStatusSnapshot === previousSnapshot) {
            applyMqttLed(previousSnapshot);
        } else {
            applyMqttLed(mqttStatusSnapshot);
        }
    }, 500);
}

broadcastMqttStatus(mqttStatusSnapshot);

let mqttLed, showMeshtasticCheckbox, meshtasticMarkers = {};

let mqttClient = null;
let mqttConnecting = false;

async function getMqttConfig() {
    try {
        const res = await fetch('json/mqtt.json?_=' + Date.now());
        if (!res.ok) throw new Error('Erreur chargement configuration mqtt.json');
        const config = await res.json();
        if (!config.enabled) throw new Error('MQTT désactivé');
        return config;
    } catch (e) {
        console.warn('[mqtt] Impossible de charger json/mqtt.json :', e);
        return null;
    }
}

function buildMqttUrl(broker){
    if(broker.url) return broker.url;
    if(broker.scheme && broker.host && broker.port){
        return `${broker.scheme}://${broker.host}:${broker.port}${broker.path||''}`;
    }
    // fallback
    return null;
}

// Initialiser MQTT après chargement du DOM
function initMQTT() {
    console.log('[Meshtastic] Initialisation de initMQTT()');
    mqttLed = document.getElementById("mqttLed");
    showMeshtasticCheckbox = document.getElementById("showMeshtastic");
    meshtasticMarkers = {};
    
    if (!mqttLed || !showMeshtasticCheckbox) {
        console.warn('⚠️ Éléments MQTT non trouvés, désactivation du proxy');
        return;
    }
    
    // Initialisation : LED rouge par défaut
    setMqttStatus('disconnected');
    
    // Gérer le changement de la checkbox
    showMeshtasticCheckbox.addEventListener('change', () => {
        if (showMeshtasticCheckbox.checked) {
            if (!mqttClient || !mqttClient.connected) {
                connectMQTT();
            } else {
                Object.values(meshtasticMarkers).forEach(m => m.addTo(map));
            }
        } else {
            Object.values(meshtasticMarkers).forEach(m => map.removeLayer(m));
        }
        if (typeof updateLegend === 'function') updateLegend();
    });

    console.log('[Meshtastic] Chargement des tracés et de l\'historique...');
    loadMeshtasticTrails()
      .catch(err => {
        console.warn('[Meshtastic] Chargement tracés échoué:', err);
      })
      .then(() => {
        console.log('[Meshtastic] Chargement de l\'historique...');
        return loadMeshtasticHistory();
      })
      .finally(() => {
        console.log('[Meshtastic] Chargement terminé, initialisation des contrôles...');
        // Par défaut, Meshtastic est désélectionné (pas d'activation automatique)
        // Les utilisateurs doivent cocher manuellement la checkbox pour afficher les positions
        // Démarrer la vérification périodique des nœuds inactifs
        console.log('[Meshtastic] Démarrage de la vérification périodique...');
        startHistoryCheckInterval();
      });
}

// Fonction pour connecter au broker MQTT
async function connectMQTT() {
    if (!mqttLed || !showMeshtasticCheckbox) {
        console.warn('⚠️ MQTT non initialisé');
        return;
    }
    if (typeof mqtt === 'undefined' || !mqtt) {
        console.warn('⚠️ Bibliothèque MQTT non chargée');
        setMqttStatus('unavailable');
        return;
    }
    if (mqttClient && (mqttClient.connected || mqttConnecting)) {
        console.log('MQTT déjà connecté ou en cours de connexion');
        return;
    }
    if (mqttClient) {
        try {
            mqttClient.end();
        } catch(e) {}
    }
    mqttConnecting = true;
    setMqttStatus('connecting');
    console.log('🔄 Tentative de connexion MQTT...');
    // Nouveau : tente en priorité avec la config mqtt.json
    const conf = await getMqttConfig();
    if (conf && conf.broker) {
        try {
            const url = buildMqttUrl(conf.broker);
            if (!url) throw 'URL MQTT invalide ou incomplète dans le JSON.';
            const options = {
                username: conf.auth?.username || undefined,
                password: conf.auth?.password || undefined,
                reconnectPeriod: 5000,
                connectTimeout: 10000,
                clientId: 'cartoff_' + Math.random().toString(16).substr(2, 8)
            };
            mqttClient = mqtt.connect(url, options);

            mqttClient.on('connect', () => {
                console.log('✅ MQTT connecté ! URL:', url);
                setMqttStatus('connected');
                mqttConnecting = false;
                // Abonnement
                let topics = [];
                if (conf.broker.subscriptions) {
                    if (typeof conf.broker.subscriptions === 'string') topics = [conf.broker.subscriptions];
                    else if(Array.isArray(conf.broker.subscriptions)) topics = conf.broker.subscriptions;
                }
                if(topics.length===0) topics = ['meshtastic/#','msh/#','msh/+/+/json/#'];
                topics.forEach(t => {
                    mqttClient.subscribe(t, { qos: 0 }, (err) => {
                        if (err) {
                            console.error('❌ Erreur subscription MQTT sur', t, err);
                        } else {
                            console.log('✅ Abonné au topic', t);
                        }
                    });
                });
            });
            mqttClient.on('close', () => {
                console.log('⚠️ MQTT fermé');
                setMqttStatus('disconnected');
                mqttConnecting = false;
            });
            mqttClient.on('offline', () => {
                console.log('⚠️ MQTT hors ligne');
                setMqttStatus('offline');
            });
            mqttClient.on('error', (err) => {
                console.error('❌ Erreur MQTT:', err);
                setMqttStatus('error', 'Erreur: ' + err.message);
                mqttConnecting = false;
                if (mqttClient) {
                    try { mqttClient.end(); } catch(e) {}
                    mqttClient = null;
                }
                // Fallback auto : si config échoue, tente la liste d'origine
                fallbackConnectMQTT();
            });
            mqttClient.on('message', (topic, message) => {
                if (!showMeshtasticCheckbox.checked) return;
                handleMqttMessage(topic, message);
            });
            return;
        } catch(e) {
            console.error('[MQTT CONF] Erreur de connexion MQTT via JSON:', e);
            // Fallback direct
            fallbackConnectMQTT();
            return;
        }
    } else {
        // Si pas de config ou erreur : fallback
        fallbackConnectMQTT();
        return;
    }
}
// Fallback : ancien essai multi server/urls
function fallbackConnectMQTT() {
    // ... tout le code qui gère la liste urls[] et les tryConnect() comme avant (à garder ici, après le nouveau bloc)
    // Copie ton bloc d'origine ou adapte si nécessaire...
    const urls = [
        'ws://localhost:8000/mqtt', // <--- Proxy WS serveur local prioritaire
        'ws://127.0.0.1:8000/mqtt',
        'ws://localhost:9042/mqtt', // WebSocket Mosquitto direct
        'ws://127.0.0.1:9042/mqtt',
        'ws://localhost:8765',
        'ws://127.0.0.1:8765',
        'wss://mqtt.gaulix.fr:8084/mqtt',
        'wss://mqtt.gaulix.fr:8084/',
        'wss://gaulix.fr:8084/mqtt',
        'wss://gaulix.fr:8084/',
        'ws://mqtt.gaulix.fr:8083/mqtt',
        'ws://mqtt.gaulix.fr:8083/',
        'ws://mqtt.gaulix.fr:1883'
    ];
    let urlIndex = 0;
    function tryConnect() {
        if (urlIndex >= urls.length) {
            console.error('❌ Toutes les tentatives de connexion ont échoué');
            setMqttStatus('error', 'Connexion échouée');
            mqttConnecting = false;
            return;
        }
        const url = urls[urlIndex];
        console.log(`🔄 Tentative connexion: ${url}`);
        try {
            const connectOptions = (url.startsWith('ws://localhost') || url.startsWith('ws://127.0.0.1'))
                ? {
                    reconnectPeriod: 5000,
                    connectTimeout: 10000,
                    clientId: 'cartoff_' + Math.random().toString(16).substr(2, 8)
                }
                : {
                    username: 'bridge_terrain',
                    password: 'bridge_terrain',
                    reconnectPeriod: 5000,
                    connectTimeout: 10000,
                    clientId: 'cartoff_' + Math.random().toString(16).substr(2, 8)
                };
            mqttClient = mqtt.connect(url, connectOptions);
            mqttClient.on('connect', () => {
                console.log('✅ MQTT connecté ! URL:', url);
                setMqttStatus('connected');
                mqttConnecting = false;
                const topics = ['meshtastic/#', 'msh/#', 'msh/+/+/json/#'];
                topics.forEach(t => {
                    mqttClient.subscribe(t, { qos: 0 }, (err) => {
                        if (err) {
                            console.error('❌ Erreur subscription MQTT sur', t, err);
                        } else {
                            console.log('✅ Abonné au topic', t);
                        }
                    });
                });
            });
            mqttClient.on('close', () => {
                console.log('⚠️ MQTT fermé');
                setMqttStatus('disconnected');
                mqttConnecting = false;
            });
            mqttClient.on('offline', () => {
                console.log('⚠️ MQTT hors ligne');
                setMqttStatus('offline');
            });
            mqttClient.on('error', (err) => {
                console.error('❌ Erreur MQTT:', err);
                setMqttStatus('error', 'Erreur: ' + err.message);
                mqttConnecting = false;
                if (mqttClient) {
                    try { mqttClient.end(); } catch(e) {}
                    mqttClient = null;
                }
                urlIndex++;
                setTimeout(tryConnect, 2000);
            });
            mqttClient.on('message', (topic, message) => {
                if (!showMeshtasticCheckbox.checked) return;
                handleMqttMessage(topic, message);
            });
        } catch(e) {
            console.error('❌ Erreur création client MQTT:', e);
            urlIndex++;
            setTimeout(tryConnect, 2000);
        }
    }
    tryConnect();
}

// Ajout d'un cache pour les nodeinfo reçus
const nodeInfoCache = {};

// Tableau d'historique pour conserver toutes les positions affichées
const meshtasticPositions = [];
// Configuration pour la sauvegarde automatique des positions
const MESHTASTIC_POSITIONS_FILE = 'geojson/meshtastic_positions.geojson';
const POSITIONS_SAVE_DEBOUNCE = 5000; // 5 secondes de délai avant sauvegarde
let positionsSaveTimer = null;
let positionsPersistenceDirty = false;

// Layer et structures pour tracés (polylines) par nœud
const trailsLayer = L.layerGroup().addTo(map);
const nodeTrails = {}; // { nodeid: { polyline, coords: [[lat,lon],...], color, dirty } }
const MESHTASTIC_TRAILS_FILE = 'geojson/meshtastic_trails.geojson';
const TRAILS_SAVE_DEBOUNCE = 4000;
let trailsSaveTimer = null;
let trailsLoaded = false;
let trailsPersistenceDirty = false;

function colorFromId(id){
  // Génère une couleur stable depuis un id
  let h = 0;
  const s = String(id||'node');
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 80%, 45%)`;
}

let showTrailsCheckbox = null;

function ensureTrailForNode(nodeId, colorOverride){
  if(!nodeId) nodeId = 'unknown';
  let trail = nodeTrails[nodeId];
  const desiredColor = colorOverride || (trail ? trail.color : colorFromId(nodeId));
  if(!trail){
    const poly = L.polyline([], { color: desiredColor, weight: 3, opacity: 0.8 });
    nodeTrails[nodeId] = trail = { polyline: poly, coords: [], color: desiredColor, dirty: false };
    const shouldShow = showTrailsCheckbox ? showTrailsCheckbox.checked : true;
    if(shouldShow) poly.addTo(trailsLayer);
  } else if(desiredColor && desiredColor !== trail.color){
    trail.color = desiredColor;
    trail.polyline.setStyle({ color: desiredColor });
  }
  return trail;
}

function appendTrailPoint(nodeId, lat, lon, opts = {}){
  if(typeof lat !== 'number' || typeof lon !== 'number') return;
  const trail = ensureTrailForNode(nodeId, opts.color);
  const coords = trail.coords;
  const last = coords[coords.length - 1];
  if(last && Math.abs(last[0] - lat) < 1e-7 && Math.abs(last[1] - lon) < 1e-7){
    return;
  }
  coords.push([lat, lon]);
  const maxPoints = opts.maxPoints || 500;
  if(coords.length > maxPoints) coords.splice(0, coords.length - maxPoints);
  trail.polyline.setLatLngs(coords);
  const shouldShow = showTrailsCheckbox ? showTrailsCheckbox.checked : true;
  if(shouldShow && !trailsLayer.hasLayer(trail.polyline)){
    trail.polyline.addTo(trailsLayer);
  }
  if(!opts.fromLoad){
    trail.dirty = true;
    trailsPersistenceDirty = true;
    scheduleTrailsSave();
  }
}

function serializeTrailsToGeoJSON(){
  const features = [];
  Object.entries(nodeTrails).forEach(([nodeId, trail])=>{
    if(!trail || !trail.coords || trail.coords.length === 0) return;
    if(trail.coords.length === 1){
      const [lat, lon] = trail.coords[0];
      features.push({
        type:'Feature',
        geometry:{
          type:'Point',
          coordinates:[lon, lat]
        },
        properties:{
          nodeid: nodeId,
          color: trail.color,
          weight: trail.polyline?.options?.weight || 3,
          lastUpdated: Date.now()
        }
      });
      return;
    }
    features.push({
      type:'Feature',
      geometry:{
        type:'LineString',
        coordinates: trail.coords.map(([lat, lon])=>[lon, lat])
      },
      properties:{
        nodeid: nodeId,
        color: trail.color,
        weight: trail.polyline?.options?.weight || 3,
        lastUpdated: Date.now()
      }
    });
  });
  return { type:'FeatureCollection', features };
}

async function saveMeshtasticTrails(){
  if(!trailsPersistenceDirty){
    return;
  }
  const payload = serializeTrailsToGeoJSON();
  try{
    const res = await fetch(`/api/save/${MESHTASTIC_TRAILS_FILE}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload, null, 2)
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} ${txt}`);
    }
    Object.values(nodeTrails).forEach(trail => { if(trail) trail.dirty = false; });
    trailsPersistenceDirty = false;
  }catch(err){
    console.warn('[Meshtastic] Sauvegarde des tracés échouée:', err);
  }
}

function scheduleTrailsSave(){
  clearTimeout(trailsSaveTimer);
  trailsSaveTimer = setTimeout(()=>{ saveMeshtasticTrails(); }, TRAILS_SAVE_DEBOUNCE);
}

async function loadMeshtasticTrails(){
  if(trailsLoaded) return;
  trailsLoaded = true;
  try{
    const res = await fetch(`${MESHTASTIC_TRAILS_FILE}?_=${Date.now()}`);
    if(!res.ok){
      if(res.status !== 404){
        throw new Error(`HTTP ${res.status}`);
      }
      return;
    }
    const data = await res.json();
    if(!data || !Array.isArray(data.features)) return;
    data.features.forEach(feature=>{
      if(!feature || !feature.geometry) return;
      const props = feature.properties || {};
      const nodeId = props.nodeid || props.id || props.name || 'unknown';
      const color = props.color;
      const weight = props.weight || 3;
      const geomType = feature.geometry.type;
      let coords = feature.geometry.coordinates;
      if(!Array.isArray(coords)) return;
      if(geomType === 'Point'){
        coords = [coords];
      }
      if(geomType === 'LineString' || geomType === 'Point'){
        const latlngs = coords.map(item=>{
          if(!Array.isArray(item) || item.length < 2) return null;
          const [lon, lat] = item;
          return [lat, lon];
        }).filter(Boolean);
        if(latlngs.length === 0) return;
        const trail = ensureTrailForNode(nodeId, color);
        trail.coords = latlngs;
        trail.polyline.setLatLngs(latlngs);
        trail.polyline.setStyle({ color: trail.color, weight });
        const shouldShow = showTrailsCheckbox ? showTrailsCheckbox.checked : true;
        if(shouldShow && !trailsLayer.hasLayer(trail.polyline)){
          trail.polyline.addTo(trailsLayer);
        }
        trail.dirty = false;
      }
    });
    console.log(`[Meshtastic] Tracés chargés (${data.features.length})`);
  }catch(err){
    console.warn('[Meshtastic] Impossible de charger les tracés sauvegardés:', err);
  }
}

// Layer pour les points Meshtastic
const pointsLayer = L.layerGroup().addTo(map);
let showPointsCheckbox = null;
let historyLoaded = false;
const historyStatus = document.getElementById('historyStatus');
const liveNodesDiv = document.getElementById('liveNodes');
const liveNodesSet = new Set();
const historyNodesSet = new Set();
// Suivi des nœuds live : nodeId -> { lastUpdate: timestamp, marker: L.Marker }
const liveNodesTracking = new Map();
// Configuration : délai en minutes avant qu'un nœud live devienne historique
const LIVE_TO_HISTORY_MINUTES = 2; // Configurable : 2 minutes par défaut

async function loadMeshtasticHistory(){
  if(historyLoaded) return;
  try{
    // D'abord charger les positions sauvegardées depuis le GeoJSON
    try {
      const geoJsonRes = await fetch(`${MESHTASTIC_POSITIONS_FILE}?_=${Date.now()}`);
      if(geoJsonRes.ok){
        const geoJsonData = await geoJsonRes.json();
        if(geoJsonData && Array.isArray(geoJsonData.features)){
          console.log(`[Meshtastic] Chargement de ${geoJsonData.features.length} positions depuis GeoJSON...`);
          let historicalCount = 0;
          let loadedCount = 0;
          geoJsonData.features.forEach((feature, index) => {
            if(feature.geometry && feature.geometry.type === 'Point' && feature.properties){
              const props = feature.properties;
              const [lon, lat] = feature.geometry.coordinates || [];
              if(typeof lat === 'number' && typeof lon === 'number'){
                // Reconstruire l'objet data pour handleMqttMessage
                const isHistorical = props.status === 'historical';
                const data = {
                  ...props,
                  lat: lat,
                  lon: lon,
                  nodeid: props.nodeid || props.sender || props.id,
                  timestamp: props.timestamp,
                  type: props.type || 'position'
                };
                // Supprimer les propriétés GeoJSON pour garder seulement les données brutes
                delete data.status;
                delete data.historicalSince;
                delete data.lastUpdate;
                try {
                  // Charger avec fromHistory=true pour les positions historiques
                  handleMqttMessage('meshtastic/history', JSON.stringify(data), isHistorical);
                  if(data.nodeid){
                    if(isHistorical){
                      historyNodesSet.add(data.nodeid);
                      historicalCount++;
                    } else {
                      // Position live chargée depuis le GeoJSON
                      liveNodesSet.add(data.nodeid);
                      historyNodesSet.delete(data.nodeid); // S'assurer qu'elle n'est pas en historique
                    }
                  }
                  loadedCount++;
                } catch(err){
                  console.warn(`[Meshtastic] Erreur chargement position GeoJSON #${index}:`, err);
                }
              }
            }
          });
          console.log(`[Meshtastic] ${loadedCount} positions chargées depuis GeoJSON (${historicalCount} historiques, ${loadedCount - historicalCount} live)`);
          // Ne pas afficher automatiquement les marqueurs historiques - attendre que l'utilisateur coche la checkbox
          setTimeout(() => {
            let totalPositions = meshtasticPositions.length;
            let totalMarkers = 0;
            let totalHistorical = 0;
            meshtasticPositions.forEach((pos) => {
              if (pos.marker) totalMarkers++;
              if (pos.status === 'historical') {
                totalHistorical++;
                // Ne pas ajouter automatiquement - seulement si la checkbox est cochée
                const shouldShow = showMeshtasticCheckbox && showMeshtasticCheckbox.checked && 
                                  (!showPointsCheckbox || showPointsCheckbox.checked);
                if (shouldShow && !pointsLayer.hasLayer(pos.marker)) {
                  try {
                    pos.marker.addTo(pointsLayer);
                    console.log(`[Meshtastic] Marqueur historique ajouté : ${pos.nodeid} (lat: ${pos.lat?.toFixed(6)}, lon: ${pos.lon?.toFixed(6)})`);
                  } catch(e) {
                    console.error(`[Meshtastic] Erreur réaffichage marqueur historique ${pos.nodeid}:`, e);
                  }
                }
              }
            });
            console.log(`[Meshtastic] Chargement terminé : ${totalPositions} positions, ${totalMarkers} marqueurs, ${totalHistorical} historiques (affichage selon checkbox)`);
            // Mettre à jour la légende
            if (typeof updateLegend === 'function') updateLegend();
          }, 200);
        } else {
          console.warn('[Meshtastic] GeoJSON invalide ou vide');
        }
      } else if(geoJsonRes.status === 404){
        console.log('[Meshtastic] Pas de fichier GeoJSON de positions existant (404), continuons...');
      } else {
        console.warn(`[Meshtastic] Erreur chargement GeoJSON: HTTP ${geoJsonRes.status}`);
      }
    } catch(e){
      console.log('[Meshtastic] Pas de fichier GeoJSON de positions existant:', e.message);
    }
    
    // Ensuite charger l'historique depuis l'API (pour compatibilité)
    try {
      const resp = await fetch('/api/meshtastic/history?_=' + Date.now());
      if(resp.ok){
        const data = await resp.json();
        const positions = Array.isArray(data.positions) ? data.positions : [];
        let apiCount = 0;
        positions.forEach(entry => {
          if(entry && entry.payload){
            try {
              handleMqttMessage(entry.topic || 'meshtastic/history', JSON.stringify(entry.payload), true);
              const histId = entry.payload?.nodeid || entry.payload?.sender || entry.payload?.id || entry.nodeid;
              if(histId) {
                historyNodesSet.add(histId);
                apiCount++;
              }
            } catch(err){
              console.warn('[Meshtastic] Erreur injection historique:', err);
            }
          }
        });
        if(apiCount > 0){
          console.log(`[Meshtastic] ${apiCount} positions chargées depuis l'API historique`);
        }
      }
    } catch(e){
      console.log('[Meshtastic] API historique indisponible, utilisation du GeoJSON uniquement');
    }
    
    if(historyStatus) {
      const totalHistorical = historyNodesSet.size;
      historyStatus.textContent = `Historique Meshtastic chargé (${totalHistorical} nœuds historiques)`;
    }
    updateLiveNodesDisplay();
  } catch(e){
    console.warn('[Meshtastic] Erreur chargement historique:', e);
    if(historyStatus) historyStatus.textContent = 'Historique Meshtastic indisponible';
  } finally {
    historyLoaded = true;
  }
}

// Fonction pour gérer les messages (utilisée par MQTT et WebSocket)
function handleMqttMessage(topic, message, fromHistory=false) {
    try {
        let data, topicToUse = topic;
        let shouldTreatAsHistorical = fromHistory; // Variable locale pour gérer le statut historique
        let txt = (typeof message === 'string' ? message : message.toString()).trim();
        
        // Vérifier si c'est du JSON valide
        if((txt.startsWith('{') && txt.endsWith('}')) || (txt.startsWith('[') && txt.endsWith(']'))) {
            try {
                data = JSON.parse(txt);
            } catch(e) {
                // Si le parse JSON échoue, c'est probablement du protobuf binaire
                console.warn('[Meshtastic] Message MQTT non JSON reçu (protobuf binaire, ignoré)');
                return;
            }
        } else {
            // Message binaire (protobuf), normal pour Meshtastic, on ignore silencieusement
            // Ne pas afficher de warning pour éviter le spam dans la console
            return;
        }
        // --- Gestion nodeinfo : stocke dans le cache ---
        let cacheId = data.nodeid || data.sender;
        if (data.type === 'nodeinfo' && cacheId) {
            nodeInfoCache[cacheId] = data;
            return; // pas d'affichage direct, juste mettre à jour les infos
        }
        // Détection améliorée des coordonnées Meshtastic
        let lat = data.lat, lon = data.lon;
        if (typeof lat === 'undefined' || typeof lon === 'undefined') {
            // Fallback 1 : coordonnées entières Meshtastic dans payload
            if (data.payload && typeof data.payload.latitude_i !== 'undefined' && typeof data.payload.longitude_i !== 'undefined') {
                lat = data.payload.latitude_i / 1e7;
                lon = data.payload.longitude_i / 1e7;
            }
            // Fallback 2 : coordonnées dans payload directement
            else if (data.payload && typeof data.payload.latitude !== 'undefined' && typeof data.payload.longitude !== 'undefined') {
                lat = data.payload.latitude;
                lon = data.payload.longitude;
            }
            // Fallback 3 : coordonnées entières au niveau racine
            else if (typeof data.latitude_i !== 'undefined' && typeof data.longitude_i !== 'undefined') {
                lat = data.latitude_i / 1e7;
                lon = data.longitude_i / 1e7;
            }
        }
        if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
            const liveNodeId = data.nodeid || data.sender || data.id || 'unknown';
            const currentTime = Date.now();
            const thresholdMs = LIVE_TO_HISTORY_MINUTES * 60 * 1000; // Convertir minutes en millisecondes
            // Utiliser le timestamp du message Meshtastic si disponible, sinon utiliser maintenant
            // Convertir en millisecondes si nécessaire (timestamp peut être en secondes ou millisecondes)
            let messageTimestamp = currentTime;
            if(typeof data.timestamp !== 'undefined'){
                messageTimestamp = data.timestamp > 10000000000 ? data.timestamp : data.timestamp * 1000;
                // Ne pas utiliser un timestamp futur ou trop ancien (plus de 1 an)
                const oneYearAgo = currentTime - (365 * 24 * 60 * 60 * 1000);
                if(messageTimestamp > currentTime || messageTimestamp < oneYearAgo){
                    // Timestamp invalide, utiliser maintenant
                    messageTimestamp = currentTime;
                }
            }
            
            if(!fromHistory){
              const messageTime = new Date(messageTimestamp);
              const timeSinceMessage = currentTime - messageTimestamp;
              const minutesSinceMessage = Math.floor(timeSinceMessage / 60000);
              
              console.log(`[Meshtastic] Message live reçu pour nœud ${liveNodeId} (lat: ${lat}, lon: ${lon}) - Timestamp: ${messageTime.toLocaleString()} (il y a ${minutesSinceMessage}min)`);
              
              // Si le message est trop ancien (plus de 2 minutes), ne pas l'ajouter comme "live"
              // mais traiter comme historique dès le départ
              if(timeSinceMessage >= thresholdMs){
                console.log(`[Meshtastic] Message trop ancien (${minutesSinceMessage} min) pour nœud ${liveNodeId}, traitement comme historique`);
                // Mettre à jour les positions existantes de ce nœud
                meshtasticPositions.forEach(pos => {
                  if(pos.nodeid === liveNodeId && pos.status === 'live'){
                    pos.status = 'historical';
                    if(!pos.historicalSince) pos.historicalSince = messageTimestamp;
                    // Mettre à jour aussi le marqueur s'il existe
                    if(pos.marker && pos.marker._leaflet_id && icons["Meshtastic_History"]){
                      try {
                        const currentIcon = pos.marker.options.icon;
                        const isObject = currentIcon && icons.Objet && 
                                         currentIcon.options && icons.Objet.options &&
                                         currentIcon.options.iconUrl === icons.Objet.options.iconUrl;
                        if(!isObject){
                          pos.marker.setIcon(icons["Meshtastic_History"]);
                        }
                      } catch(e) {
                        console.warn(`[Meshtastic] Erreur mise à jour marqueur ancien pour ${liveNodeId}:`, e);
                      }
                    }
                  }
                });
                // Ne pas ajouter au tracking live si le message est trop ancien
                // Mais continuer à créer la position avec le statut "historical"
                shouldTreatAsHistorical = true; // Forcer le traitement comme historique
                liveNodesSet.delete(liveNodeId);
                historyNodesSet.add(liveNodeId);
              } else {
                // Le message est récent, traitement normal comme live
                // Vérifier si c'est un nouveau nœud ou une mise à jour
                if(!liveNodesTracking.has(liveNodeId)){
                  // Nouveau nœud live
                  console.log(`[Meshtastic] Nouveau nœud live détecté: ${liveNodeId}`);
                  liveNodesSet.add(liveNodeId);
                  historyNodesSet.delete(liveNodeId); // Retirer de l'historique si présent
                } else {
                  console.log(`[Meshtastic] Mise à jour du nœud live existant: ${liveNodeId}`);
                }
                updateLiveNodesDisplay();
                flashMqttActivity();
              }
            }
            
            let icon;
            if (data.type === 'object') {
              icon = icons.Objet;
            } else {
              icon = shouldTreatAsHistorical ? icons["Meshtastic_History"] || icons.Meshtastic : icons.Meshtastic;
            }

            // Ajout de la position à l'historique
            // Éviter les doublons : ne pas ajouter si la position existe déjà avec le même timestamp
            const positionEntry = {
                nodeid: data.nodeid || data.sender || data.id || 'unknown',
                lat: lat,
                lon: lon,
                timestamp: data.timestamp || Date.now()/1000,
                status: shouldTreatAsHistorical ? 'historical' : 'live', // Marquer le statut
                lastUpdate: shouldTreatAsHistorical ? (data.lastUpdate || currentTime) : messageTimestamp, // Timestamp du message Meshtastic
                raw: data
            };
            
            // Vérifier si cette position existe déjà (même nodeid, lat, lon, timestamp)
            const isDuplicate = meshtasticPositions.some(pos => 
                pos.nodeid === positionEntry.nodeid &&
                Math.abs(pos.lat - positionEntry.lat) < 1e-7 &&
                Math.abs(pos.lon - positionEntry.lon) < 1e-7 &&
                Math.abs(pos.timestamp - positionEntry.timestamp) < 1
            );
            
            if(!isDuplicate){
                meshtasticPositions.push(positionEntry);
            }
            
            // Si c'est une position live, marquer pour sauvegarde
            if(!shouldTreatAsHistorical){
                positionsPersistenceDirty = true;
                schedulePositionsSave();
            }

            // Mise à jour du tracé par nœud
            const nodeIdForTrail = data.nodeid || data.sender || 'unknown';
            appendTrailPoint(nodeIdForTrail, lat, lon, { fromLoad: shouldTreatAsHistorical });

            let cacheId = data.nodeid || data.sender;
            let nodeinfo = (cacheId && nodeInfoCache[cacheId]) ? nodeInfoCache[cacheId] : null;
            let popupContent = `<b>${data.shortname || data.sender || nodeinfo?.shortname || 'Inconnu'}</b><br>`;
            if (data.longname || nodeinfo?.longname) popupContent += `<span>${data.longname || nodeinfo?.longname}</span><br>`;
            popupContent += `<b>Type : </b>${data.type || '-'}<br>`;
            if (typeof lat !== 'undefined' && typeof lon !== 'undefined') popupContent += `<b>Lat :</b> ${lat.toFixed(7)}<br><b>Lon :</b> ${lon.toFixed(7)}<br>`;
            if (data.payload?.altitude) popupContent += `<b>Altitude :</b> ${data.payload.altitude} m<br>`;
            if (data.payload?.ground_speed) popupContent += `<b>Vitesse :</b> ${data.payload.ground_speed} m/s<br>`;
            if (data.payload?.sats_in_view) popupContent += `<b>Satellites :</b> ${data.payload.sats_in_view}<br>`;
            if (data.payload?.PDOP) popupContent += `<b>Précision PDOP :</b> ${data.payload.PDOP}<br>`;
            if (typeof data.timestamp !== 'undefined') popupContent += `<b>Horodatage :</b> ${new Date((data.timestamp > 10000000000 ? data.timestamp : data.timestamp*1000)).toLocaleString()}<br>`;
            popupContent += `<b>Node ID :</b> ${data.nodeid || data.sender || '-'}<hr style=\"margin:4px;\">
`;
            if (nodeinfo) {
                popupContent += `<b style=\"color:#1784fa\">=== Infos du nœud ===</b><br>`;
                if(nodeinfo.hw_model) popupContent += `<b>Modèle :</b> ${nodeinfo.hw_model}<br>`;
                if(nodeinfo.firmware_version) popupContent += `<b>Firmware :</b> ${nodeinfo.firmware_version}<br>`;
                if(nodeinfo.firmware_build) popupContent += `<b>Build :</b> ${nodeinfo.firmware_build}<br>`;
                if(nodeinfo.platform) popupContent += `<b>Plateforme :</b> ${nodeinfo.platform}<br>`;
                if(typeof nodeinfo.channel_utilization !== 'undefined') popupContent += `<b>Occup. canal :</b> ${nodeinfo.channel_utilization}%<br>`;
                if(nodeinfo.role) popupContent += `<b>Rôle :</b> ${nodeinfo.role}<br>`;
                if(nodeinfo.user) popupContent += `<b>User info :</b> ${JSON.stringify(nodeinfo.user)}<br>`;
            }

            // Pour les nœuds live, mettre à jour le marqueur existant ou en créer un nouveau
            let marker;
            if(!shouldTreatAsHistorical){
              // Nœud live : vérifier si on a déjà un tracking
              if(liveNodesTracking.has(liveNodeId)){
                const tracking = liveNodesTracking.get(liveNodeId);
                if(tracking.marker && tracking.marker._leaflet_id){
                  // Mettre à jour le marqueur existant
                  marker = tracking.marker;
                  marker.setLatLng([lat, lon]);
                  marker.setIcon(icon); // Remettre l'icône live si le nœud redevient actif
                  marker.getPopup().setContent(popupContent);
                  // Mettre à jour le tracking avec le timestamp du message (pas la réception)
                  tracking.lastUpdate = messageTimestamp;
                  liveNodesTracking.set(liveNodeId, tracking);
                  console.log(`[Meshtastic] Marqueur existant mis à jour pour nœud ${liveNodeId}`);
                } else {
                  // Créer un nouveau marqueur si l'ancien n'existe plus
                  console.log(`[Meshtastic] Marqueur invalide, création d'un nouveau pour nœud ${liveNodeId}`);
                  marker = L.marker([lat, lon], {
                    title: data.longname || data.shortname || '',
                    icon: icon
                  });
                  marker.bindPopup(popupContent);
                  marker.on('mouseover', e => {
                    const idText = data.nodeid || data.sender || 'Inconnu';
                    const tsMs = typeof data.timestamp !== 'undefined' ? (data.timestamp > 10000000000 ? data.timestamp : data.timestamp*1000) : Date.now();
                    const when = new Date(tsMs).toLocaleString();
                    const tooltipContent = `${idText}<br>${when}`;
                    marker.bindTooltip(tooltipContent, {permanent: false, direction: 'top'}).openTooltip();
                  });
                  marker.on('mouseout', () => { marker.closeTooltip(); });
                  if(showMeshtasticCheckbox.checked && (!showPointsCheckbox || showPointsCheckbox.checked)){
                    marker.addTo(pointsLayer);
                  }
                  tracking.marker = marker;
                  tracking.lastUpdate = messageTimestamp;
                  liveNodesTracking.set(liveNodeId, tracking);
                  console.log(`[Meshtastic] Nouveau marqueur créé et stocké pour nœud ${liveNodeId}`);
                }
              } else {
                // Nouveau nœud live sans tracking : créer le marqueur et initialiser le tracking
                console.log(`[Meshtastic] Création d'un nouveau marqueur pour nœud ${liveNodeId}`);
                marker = L.marker([lat, lon], {
                  title: data.longname || data.shortname || '',
                  icon: icon
                });
                marker.bindPopup(popupContent);
                marker.on('mouseover', e => {
                  const idText = data.nodeid || data.sender || 'Inconnu';
                  const tsMs = typeof data.timestamp !== 'undefined' ? (data.timestamp > 10000000000 ? data.timestamp : data.timestamp*1000) : Date.now();
                  const when = new Date(tsMs).toLocaleString();
                  const tooltipContent = `${idText}<br>${when}`;
                  marker.bindTooltip(tooltipContent, {permanent: false, direction: 'top'}).openTooltip();
                });
                marker.on('mouseout', () => { marker.closeTooltip(); });
                if(showMeshtasticCheckbox.checked && (!showPointsCheckbox || showPointsCheckbox.checked)){
                  marker.addTo(pointsLayer);
                  console.log(`[Meshtastic] Marqueur ajouté à la carte pour nœud ${liveNodeId}`);
                }
                // Initialiser le tracking avec le marqueur
                liveNodesTracking.set(liveNodeId, {
                  lastUpdate: messageTimestamp,
                  marker: marker
                });
                console.log(`[Meshtastic] Tracking initialisé pour nœud ${liveNodeId}, total: ${liveNodesTracking.size}`);
                // Si le nœud était en historique, le retirer
                historyNodesSet.delete(liveNodeId);
              }
            } else {
              // Pour les positions historiques, créer un nouveau marqueur
              marker = L.marker([lat, lon], {
                title: data.longname || data.shortname || '',
                icon: icon
              });
              marker.bindPopup(popupContent);
              marker.on('mouseover', e => {
                const idText = data.nodeid || data.sender || 'Inconnu';
                const tsMs = typeof data.timestamp !== 'undefined' ? (data.timestamp > 10000000000 ? data.timestamp : data.timestamp*1000) : Date.now();
                const when = new Date(tsMs).toLocaleString();
                const tooltipContent = `${idText}<br>${when}`;
                marker.bindTooltip(tooltipContent, {permanent: false, direction: 'top'}).openTooltip();
              });
              marker.on('mouseout', () => { marker.closeTooltip(); });
              // Pour les positions historiques, ne les ajouter que si la checkbox est cochée
              const shouldShow = showMeshtasticCheckbox && showMeshtasticCheckbox.checked && 
                                (!showPointsCheckbox || showPointsCheckbox.checked);
              if (shouldShow) {
                try {
                  marker.addTo(pointsLayer);
                  console.log(`[Meshtastic] Marqueur historique ajouté à la carte pour nœud ${liveNodeId || (data.nodeid || data.sender || 'unknown')} (lat: ${lat.toFixed(6)}, lon: ${lon.toFixed(6)})`);
                } catch(e) {
                  console.error(`[Meshtastic] Erreur ajout marqueur historique pour ${liveNodeId || (data.nodeid || data.sender || 'unknown')}:`, e);
                }
              } else {
                console.log(`[Meshtastic] Marqueur historique créé mais non affiché (checkbox désactivée) pour nœud ${liveNodeId || (data.nodeid || data.sender || 'unknown')}`);
              }
            }
            
            // Stocker le marqueur dans la position (si elle existe)
            if(meshtasticPositions.length > 0){
              const lastPos = meshtasticPositions[meshtasticPositions.length - 1];
              lastPos.marker = marker;
            }
            if (typeof updateLegend === 'function') updateLegend();
        } else {
            // Pas de coordonnées utilisables - vérifier si c'est vraiment un message de position
            // Ne pas afficher d'avertissement pour les messages nodeinfo, text, etc.
            if(data.type === 'position' || (data.payload && (data.payload.latitude_i !== undefined || data.payload.longitude_i !== undefined))) {
                console.warn('[Meshtastic] Message position sans coordonnées valides (ignoré):', {
                    type: data.type,
                    sender: data.sender || data.nodeid,
                    timestamp: data.timestamp,
                    hasPayload: !!data.payload,
                    payloadKeys: data.payload ? Object.keys(data.payload) : []
                });
            }
            return;
        }
    } catch(e) { 
        console.error('❌ Erreur parsing MQTT:', e, typeof message === 'string' ? message : message.toString()); 
    }
}

function updateLiveNodesDisplay(){
    if(!liveNodesDiv) return;
    liveNodesDiv.textContent = `Nœuds en live : ${liveNodesSet.size}`;
}

// Fonction pour passer les nœuds inactifs de live vers historique
function moveInactiveNodesToHistory(){
    const currentTime = Date.now();
    const thresholdMs = LIVE_TO_HISTORY_MINUTES * 60 * 1000; // Convertir minutes en millisecondes
    const nodesToMove = [];
    
    // Log de débogage périodique (seulement toutes les 10 vérifications pour ne pas surcharger)
    if(!moveInactiveNodesToHistory.debugCounter) moveInactiveNodesToHistory.debugCounter = 0;
    moveInactiveNodesToHistory.debugCounter++;
    if(moveInactiveNodesToHistory.debugCounter % 2 === 0) { // Toutes les 2 vérifications (1 minute)
        console.log(`[Meshtastic] Vérification périodique : ${liveNodesTracking.size} nœud(s) live suivi(s)`);
    }
    
    liveNodesTracking.forEach((tracking, nodeId) => {
        const timeSinceUpdate = currentTime - tracking.lastUpdate;
        const minutesSinceUpdate = Math.floor(timeSinceUpdate / 60000);
        const secondsSinceUpdate = Math.floor((timeSinceUpdate % 60000) / 1000);
        
        // Log détaillé pour les nœuds spécifiques ou tous les nœuds toutes les X vérifications
        if(nodeId === '!da634e24' || nodeId === '!43b6eca0'){
            const lastUpdateDate = new Date(tracking.lastUpdate);
            console.log(`[Meshtastic] Debug nœud ${nodeId}: dernier message à ${lastUpdateDate.toLocaleString()}, inactif depuis ${minutesSinceUpdate}m${secondsSinceUpdate}s (seuil: ${LIVE_TO_HISTORY_MINUTES} min)`);
        }
        
        if(timeSinceUpdate >= thresholdMs){
            nodesToMove.push(nodeId);
            const lastUpdateDate = new Date(tracking.lastUpdate);
            console.log(`[Meshtastic] Nœud ${nodeId} inactif depuis ${minutesSinceUpdate}m${secondsSinceUpdate}s (seuil: ${LIVE_TO_HISTORY_MINUTES} min) - Dernier message: ${lastUpdateDate.toLocaleString()}`);
        }
    });
    
    nodesToMove.forEach(nodeId => {
        const tracking = liveNodesTracking.get(nodeId);
        if(tracking && tracking.marker){
            try {
                // Vérifier que le marqueur est toujours valide
                if(!tracking.marker._leaflet_id){
                    console.warn(`[Meshtastic] Marqueur invalide pour nœud ${nodeId}`);
                } else {
                    // Changer l'icône vers historique (sauf pour les objets)
                    const currentIcon = tracking.marker.options.icon;
                    const isObject = currentIcon && icons.Objet && 
                                     currentIcon.options && icons.Objet.options &&
                                     currentIcon.options.iconUrl === icons.Objet.options.iconUrl;
                    
                    if(!isObject && icons["Meshtastic_History"]){
                        tracking.marker.setIcon(icons["Meshtastic_History"]);
                        console.log(`[Meshtastic] Nœud ${nodeId} : icône changée vers historique`);
                    }
                }
            } catch(e) {
                console.error(`[Meshtastic] Erreur lors du changement d'icône pour ${nodeId}:`, e);
            }
        }
        
        // Mettre à jour le statut dans meshtasticPositions pour ce nœud
        // Mettre à jour TOUTES les positions de ce nœud
        meshtasticPositions.forEach(pos => {
            if(pos.nodeid === nodeId && pos.status === 'live'){
                pos.status = 'historical';
                if(!pos.historicalSince) pos.historicalSince = tracking.lastUpdate || Date.now();
                // Mettre à jour aussi le marqueur de cette position s'il existe
                if(pos.marker && pos.marker._leaflet_id){
                    try {
                        const currentIcon = pos.marker.options.icon;
                        const isObject = currentIcon && icons.Objet && 
                                         currentIcon.options && icons.Objet.options &&
                                         currentIcon.options.iconUrl === icons.Objet.options.iconUrl;
                        if(!isObject && icons["Meshtastic_History"]){
                            pos.marker.setIcon(icons["Meshtastic_History"]);
                        }
                    } catch(e) {
                        console.warn(`[Meshtastic] Erreur mise à jour marqueur position pour ${nodeId}:`, e);
                    }
                }
            }
        });
        
        // Retirer de live et ajouter à historique
        liveNodesSet.delete(nodeId);
        historyNodesSet.add(nodeId);
        liveNodesTracking.delete(nodeId);
        
        // Marquer pour sauvegarde
        positionsPersistenceDirty = true;
    });
    
    if(nodesToMove.length > 0){
        updateLiveNodesDisplay();
        if(typeof updateLegend === 'function') updateLegend();
        console.log(`[Meshtastic] ${nodesToMove.length} nœud(s) passé(s) en historique (inactif(s) depuis ${LIVE_TO_HISTORY_MINUTES} min)`);
        // Déclencher la sauvegarde automatique
        schedulePositionsSave();
    }
}

// Fonction pour sérialiser les positions en GeoJSON
function serializePositionsToGeoJSON(){
    const features = meshtasticPositions.map(pos => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [pos.lon, pos.lat]
        },
        properties: {
            nodeid: pos.nodeid,
            timestamp: pos.timestamp,
            status: pos.status || 'live', // live ou historical
            historicalSince: pos.historicalSince || null,
            lastUpdate: pos.lastUpdate || null,
            ...pos.raw
        }
    }));
    return { type: "FeatureCollection", features };
}

// Fonction pour sauvegarder les positions automatiquement
async function saveMeshtasticPositions(){
    if(!positionsPersistenceDirty){
        return;
    }
    const payload = serializePositionsToGeoJSON();
    try{
        const res = await fetch(`/api/save/${MESHTASTIC_POSITIONS_FILE}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(payload, null, 2)
        });
        if(!res.ok){
            const txt = await res.text();
            throw new Error(`HTTP ${res.status} ${txt}`);
        }
        positionsPersistenceDirty = false;
        console.log(`[Meshtastic] Positions sauvegardées dans ${MESHTASTIC_POSITIONS_FILE} (${payload.features.length} positions)`);
    }catch(err){
        console.warn('[Meshtastic] Sauvegarde des positions échouée:', err);
    }
}

// Fonction pour programmer la sauvegarde avec délai (debounce)
function schedulePositionsSave(){
    clearTimeout(positionsSaveTimer);
    positionsSaveTimer = setTimeout(() => {
        saveMeshtasticPositions();
    }, POSITIONS_SAVE_DEBOUNCE);
}

// Démarrer la vérification périodique (toutes les 30 secondes pour plus de réactivité)
let historyCheckInterval = null;
function startHistoryCheckInterval(){
    if(historyCheckInterval) clearInterval(historyCheckInterval);
    console.log(`[Meshtastic] Démarrage de la vérification périodique (délai: ${LIVE_TO_HISTORY_MINUTES} min, vérification toutes les 30s)`);
    // Vérifier toutes les 30 secondes pour plus de réactivité (même si le délai est de 2 minutes)
    historyCheckInterval = setInterval(() => {
        moveInactiveNodesToHistory();
    }, 30000);
}
function stopHistoryCheckInterval(){
    if(historyCheckInterval){
        clearInterval(historyCheckInterval);
        historyCheckInterval = null;
    }
}

// Fonction pour se connecter au proxy WebSocket (si URL locale)
function connectWebSocketProxy(wsUrl) {
    try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('✅ WebSocket proxy connecté:', wsUrl);
            setMqttStatus('proxy_connected');
            // Stocker la connexion WebSocket
            mqttClient = ws;
        };
        
        ws.onmessage = (event) => {
            if (!showMeshtasticCheckbox.checked) return;
            // Le message du proxy est au format {"topic": "...", "payload": "..."}
            try {
                const proxyMsg = JSON.parse(event.data);
                handleMqttMessage(proxyMsg.topic, JSON.stringify(proxyMsg));
            } catch(e) {
                console.error('❌ Erreur parsing proxy message:', e);
            }
        };
        
        ws.onerror = (err) => {
            console.error('❌ Erreur WebSocket proxy:', err);
            setMqttStatus('proxy_error');
            // Fallback auto : si WebSocket échoue, tente la liste d'origine
            fallbackConnectMQTT();
        };
        
        ws.onclose = () => {
            console.log('⚠️ WebSocket proxy fermé');
            setMqttStatus('proxy_disconnected');
            // Fallback auto : si WebSocket fermé, tente la liste d'origine
            fallbackConnectMQTT();
        };
        
        return ws;
    } catch(e) {
        console.error('❌ Erreur création WebSocket:', e);
        // Fallback auto : si WebSocket échoue, tente la liste d'origine
        fallbackConnectMQTT();
        return null;
    }
}

// Log de chargement du script
console.log('[Meshtastic] Script cartoff.js chargé (version avec passage automatique en historique)');

// Appeler initMQTT quand le DOM est prêt
if (document.readyState === 'loading') {
    console.log('[Meshtastic] DOM en cours de chargement, attente de DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Meshtastic] DOMContentLoaded déclenché, appel de initMQTT()');
        initMQTT();
    });
} else {
    console.log('[Meshtastic] DOM déjà chargé, appel immédiat de initMQTT()');
    initMQTT();
}

// Ajout des boutons dans la sidebar juste après la case "Afficher positions Meshtastic"
window.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('showMeshtastic');
  if (checkbox) {
    // Toggle switch Afficher points Meshtastic (indépendant de la connexion)
    if (!window.createToggleSwitch) {
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
    }
    const { label: pointsLabel, checkbox: pointsChk } = window.createToggleSwitch('showMeshtasticPoints', 'Afficher points Meshtastic', false);
    checkbox.parentElement.appendChild(pointsLabel);
    showPointsCheckbox = pointsChk;
    pointsChk.addEventListener('change', ()=>{
      if(pointsChk.checked){
        // Réafficher tous les marqueurs (live et historiques)
        meshtasticPositions.forEach(({ marker }) => { 
          if (marker && !pointsLayer.hasLayer(marker)) {
            marker.addTo(pointsLayer);
          }
        });
        console.log(`[Meshtastic] Réaffichage de ${meshtasticPositions.length} marqueurs sur la carte`);
      } else {
        pointsLayer.clearLayers();
      }
    });
    // Appliquer l'état initial : afficher tous les marqueurs chargés
    if(pointsChk.checked){
      // Petite temporisation pour s'assurer que tous les marqueurs sont créés
      setTimeout(() => {
        meshtasticPositions.forEach(({ marker }) => { 
          if (marker && !pointsLayer.hasLayer(marker)) {
            marker.addTo(pointsLayer);
          }
        });
        console.log(`[Meshtastic] Affichage initial de ${meshtasticPositions.length} marqueurs sur la carte`);
      }, 500);
    }

    // Toggle switch Afficher tracés
    const { label: trailsLabel, checkbox: trailsChk } = window.createToggleSwitch('showMeshtasticTrails', 'Afficher tracés Meshtastic', false);
    checkbox.parentElement.appendChild(trailsLabel);
    showTrailsCheckbox = trailsChk;
    trailsChk.addEventListener('change', ()=>{
      if(trailsChk.checked){
        Object.values(nodeTrails).forEach(t=>{ if(t.polyline && !trailsLayer.hasLayer(t.polyline)) t.polyline.addTo(trailsLayer); });
      } else {
        trailsLayer.clearLayers();
      }
    });
    trailsChk.dispatchEvent(new Event('change'));

    // Bouton Effacer historique
    const btnClear = document.createElement('button');
    btnClear.textContent = 'Effacer historique Meshtastic';
    btnClear.style.display = 'block';
    btnClear.style.margin = '8px 0';
    btnClear.onclick = () => {
      // Retire tous les marqueurs Meshtastic
      pointsLayer.clearLayers();
      meshtasticPositions.forEach(({ marker }) => { 
        if (marker && map.hasLayer(marker)) map.removeLayer(marker); 
      });
      meshtasticPositions.length = 0;
      showMessage('Historique Meshtastic effacé !', 2);
    };
    checkbox.parentElement.appendChild(btnClear);

    // Bouton Export GeoJSON (points)
    const btnExport = document.createElement('button');
    btnExport.textContent = 'Exporter positions (GeoJSON)';
    btnExport.style.display = 'block';
    btnExport.style.margin = '8px 0 0 0';
    btnExport.onclick = () => {
      if (meshtasticPositions.length === 0) {
        showMessage('Aucune position à exporter.', 2);
        return;
      }
      const features = meshtasticPositions.map(pos => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [pos.lon, pos.lat] },
        properties: { nodeid: pos.nodeid, timestamp: pos.timestamp, ...pos.raw }
      }));
      const geojson = { type: "FeatureCollection", features };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], {type: "application/geo+json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "meshtastic_positions.geojson";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    checkbox.parentElement.appendChild(btnExport);

    // Boutons tracés (déjà présents plus bas) restent inchangés
    // Bouton Effacer tracés
    const btnClearTrails = document.createElement('button');
    btnClearTrails.textContent = 'Effacer tracés Meshtastic';
    btnClearTrails.style.display='block';
    btnClearTrails.style.margin='8px 0';
    btnClearTrails.onclick = () => {
      trailsLayer.clearLayers();
      for(const k in nodeTrails) delete nodeTrails[k];
      trailsPersistenceDirty = true;
      scheduleTrailsSave();
      showMessage('Tracés effacés.', 2);
    };
    checkbox.parentElement.appendChild(btnClearTrails);

    // Bouton Export tracés GeoJSON
    const btnExportTrails = document.createElement('button');
    btnExportTrails.textContent = 'Exporter tracés (GeoJSON)';
    btnExportTrails.style.display='block';
    btnExportTrails.style.margin='8px 0 0 0';
    btnExportTrails.onclick = () => {
      const features = Object.entries(nodeTrails)
        .filter(([,t])=> t.coords && t.coords.length>1)
        .map(([nodeid, t])=>({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: t.coords.map(([la,lo])=>[lo,la]) },
          properties: { nodeid, color: t.color || colorFromId(nodeid) }
        }));
      if(features.length===0){ showMessage('Aucun tracé à exporter.',2); return; }
      const geojson = { type:'FeatureCollection', features };
      const blob = new Blob([JSON.stringify(geojson,null,2)], {type:'application/geo+json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'meshtastic_trails.geojson';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    checkbox.parentElement.appendChild(btnExportTrails);
  }
});


