import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './Dashboard.css';
import '../pages/Login.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    evenements: 0,
    personnel: 0,
    vehicules: 0,
    moyens: 0,
  });
  const [personnelStats, setPersonnelStats] = useState({
    disponible: 0,
    occupe: 0,
    repos: 0,
    absent: 0,
    engage: 0,
    non_disponible: 0,
    total: 0,
  });
  const [moyensStats, setMoyensStats] = useState({
    disponible: 0,
    indisponible: 0,
    maintenance: 0,
    total: 0,
  });
  const [vehiculesStats, setVehiculesStats] = useState({
    disponible: 0,
    en_mission: 0,
    en_maintenance: 0,
    hors_service: 0,
    total: 0,
  });
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeUsername, setWelcomeUsername] = useState('');

  useEffect(() => {
    fetchStats();
    
    // Vérifier si on doit afficher le popup de bienvenue
    const shouldShowPopup = sessionStorage.getItem('showWelcomePopup');
    const username = sessionStorage.getItem('welcomeUsername');
    if (shouldShowPopup === 'true' && username) {
      setShowWelcomePopup(true);
      setWelcomeUsername(username);
      // Nettoyer le flag
      sessionStorage.removeItem('showWelcomePopup');
      sessionStorage.removeItem('welcomeUsername');
    }
  }, []);

  // Fermer le popup automatiquement après 3 secondes
  useEffect(() => {
    if (showWelcomePopup) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomePopup]);

  const fetchStats = async () => {
    try {
      const [evenements, personnel, vehicules, moyens, personnelStatsData, moyensStatsData, vehiculesStatsData] = await Promise.all([
        api.get('/api/evenements?limit=1'),
        api.get('/api/personnel?limit=1'),
        api.get('/api/vehicules?limit=1'),
        api.get('/api/moyens?limit=1'),
        api.get('/api/personnel/stats/by-statut'),
        api.get('/api/moyens/stats/by-statut'),
        api.get('/api/vehicules/stats/by-statut'),
      ]);

      setStats({
        evenements: evenements.data.length > 0 ? evenements.headers['x-total-count'] || 0 : 0,
        personnel: personnel.data.length > 0 ? personnel.headers['x-total-count'] || 0 : 0,
        vehicules: vehicules.data.length > 0 ? vehicules.headers['x-total-count'] || 0 : 0,
        moyens: moyens.data.length > 0 ? moyens.headers['x-total-count'] || 0 : 0,
      });
      
      setPersonnelStats(personnelStatsData.data);
      setMoyensStats(moyensStatsData.data);
      setVehiculesStats(vehiculesStatsData.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  return (
    <>
      {showWelcomePopup && (
        <div className="welcome-popup-overlay" onClick={() => setShowWelcomePopup(false)}>
          <div className="welcome-popup" onClick={(e) => e.stopPropagation()}>
            <div className="welcome-popup-content">
              <h2>🎉 Bonjour {welcomeUsername} !</h2>
              <p>Connexion réussie</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowWelcomePopup(false)}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dashboard">
        <h1>Tableau de bord</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Événements</h3>
          <p className="stat-number">{stats.evenements}</p>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <h3>Personnel</h3>
          <p className="stat-number">{personnelStats.total}</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Engagé:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{personnelStats.engage}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Disponible:</span>
              <strong style={{ color: '#22c55e' }}>{personnelStats.disponible}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Occupé:</span>
              <strong style={{ color: '#f59e0b' }}>{personnelStats.occupe}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Repos:</span>
              <strong style={{ color: '#3b82f6' }}>{personnelStats.repos}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Absent:</span>
              <strong style={{ color: '#ef4444' }}>{personnelStats.absent}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Non disponible:</span>
              <strong style={{ color: '#6b7280' }}>{personnelStats.non_disponible}</strong>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <h3>Véhicules</h3>
          <p className="stat-number">{vehiculesStats.total}</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>En mission:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{vehiculesStats.en_mission}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Disponible:</span>
              <strong style={{ color: '#22c55e' }}>{vehiculesStats.disponible}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>En maintenance:</span>
              <strong style={{ color: '#f59e0b' }}>{vehiculesStats.en_maintenance}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hors service:</span>
              <strong style={{ color: '#ef4444' }}>{vehiculesStats.hors_service}</strong>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <h3>Moyens</h3>
          <p className="stat-number">{moyensStats.total}</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Disponible:</span>
              <strong style={{ color: '#22c55e' }}>{moyensStats.disponible || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Indisponible:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{moyensStats.indisponible || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Maintenance:</span>
              <strong style={{ color: '#f59e0b' }}>{moyensStats.maintenance || 0}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="logo-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: '3rem', 
        padding: '2rem',
        width: '100%',
        minHeight: '200px'
      }}>
        <img 
          src={process.env.PUBLIC_URL + '/images/logo_gmc.png'} 
          alt="GerMaCrise Logo" 
          className="dashboard-logo"
          style={{ 
            maxWidth: '300px', 
            width: 'auto',
            height: 'auto',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
            transition: 'transform 0.3s ease',
            display: 'block',
            opacity: 1,
            visibility: 'visible'
          }}
          onError={(e) => {
            console.error('Erreur de chargement du logo logo_gmc.png');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('p');
              fallback.textContent = 'Logo GerMaCrise';
              fallback.style.cssText = 'color: var(--text-secondary); font-style: italic; font-size: 1.2rem;';
              parent.appendChild(fallback);
            }
          }}
          onLoad={() => {
            console.log('Logo logo_gmc.png chargé avec succès');
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLImageElement).style.transform = 'scale(1)';
          }}
        />
      </div>
    </div>
    </>
  );
};

export default Dashboard;

