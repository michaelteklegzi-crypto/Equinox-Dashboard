import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CommandCenter from './pages/CommandCenter';
import DrillingOperations from './pages/DrillingOperations';
import MaintenanceReports from './pages/MaintenanceReports';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import MachineAvailability from './pages/MachineAvailability';
import ParameterAdvisor from './pages/ParameterAdvisor';
import Login from './pages/Login';
import DataIngestion from './pages/DataIngestion'; // Phase 1
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const DashboardRedirect = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'Maintenance') return <Navigate to="/maintenance" replace />;
  if (user?.role === 'Driller') return <Navigate to="/drilling" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRedirect>
                    <CommandCenter />
                  </DashboardRedirect>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/drilling" element={
              <ProtectedRoute>
                <Layout>
                  <DrillingOperations />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute>
                <Layout>
                  <MaintenanceReports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports/availability" element={
              <ProtectedRoute>
                <Layout>
                  <MachineAvailability />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ingestion" element={
              <ProtectedRoute>
                <Layout>
                  <DataIngestion />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/advisor" element={
              <ProtectedRoute>
                <Layout>
                  <ParameterAdvisor />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
