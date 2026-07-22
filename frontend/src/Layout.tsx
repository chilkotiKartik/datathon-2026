import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimulatedBackground from './components/SimulatedBackground';
import SystemFooter from './components/SystemFooter';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['police_admin', 'investigator'] },
  { path: '/map', label: 'Live Map', icon: '🗺️', roles: ['police_admin', 'investigator', 'patrol_officer'] },
  { path: '/links', label: 'Link Analysis', icon: '🔗', roles: ['police_admin', 'investigator'] },
  { path: '/predictive', label: 'Predictive', icon: '🤖', roles: ['police_admin', 'investigator'] },
  { path: '/sos', label: 'SOS Command', icon: '🆘', roles: ['police_admin', 'patrol_officer'] },
  { path: '/citizen', label: 'Citizen Portal', icon: '👥', roles: ['police_admin', 'citizen'] },
  { path: '/public', label: 'Public View', icon: '📈', roles: ['police_admin', 'citizen', 'investigator'] },
  { path: '/admin', label: 'War Room', icon: '⚙️', roles: ['police_admin'] },
];

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('sahasra_user') || 'null')); } catch {}
    setTime(new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString('en-IN')), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sahasra_user');
    localStorage.removeItem('sahasra_token');
    navigate('/login');
  };

  const filteredNav = user ? NAV_ITEMS.filter(item => item.roles.includes(user.role)) : NAV_ITEMS;

  return (
    <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
      <SimulatedBackground />
      <nav className="side-nav" style={{ zIndex: 101, background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="nav-header" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)', pointerEvents: 'none' }} />
          <div className="nav-brand">
            <div className="nav-logo" style={{ animation: 'hologram 4s infinite' }}>SK</div>
            <div>
              <h1 style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>SAHASRA <span style={{ color: 'var(--accent-cyan)' }}>KSP</span></h1>
              <span className="nav-subtitle">Criminal Intelligence</span>
            </div>
          </div>
          {user && (
            <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative' }}
              onClick={() => setShowLogout(!showLogout)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{user.role === 'police_admin' ? '👮' : user.role === 'investigator' ? '🔍' : user.role === 'patrol_officer' ? '🚔' : '👤'}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Officer'}</div>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user.role?.replace(/_/g, ' ')}</div>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{time}</span>
              </div>
              {showLogout && (
                <div style={{ position: 'absolute', bottom: '-2.5rem', left: 0, right: 0, background: 'rgba(26,31,53,0.98)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.4rem', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '0.35rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: 'var(--accent-red)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="nav-section">Command Modules</div>
        {filteredNav.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', fontFamily: 'monospace', letterSpacing: '0.3px' }}>
          <div style={{ color: 'var(--accent-cyan)', marginBottom: '0.15rem' }}>◆ SYSTEM ACTIVE ◆</div>
          v1.0.0 · KSP Datathon 2026
        </div>
      </nav>
      <main className="main-content" style={{ position: 'relative', zIndex: 1, paddingBottom: '2.5rem' }}>
        <Outlet />
      </main>
      <SystemFooter />
    </div>
  );
}
