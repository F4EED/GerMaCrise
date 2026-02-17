# Guide : Transformer GerMaCrise en Application Desktop

Ce guide explique différentes méthodes pour transformer GerMaCrise en application installable sur votre bureau.

## 🎯 Option 1 : Installation via le Navigateur (MÉTHODE LA PLUS SIMPLE) ⭐

C'est la méthode la plus simple ! Les navigateurs modernes permettent d'installer des sites web comme applications directement depuis le navigateur.

### Comment installer GerMaCrise sur votre bureau :

#### **Chrome / Edge (Windows, macOS, Linux) :**
1. Ouvrez GerMaCrise dans votre navigateur (Chrome ou Edge)
2. Regardez dans la barre d'adresse : vous verrez une icône **"Installer"** (➕) ou un bouton dans le menu
3. Cliquez sur **"Installer"** ou allez dans le menu (⋮) → **"Installer GerMaCrise"**
4. Confirmez l'installation
5. L'application apparaîtra sur votre bureau et dans le menu Démarrer (Windows) ou Applications (macOS)

#### **Firefox (Windows, macOS, Linux) :**
1. Ouvrez GerMaCrise dans Firefox
2. Allez dans le menu (☰) → **"Plus d'outils"** → **"Installer le site en tant qu'application"**
3. Confirmez l'installation

#### **Safari (macOS) :**
1. Ouvrez GerMaCrise dans Safari
2. Allez dans **"Fichier"** → **"Ajouter à l'écran d'accueil"**
3. L'application sera ajoutée à votre Launchpad

### Avantages de cette méthode :
- ✅ **Aucune installation de logiciel supplémentaire**
- ✅ **Gratuit et immédiat**
- ✅ **Mise à jour automatique** (l'application utilise toujours la version en ligne)
- ✅ **Fonctionne sur tous les systèmes d'exploitation**
- ✅ **L'application s'ouvre dans sa propre fenêtre** (sans barre d'adresse)

### Configuration requise :
L'application a déjà été configurée avec un fichier `manifest.json` qui permet cette installation. Aucune action supplémentaire n'est nécessaire !

---

## Option 2 : Utilisation d'Electron (Application native complète)

### Étape 1 : Installation d'Electron

Dans le dossier `frontend`, installez Electron et les dépendances nécessaires :

```bash
cd frontend
npm install --save-dev electron electron-builder concurrently wait-on cross-env
npm install --save electron-is-dev
```

### Étape 2 : Création du fichier principal Electron

Créez un fichier `electron/main.js` dans le dossier `frontend` :

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../public/favicon.png'),
  });

  // Charge l'application
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  win.loadURL(startUrl);

  // Ouvre les DevTools en mode développement
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### Étape 3 : Configuration de package.json

Ajoutez/modifiez les scripts et la configuration dans `frontend/package.json` :

```json
{
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "electron": "electron .",
    "electron-dev": "concurrently \"cross-env BROWSER=none npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron-pack": "electron-builder",
    "preelectron-pack": "npm run build",
    "dist": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.germacrise.app",
    "productName": "GerMaCrise",
    "directories": {
      "buildResources": "build"
    },
    "files": [
      "build/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/favicon.png"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/favicon.png"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/favicon.png"
    }
  }
}
```

### Étape 4 : Création de l'application

#### Mode développement :
```bash
npm run electron-dev
```

#### Création de l'installateur :
```bash
npm run dist
```

Les installateurs seront créés dans le dossier `frontend/dist/`.

## Option 2 : Utilisation de Tauri (Alternative légère)

Tauri est une alternative plus légère à Electron, créant des applications plus petites et plus rapides.

### Installation de Tauri

```bash
cd frontend
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api
```

### Initialisation de Tauri

```bash
npx tauri init
```

Suivez les instructions pour configurer Tauri. Il créera un dossier `src-tauri` avec la configuration Rust.

### Configuration

Modifiez `src-tauri/tauri.conf.json` pour pointer vers votre build React.

## Recommandation

Pour la plupart des utilisateurs, **l'installation via le navigateur (Option 1)** est la meilleure solution car :
- ✅ Simple et immédiate
- ✅ Aucune configuration nécessaire
- ✅ Mise à jour automatique
- ✅ Fonctionne partout

**Electron** est recommandé uniquement si vous avez besoin :
- D'une application complètement autonome (sans navigateur)
- D'un installateur .exe/.dmg/.deb natif
- D'accès aux APIs système avancées

## Notes importantes

1. **Backend** : L'application desktop devra toujours se connecter au backend. Assurez-vous que :
   - Le backend est accessible (localhost ou serveur distant)
   - Les URLs API sont correctement configurées
   - Les CORS sont configurés pour autoriser l'application desktop

2. **Sécurité** : En production, désactivez les DevTools et configurez correctement les permissions Electron.

3. **Taille** : Les applications Electron peuvent être volumineuses (~100-200 MB). Tauri produit des applications plus petites (~10-20 MB).

