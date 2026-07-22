import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAutoRefresh } from '../components/NotificationProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function UrgencyBadge({ createdAt }: { createdAt: string }) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 5) return <span className="badge-danger" style={{ animation: 'pulseGlow 1.5s infinite' }}>🔴 NOW</span>;
  if (mins < 30) return <span className="badge-danger">🟡 {mins}m ago</span>;
  return <span className="badge">{mins}m ago</span>;
}

export default function SOSCommand() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [stealthMode, setStealthMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const fetchAlerts = useCallback(async () => {
    const [active, all] = await Promise.all([
      api.getSOSAlerts('active'),
      api.getSOSAlerts(),
    ]);
    setAlerts(active); setAllAlerts(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, []);
  useAutoRefresh(fetchAlerts, 5000);

  const resolveAlert = async (id: number) => {
    await fetch(`/api/sos/${id}/resolve`, { method: 'PUT' });
    setAlerts(prev => prev.filter(a => a.ROWID !== id));
    setAllAlerts(prev => prev.map(a => a.ROWID === id ? { ...a, status: 'resolved' } : a));
  };

  const activateStealthSOS = async () => {
    setStealthMode(true);
    document.body.style.backgroundColor = '#000';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640 }, audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      mr.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          await fetch('/api/sos/women-safety', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, triggeredBy: 'Stealth SOS User', isWomenSafety: true, description: 'Stealth SOS - silent streaming' }) });
        }
      };
      mr.start(3000);
    } catch {
      await fetch('/api/sos/women-safety', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, triggeredBy: 'Stealth SOS User', isWomenSafety: true, description: 'Stealth SOS (no media)' }) });
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading SOS Command Center...</span></div>;

  const displayAlerts = filter === 'active' ? alerts : allAlerts;
  const resolvedCount = allAlerts.length - alerts.length;

  const sosTimeline = [
    { name: 'Active', count: alerts.length, fill: '#ef4444' },
    { name: 'Resolved', count: resolvedCount, fill: '#22c55e' },
  ];

  const sosTypes = allAlerts.reduce((acc: any, a: any) => {
    const t = a.isWomenSafety ? 'Women Safety' : a.category || 'General';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const typeData = Object.entries(sosTypes).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div className="page sos-page">
      <header className="page-header">
        <h2>SOS Emergency Command Center <span className="badge-danger" style={{ fontSize: '0.7rem', animation: 'pulseGlow 2s infinite' }}>LIVE</span></h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <option value="active">Active ({alerts.length})</option>
            <option value="all">All ({allAlerts.length})</option>
          </select>
          <button className="btn-stealth" onClick={activateStealthSOS}>🕵️ Stealth SOS</button>
          <button className="btn-secondary btn-sm" onClick={fetchAlerts}>🔄</button>
        </div>
      </header>

      {stealthMode && (
        <div className="stealth-overlay">
          <div className="fake-power-off"><span>POWER OFF — 3%</span><small>Tap for panic pad</small></div>
          <div className="stealth-controls" onClick={e => e.stopPropagation()}>
            <button className="btn-danger" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
              onClick={() => { setStealthMode(false); document.body.style.backgroundColor = ''; }}>Deactivate</button>
          </div>
        </div>
      )}

      <div className="sos-stats">
        <div className="stat-box danger"><span className="stat-number">{alerts.length}</span><span className="stat-label">Active SOS</span></div>
        <div className="stat-box warning"><span className="stat-number">{alerts.filter(a => a.isWomenSafety).length}</span><span className="stat-label">Women Safety</span></div>
        <div className="stat-box success"><span className="stat-number">{resolvedCount}</span><span className="stat-label">Resolved</span></div>
        <div className="stat-box blue"><span className="stat-number">{allAlerts.length}</span><span className="stat-label">Total Today</span></div>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <div className="card-header"><h3>SOS Alerts</h3></div>
          {displayAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</p>
              <p>No SOS alerts. All clear.</p>
            </div>
          ) : (
            <div className="sos-list">
              {displayAlerts.map(alert => (
                <div key={alert.ROWID} className={`sos-card ${alert.isWomenSafety ? 'women-safety' : ''}`}>
                  <div className="sos-card-header">
                    <span className={`sos-badge ${alert.status === 'active' ? 'active' : ''}`}>
                      {alert.isWomenSafety ? '🆘 WOMEN SAFETY' : alert.category?.toUpperCase() || 'SOS'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <UrgencyBadge createdAt={alert.createdAt} />
                      <span className="sos-time">{new Date(alert.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="sos-card-body">
                    <p><strong>Triggered by:</strong> {alert.triggeredBy || 'Anonymous'}</p>
                    <p><strong>Location:</strong> {alert.latitude?.toFixed(5)}, {alert.longitude?.toFixed(5)}</p>
                    <p><strong>District:</strong> {alert.district || 'Bengaluru Urban'}</p>
                    {alert.description && <p><strong>Details:</strong> {alert.description}</p>}
                    {alert.status === 'active' && <p style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠️ Requires immediate response</p>}
                  </div>
                  <div className="sos-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank')}>📍 View Map</button>
                    {alert.status === 'active' && <button className="btn-resolve" onClick={() => resolveAlert(alert.ROWID)}>✅ Resolve</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>SOS Status Breakdown</h3></div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={sosTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.75rem' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {sosTimeline.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>SOS by Type</h3></div>
          {typeData.map((d, i) => (
            <div key={i} className="bar-row">
              <span className="bar-label">{d.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.count / Math.max(1, ...typeData.map(x => x.count))) * 100}%`, background: i === 0 ? '#ef4444' : '#3b82f6' }} />
              </div>
              <span className="bar-value">{d.count}</span>
            </div>
          ))}
          {typeData.length === 0 && <p className="empty-state">No data</p>}
        </div>
      </div>
    </div>
  );
}
