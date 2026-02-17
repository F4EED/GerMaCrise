import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  // Charger le dernier nom d'utilisateur depuis localStorage
  const [username, setUsername] = useState(() => {
    const savedUsername = localStorage.getItem('lastUsername');
    return savedUsername || '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Marquer qu'on vient de se connecter pour afficher le popup sur le Dashboard
      sessionStorage.setItem('showWelcomePopup', 'true');
      sessionStorage.setItem('welcomeUsername', username);
      // Naviguer vers le dashboard
      navigate('/', { replace: true });
      setLoading(false);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 8001.');
      } else {
        setError(err.response?.data?.detail || 'Erreur de connexion');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        <div className="login-card">
          <h1>GerMaCrise V3</h1>
          <h2>Connexion</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
  );
};

export default Login;

