import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CommandCenter from './pages/CommandCenter';
import DrillingOperations from './pages/DrillingOperations';
import MaintenanceReports from './pages/MaintenanceReports';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import MachineAvailability from './pages/MachineAvailability';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

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
                  <CommandCenter />
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
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
