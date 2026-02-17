/**
 * GerMaCrise - Version Loader
 * Charge la version depuis json/version.json et met à jour tous les éléments
 */

let appVersion = '0.9.5-Dev'; // Version par défaut

/**
 * Charge la version depuis json/version.json
 */
async function loadVersion() {
  try {
    const response = await fetch('json/version.json');
    if (response.ok) {
      const data = await response.json();
      if (data.Version) {
        appVersion = data.Version;
        return appVersion;
      }
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger la version depuis json/version.json:', error);
  }
  return appVersion;
}

/**
 * Met à jour tous les éléments qui doivent afficher la version
 */
async function updateVersionInPage() {
  const version = await loadVersion();
  
  // Mettre à jour le titre de la page
  const title = document.querySelector('title');
  if (title) {
    // Sauvegarder le titre original seulement la première fois
    if (!title.hasAttribute('data-original')) {
      title.setAttribute('data-original', title.textContent);
    }
    const original = title.getAttribute('data-original');
    // Regex améliorée pour gérer V1.0.0-Dev, 0.9-Dev, V1.0.0-Démo, etc.
    title.textContent = original.replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
  }
  
  // Mettre à jour les éléments avec data-version
  document.querySelectorAll('[data-version]').forEach(el => {
    // Sauvegarder le texte original seulement la première fois
    if (!el.hasAttribute('data-original')) {
      el.setAttribute('data-original', el.textContent || '');
    }
    const original = el.getAttribute('data-original');
      // Regex améliorée pour gérer V1.0.0-Dev, 0.9-Dev, V1.0.0-Démo, etc.
      el.textContent = original.replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
  });
  
  // Mettre à jour les éléments avec l'attribut id contenant "version"
  ['versionNumber', 'versionBadge', 'versionSidebar', 'versionHeader', 'versionTitle', 'versionDesc1', 'versionDesc2', 'pageVersion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Sauvegarder le texte original seulement la première fois
      if (!el.hasAttribute('data-original')) {
        el.setAttribute('data-original', el.textContent);
      }
      const original = el.getAttribute('data-original');
      // Regex améliorée pour gérer V1.0.0-Dev, 0.9-Dev, V1.0.0-Démo, etc.
      el.textContent = original.replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
    }
  });
  
  // Mettre à jour le titre de la page (vérification supplémentaire)
  if (document.title && (document.title.includes('0.9-Dev') || document.title.includes('0.9.5-Dev') || document.title.includes('V1.0.0-Démo') || document.title.match(/V\d+\.\d+/))) {
    // Utiliser le titre original sauvegardé si disponible
    const title = document.querySelector('title');
    if (title && title.hasAttribute('data-original')) {
      document.title = title.getAttribute('data-original').replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
    } else {
      document.title = document.title.replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
    }
  }
  
  // Mettre à jour les éléments contenant "GerMaCrise 0.9" ou similaire
  // NE PAS toucher au h1.header-info car il a des styles inline critiques
  document.querySelectorAll('h2, .version, .version-badge, .stat-number').forEach(el => {
    if (el.textContent.includes('GerMaCrise') && !el.classList.contains('header-info')) {
      // Sauvegarder le texte original seulement la première fois
      if (!el.hasAttribute('data-original')) {
        el.setAttribute('data-original', el.textContent);
      }
      const original = el.getAttribute('data-original');
      // Regex améliorée pour gérer GerMaCrise V1.0.0-Dev, GerMaCrise 0.9-Dev, V1.0.0-Démo, etc.
      el.textContent = original.replace(/GerMaCrise\s*(0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?)/g, `GerMaCrise ${version}`);
    }
  });
  
  // Mettre à jour le texte dans le body qui contient la version
  if (document.body.textContent.includes('0.9-Dev') || document.body.textContent.includes('0.9.5-Dev') || document.body.textContent.includes('V1.0.0-Démo') || document.body.textContent.match(/V\d+\.\d+/)) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      // Vérifier si le nœud contient une version à remplacer
      if (node.textContent.match(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/)) {
        // Utiliser le texte original sauvegardé si disponible (via le parent)
        const parent = node.parentElement;
        if (parent && parent.hasAttribute('data-original')) {
          // Ne pas remplacer si le parent a déjà été traité
          continue;
        }
        node.textContent = node.textContent.replace(/0\.9-?Dev|0\.9\.5-Dev|V\d+\.\d+(\.\d+)?([-.](Dev|RC|Beta|Alpha|Démo))?/g, version);
      }
    }
  }
  
  // Réappliquer les styles du header après la mise à jour (si la fonction existe)
  if (typeof reapplyHeaderStyles === 'function') {
    setTimeout(() => {
      reapplyHeaderStyles();
    }, 50);
  }
  
  return version;
}

// Auto-initialisation si le script est chargé après le DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateVersionInPage().then(() => {
      // Réappliquer les styles après la mise à jour
      if (typeof reapplyHeaderStyles === 'function') {
        setTimeout(() => {
          reapplyHeaderStyles();
        }, 100);
      }
    });
  });
} else {
  updateVersionInPage().then(() => {
    // Réappliquer les styles après la mise à jour
    if (typeof reapplyHeaderStyles === 'function') {
      setTimeout(() => {
        reapplyHeaderStyles();
      }, 100);
    }
  });
}

// Exporter pour utilisation externe
window.loadVersion = loadVersion;
window.updateVersionInPage = updateVersionInPage;
window.appVersion = () => appVersion;

