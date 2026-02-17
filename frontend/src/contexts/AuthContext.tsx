import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error: any) {
      localStorage.removeItem('token');
      // Si c'est une erreur de connexion réseau, on ne fait rien
      // L'utilisateur sera redirigé vers la page de login
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8000');
        console.error('Détails de l\'erreur:', error);
      } else if (error.response) {
        // Erreur HTTP (401, 404, etc.) - c'est normal si pas de token
        console.log('Réponse du serveur:', error.response.status, error.response.statusText);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    localStorage.setItem('token', response.data.access_token);
    // Sauvegarder le nom d'utilisateur pour la prochaine connexion
    localStorage.setItem('lastUsername', username);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

