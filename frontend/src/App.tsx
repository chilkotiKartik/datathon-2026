import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import LoginPage from './pages/LoginPage';
import CrimeDashboard from './pages/CrimeDashboard';
import LiveMap from './pages/LiveMap';
import LinkAnalysis from './pages/LinkAnalysis';
import Predictive from './pages/Predictive';
import SOSCommand from './pages/SOSCommand';
import CitizenPortal from './pages/CitizenPortal';
import PublicDashboard from './pages/PublicDashboard';
import AdminWarRoom from './pages/AdminWarRoom';
import { NotificationProvider } from './components/NotificationProvider';
import './App.css';

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem('sahasra_user');
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">SAHASRA KSP Crime Intelligence <span className="loading-dots">Loading</span></div>
      </div>
    );
  }

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('sahasra_user') || 'null'); } catch { return null; }
  })();

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/dashboard" element={<CrimeDashboard />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/links" element={<LinkAnalysis />} />
            <Route path="/predictive" element={<Predictive />} />
            <Route path="/sos" element={<SOSCommand />} />
            <Route path="/citizen" element={<CitizenPortal />} />
            <Route path="/admin" element={<AdminWarRoom />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
