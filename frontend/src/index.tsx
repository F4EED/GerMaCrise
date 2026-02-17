import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Supprimer les erreurs WebSocket inoffensives du serveur de développement
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Ignorer les erreurs WebSocket liées au HMR
    if (args[0]?.includes?.('WebSocket') || 
        args[0]?.includes?.('ws://localhost:3000/ws') ||
        args[0]?.includes?.('Failed to establish connection')) {
      return;
    }
    originalError.apply(console, args);
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

