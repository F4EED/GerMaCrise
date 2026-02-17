import axios from 'axios';

// Détecter si on est dans le navigateur ou dans le conteneur
const isBrowser = typeof window !== 'undefined';

// Utiliser l'URL externe depuis le navigateur, l'URL interne depuis le conteneur
// En développement avec proxy, utiliser une URL relative ou l'URL externe
// Le proxy dans package.json redirige /api vers http://germacrise-backend:8000
const API_URL = isBrowser 
  ? (process.env.REACT_APP_API_URL_EXTERNAL || 'http://localhost:8000')
  : (process.env.REACT_APP_API_URL || 'http://germacrise-backend:8000');


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log des erreurs pour debug
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('Erreur réseau:', error.message);
      console.error('URL tentée:', error.config?.url);
      console.error('Base URL:', error.config?.baseURL);
    } else if (error.response) {
      console.error('Erreur HTTP:', error.response.status, error.response.statusText);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Ne pas rediriger si on est déjà sur la page de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

