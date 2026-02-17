import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ActivationProvider } from './contexts/ActivationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evenements from './pages/Evenements';
import Personnel from './pages/Personnel';
import Moyens from './pages/Moyens';
import Vehicules from './pages/Vehicules';
import Utilisateurs from './pages/Utilisateurs';
import Configuration from './pages/Configuration';
import Risques from './pages/Risques';
import Fonctions from './pages/Fonctions';
import Services from './pages/Services';
import AnnuaireCrise from './pages/AnnuaireCrise';
import LieuxAccueil from './pages/LieuxAccueil';
import Activations from './pages/Activations';
import Entites from './pages/Entites';
import SitesIndustriels from './pages/SitesIndustriels';
import BaseDocumentaire from './pages/BaseDocumentaire';
import SAR from './pages/SAR';
import MainCourante from './pages/MainCourante';
import APropos from './pages/APropos';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActivationProvider>
          <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/evenements"
            element={
              <PrivateRoute>
                <Layout>
                  <Evenements />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/personnel"
            element={
              <PrivateRoute>
                <Layout>
                  <Personnel />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/moyens"
            element={
              <PrivateRoute>
                <Layout>
                  <Moyens />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicules"
            element={
              <PrivateRoute>
                <Layout>
                  <Vehicules />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/utilisateurs"
            element={
              <PrivateRoute>
                <Layout>
                  <Utilisateurs />
                </Layout>
              </PrivateRoute>
            }
          />
              <Route
                path="/configuration"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Configuration />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/entites"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Entites />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sites-industriels"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SitesIndustriels />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/risques"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Risques />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/fonctions"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Fonctions />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Services />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/annuaire-crise"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AnnuaireCrise />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/lieux-accueil"
                element={
                  <PrivateRoute>
                    <Layout>
                      <LieuxAccueil />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/activations"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Activations />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/base-documentaire"
                element={
                  <PrivateRoute>
                    <Layout>
                      <BaseDocumentaire />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sar/gestion-equipes"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SAR />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sar"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Navigate to="/sar/gestion-equipes" replace />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/main-courante"
                element={
                  <PrivateRoute>
                    <Layout>
                      <MainCourante />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/a-propos"
                element={
                  <PrivateRoute>
                    <Layout>
                      <APropos />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
        </ActivationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

