import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActivation } from '../contexts/ActivationContext';
import { useTheme } from '../contexts/ThemeContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { selectedActivation, clearSelectedActivation } = useActivation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug: log quand le Layout se monte
  useEffect(() => {
    console.log('Layout component mounted', { location: location.pathname, navigate: !!navigate });
  }, [location.pathname, navigate]);
  const [gestionMenuOpen, setGestionMenuOpen] = useState(false);
  const [configurationMenuOpen, setConfigurationMenuOpen] = useState(false);
  const [pcsMenuOpen, setPcsMenuOpen] = useState(false);
  const [sarMenuOpen, setSarMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const configurationDropdownRef = useRef<HTMLDivElement>(null);
  const pcsDropdownRef = useRef<HTMLDivElement>(null);
  const sarDropdownRef = useRef<HTMLDivElement>(null);

  // Debug: vérifier le rôle de l'utilisateur
  useEffect(() => {
    if (user) {
      console.log('🔍 Layout - User role:', user.role);
      console.log('🔍 Layout - Is admin?', user.role === 'admin' || user.role === 'super_admin');
    }
  }, [user]);



  const isActive = (path: string) => location.pathname === path;
  
  // Vérifier si un des sous-menus de Gestion est actif
  const isGestionActive = () => {
    const gestionPaths = [
      // '/evenements', // Temporairement masqué
      '/entites',
      '/moyens',
      '/personnel',
      '/sites-industriels',
      '/vehicules',
      '/lieux-accueil'
    ];
    return gestionPaths.some(path => location.pathname === path);
  };

  // Vérifier si un des sous-menus de Configuration est actif
  const isConfigurationActive = () => {
    const configurationPaths = [
      '/risques',
      '/fonctions',
      '/configuration',
      '/utilisateurs',
      '/services'
    ];
    return configurationPaths.some(path => location.pathname === path);
  };

  // Vérifier si un des sous-menus de PCS est actif
  const isPCSActive = () => {
    const pcsPaths = [
      '/annuaire-crise',
      '/activations',
      '/main-courante'
    ];
    return pcsPaths.some(path => location.pathname === path);
  };

  // Vérifier si un des sous-menus de SAR est actif
  const isSARActive = () => {
    const sarPaths = [
      '/sar/gestion-equipes'
    ];
    return sarPaths.some(path => location.pathname.startsWith(path));
  };

  // Ouvrir le menu au clic
  const toggleGestionMenu = () => {
    setGestionMenuOpen(!gestionMenuOpen);
  };

  const toggleConfigurationMenu = () => {
    setConfigurationMenuOpen(!configurationMenuOpen);
  };

  const togglePCSMenu = () => {
    setPcsMenuOpen(!pcsMenuOpen);
  };

  const toggleSARMenu = () => {
    setSarMenuOpen(!sarMenuOpen);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGestionMenuOpen(false);
      }
      if (configurationDropdownRef.current && !configurationDropdownRef.current.contains(event.target as Node)) {
        setConfigurationMenuOpen(false);
      }
      if (pcsDropdownRef.current && !pcsDropdownRef.current.contains(event.target as Node)) {
        setPcsMenuOpen(false);
      }
      if (sarDropdownRef.current && !sarDropdownRef.current.contains(event.target as Node)) {
        setSarMenuOpen(false);
      }
    };

    if (gestionMenuOpen || configurationMenuOpen || pcsMenuOpen || sarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [gestionMenuOpen, configurationMenuOpen, pcsMenuOpen, sarMenuOpen]);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/images/logo.png" alt="GerMaCrise" className="navbar-logo" onError={(e) => {
            // Fallback si l'image n'est pas trouvée
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
          <h1>GerMaCrise V3</h1>
        </div>
        <div className="navbar-menu" style={{ overflow: 'visible', width: 'auto', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            <img src="/images/icon-globe.svg" alt="" className="nav-icon" />
            Tableau de bord
          </Link>
          
          <div 
            ref={dropdownRef}
            className={`dropdown ${gestionMenuOpen ? 'open' : ''} ${isGestionActive() ? 'active' : ''}`}
            onMouseEnter={() => setGestionMenuOpen(true)}
            onMouseLeave={() => setGestionMenuOpen(false)}
          >
            <button 
              className="dropdown-toggle"
              onClick={toggleGestionMenu}
              type="button"
            >
              <img src="/images/icon-folder.svg" alt="" className="nav-icon" />
              Gestion
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="dropdown-menu">
              {/* Événements temporairement masqué */}
              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <Link 
                  to="/entites" 
                  className={isActive('/entites') ? 'active' : ''}
                  onClick={() => setGestionMenuOpen(false)}
                >
                  Entités
                </Link>
              )}
              <Link 
                to="/moyens" 
                className={isActive('/moyens') ? 'active' : ''}
                onClick={() => setGestionMenuOpen(false)}
              >
                Moyens
              </Link>
              <Link 
                to="/personnel" 
                className={isActive('/personnel') ? 'active' : ''}
                onClick={() => setGestionMenuOpen(false)}
              >
                Personnel
              </Link>
              <Link 
                to="/sites-industriels" 
                className={isActive('/sites-industriels') ? 'active' : ''}
                onClick={() => setGestionMenuOpen(false)}
              >
                Sites Industriels
              </Link>
              <Link 
                to="/vehicules" 
                className={isActive('/vehicules') ? 'active' : ''}
                onClick={() => setGestionMenuOpen(false)}
              >
                Véhicules
              </Link>
              <Link 
                to="/lieux-accueil" 
                className={isActive('/lieux-accueil') ? 'active' : ''}
                onClick={() => setGestionMenuOpen(false)}
              >
                Lieux d'accueil
              </Link>
            </div>
          </div>
          
          {/* Menu PCS */}
          <div 
            ref={pcsDropdownRef}
            className={`dropdown ${pcsMenuOpen ? 'open' : ''} ${isPCSActive() ? 'active' : ''}`}
            style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
            onMouseEnter={() => setPcsMenuOpen(true)}
            onMouseLeave={() => setPcsMenuOpen(false)}
          >
            <button 
              className="dropdown-toggle"
              onClick={togglePCSMenu}
              type="button"
            >
              <img src="/images/icon-warning.svg" alt="" className="nav-icon" />
              PCS
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="dropdown-menu">
              <Link
                to="/annuaire-crise"
                className={isActive('/annuaire-crise') ? 'active' : ''}
                onClick={() => setPcsMenuOpen(false)}
              >
                Annuaire de crise
              </Link>
              <Link
                to="/activations"
                className={isActive('/activations') ? 'active' : ''}
                onClick={() => setPcsMenuOpen(false)}
              >
                Activations
              </Link>
              <Link
                to="/main-courante"
                className={isActive('/main-courante') ? 'active' : ''}
                onClick={() => setPcsMenuOpen(false)}
              >
                📝 Main Courante
              </Link>
            </div>
          </div>
          
          <Link to="/base-documentaire" className={isActive('/base-documentaire') ? 'active' : ''}>
            <img src="/images/icon-file-text.svg" alt="" className="nav-icon" />
            Base Documentaire
          </Link>
          
          {/* Menu SAR */}
          <div 
            ref={sarDropdownRef}
            className={`dropdown ${sarMenuOpen ? 'open' : ''} ${isSARActive() ? 'active' : ''}`}
            style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
            onMouseEnter={() => setSarMenuOpen(true)}
            onMouseLeave={() => setSarMenuOpen(false)}
          >
            <button 
              className="dropdown-toggle"
              onClick={toggleSARMenu}
              type="button"
            >
              <img src="/images/icon-warning.svg" alt="" className="nav-icon" />
              SAR
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="dropdown-menu">
              <Link
                to="/sar/gestion-equipes"
                className={isActive('/sar/gestion-equipes') ? 'active' : ''}
                onClick={() => setSarMenuOpen(false)}
              >
                Gestion équipe(s) SAR
              </Link>
            </div>
          </div>
          
          <a 
            href="http://localhost:3081/cartoff3.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className={location.pathname === '/cartographie' ? 'active' : ''}
          >
            <img src="/images/icon-globe.svg" alt="" className="nav-icon" />
            Cartographie
          </a>
          
          {/* Menu Configuration - Visible uniquement pour super_admin et admin */}
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <div 
              ref={configurationDropdownRef}
              className={`dropdown ${configurationMenuOpen ? 'open' : ''} ${isConfigurationActive() ? 'active' : ''}`}
              style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
              onMouseEnter={() => setConfigurationMenuOpen(true)}
              onMouseLeave={() => setConfigurationMenuOpen(false)}
            >
              <button 
                className="dropdown-toggle"
                onClick={toggleConfigurationMenu}
                type="button"
                id="config-menu-button"
              >
                <img src="/images/icon-info.svg" alt="" className="nav-icon" />
                Configuration ...
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className="dropdown-menu">
                <Link
                  to="/risques"
                  className={isActive('/risques') ? 'active' : ''}
                  onClick={() => setConfigurationMenuOpen(false)}
                >
                  ...risques
                </Link>
                <Link
                  to="/fonctions"
                  className={isActive('/fonctions') ? 'active' : ''}
                  onClick={() => setConfigurationMenuOpen(false)}
                >
                  ... Fonctions
                </Link>
                <Link
                  to="/configuration"
                  className={isActive('/configuration') ? 'active' : ''}
                  onClick={() => setConfigurationMenuOpen(false)}
                >
                  ... Ma structure
                </Link>
                <Link
                  to="/services"
                  className={isActive('/services') ? 'active' : ''}
                  onClick={() => setConfigurationMenuOpen(false)}
                >
                  ... Services
                </Link>
                <Link 
                  to="/utilisateurs" 
                  className={isActive('/utilisateurs') ? 'active' : ''}
                  onClick={() => setConfigurationMenuOpen(false)}
                >
                  ... Utilisateurs
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="navbar-right">
          {selectedActivation && (
            <div style={{
              marginRight: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <span>✓ Activation: <strong>{selectedActivation.titre}</strong></span>
              <button
                onClick={clearSelectedActivation}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
                title="Désélectionner l'activation"
              >
                ✕
              </button>
            </div>
          )}
          <a
            href="/a-propos"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 À propos link clicked', {
                currentPath: location.pathname,
                targetPath: '/a-propos',
                navigate: typeof navigate,
                event: e
              });
              try {
                navigate('/a-propos');
                console.log('✅ Navigation appelée avec succès');
              } catch (error) {
                console.error('❌ Erreur lors de la navigation:', error);
              }
            }}
            onMouseEnter={() => {
              console.log('🟢 À propos link hover');
            }}
            className={isActive('/a-propos') ? 'active' : ''}
            style={{ 
              color: 'inherit',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              position: 'relative',
              zIndex: 1000,
              pointerEvents: 'auto',
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          >
            <img src="/images/icon-info.svg" alt="" className="nav-icon" />
            À propos
          </a>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={theme === 'light' ? 'Passer en mode nuit' : 'Passer en mode jour'}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '1rem',
              marginRight: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Mode nuit' : 'Mode jour'}</span>
          </button>
          <div className="navbar-user">
            <span>{user?.username}</span>
            <span className="role-badge">{user?.role}</span>
            <button onClick={logout} className="btn btn-secondary">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

