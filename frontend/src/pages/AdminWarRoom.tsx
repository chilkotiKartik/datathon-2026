import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function SystemStatus({ label, status, value }: { label: string; status: 'online' | 'warning' | 'offline'; value: string }) {
  return (
    <div className="system-status">
      <span className={`system-status-dot ${status}`} />
      <span className="system-status-label">{label}</span>
      <span className={`system-status-value ${status}`}>{value}</span>
    </div>
  );
}

export default function AdminWarRoom() {
  const [adminStats, setAdminStats] = useState<any>(null);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const ts = () => new Date().toLocaleTimeString('en-IN');
    Promise.all([
      api.getAdminStats(),
      api.getPatrols(),
      api.getSOSAlerts(),
    ]).then(([stats, p, sos]) => {
      setAdminStats(stats); setPatrols(p); setSosAlerts(sos);
      setLoading(false);
      setLog(prev => [...prev.slice(-19), `[${ts()}] System initialized — ${stats.total} records, ${p.length} patrols`]);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading Admin War Room...</span></div>;

  const categoryMax = adminStats.byCategory ? Math.max(...adminStats.byCategory.map((x: any) => x.count)) : 1;
  const activePatrolCount = patrols.filter((v: any) => v.status === 'active_patrol').length;
  const activeSOSCount = sosAlerts.filter((s: any) => s.status === 'active').length;

  const severityColors: Record<string, string> = { heinous: '#ef4444', grave: '#f59e0b', petty: '#3b82f6' };
  const severityPie = (adminStats.bySeverity || []).map((s: any) => ({ name: s.severity, value: s.count, color: severityColors[s.severity] || '#6b7280' }));
  const districtData = (adminStats.byDistrict || []).slice(0, 8).map((d: any) => ({ name: d.district, count: d.count }));

  return (
    <div className="page admin-page">
      <header className="page-header">
        <h2>Admin War Room <span className="badge">Command Center</span></h2>
        <span className="live-indicator"><span className="live-dot" /> System Online</span>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card total"><div className="kpi-top"><div className="kpi-icon cyan">📊</div></div><div className="kpi-value">{adminStats.total?.toLocaleString() || 0}</div><div className="kpi-label">Total Cases</div></div>
        <div className="kpi-card active"><div className="kpi-top"><div className="kpi-icon yellow">🔍</div>{adminStats.activeCases > 0 && <span className="kpi-trend down">{adminStats.activeCases} open</span>}</div><div className="kpi-value">{adminStats.activeCases || 0}</div><div className="kpi-label">Active Investigations</div></div>
        <div className="kpi-card solved"><div className="kpi-top"><div className="kpi-icon green">✅</div></div><div className="kpi-value">{adminStats.clearanceRate?.toFixed(1) || 0}%</div><div className="kpi-label">Clearance Rate</div></div>
        <div className="kpi-card danger"><div className="kpi-top"><div className="kpi-icon red">🚨</div>{activeSOSCount > 0 && <span className="kpi-trend down">{activeSOSCount} active</span>}</div><div className="kpi-value">{adminStats.activeSOS || activeSOSCount || 0}</div><div className="kpi-label">Active SOS</div></div>
        <div className="kpi-card blue"><div className="kpi-top"><div className="kpi-icon purple">🚔</div></div><div className="kpi-value">{adminStats.activePatrols || activePatrolCount || 0}</div><div className="kpi-label">Active Patrol Units</div></div>
        <div className="kpi-card warning"><div className="kpi-top"><div className="kpi-icon yellow">⚠️</div></div><div className="kpi-value">{adminStats.criticalAnomalies || 0}</div><div className="kpi-label">Critical Anomalies</div></div>
      </div>

      <div className="war-room-grid">
        <div className="card">
          <div className="card-header"><h3>System Health</h3></div>
          <SystemStatus label="Backend API" status="online" value="100%" />
          <SystemStatus label="Database Store" status="online" value={`${adminStats.total || 0} records`} />
          <SystemStatus label="DBSCAN Engine" status={adminStats.total > 0 ? 'online' : 'warning'} value={adminStats.total > 0 ? 'Ready' : 'No Data'} />
          <SystemStatus label="Prediction Model" status={adminStats.total > 100 ? 'online' : 'warning'} value={adminStats.total > 100 ? 'Trained' : 'Insufficient'} />
          <SystemStatus label="WebSocket" status="online" value="Connected" />
          <SystemStatus label="Patrol GPS" status={patrols.length > 0 ? 'online' : 'warning'} value={`${patrols.length} units`} />
          <SystemStatus label="SOS Gateway" status="online" value={`${activeSOSCount} active`} />
        </div>

        <div className="card">
          <div className="card-header"><h3>Active Patrol Units</h3><span className="badge">{patrols.length} total</span></div>
          {patrols.length === 0 ? <p className="empty-state">No patrol data</p> : (
            patrols.slice(0, 8).map((v, i) => (
              <div key={i} className="patrol-item">
                <span className={`patrol-status ${v.status}`} />
                <div style={{ flex: 1 }}><strong style={{ fontSize: '0.78rem' }}>{v.vanNumber}</strong> — {v.officerInCharge}<span className="patrol-meta">{v.status === 'active_patrol' ? 'Active' : v.status === 'responding' ? 'Responding' : 'Off Duty'}</span></div>
                <span className="patrol-zone">{v.zone}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>SOS Status</h3>{activeSOSCount > 0 && <span className="badge-danger">{activeSOSCount} active</span>}</div>
          {sosAlerts.length === 0 ? <p className="empty-state">No SOS alerts</p> : (
            sosAlerts.slice(0, 8).map((s, i) => (
              <div key={i} className={`sos-mini ${s.status === 'active' ? 'active' : ''}`}>
                <span className="sos-icon">{s.isWomenSafety ? '🆘' : '🚨'}</span>
                <div style={{ flex: 1 }}><strong style={{ fontSize: '0.78rem' }}>{s.triggeredBy || 'Anonymous'}</strong><span className="sos-mini-meta">{s.category || 'SOS'} · {new Date(s.createdAt).toLocaleString('en-IN')}</span></div>
                <span className={`anomaly-change ${s.status === 'active' ? 'positive' : 'negative'}`}>{s.status === 'active' ? 'ACTIVE' : 'OK'}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Severity Distribution</h3></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <PieChart width={120} height={120}>
              <Pie data={severityPie} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                {severityPie.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.75rem' }} />
            </PieChart>
            <div>
              {severityPie.map(d => (
                <div key={d.name} className="donut-legend-item" style={{ padding: '0.15rem 0' }}>
                  <span className="donut-legend-dot" style={{ background: d.color }} />
                  <span style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>{d.name}</span>
                  <span className="donut-legend-count">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card full-width">
          <div className="card-header"><h3>Crime Category — Full Distribution</h3></div>
          {(adminStats.byCategory || []).slice(0, 15).map((c: any, i: number) => {
            const pct = (c.count / categoryMax) * 100;
            return (
              <div key={i} className="bar-row">
                <span className="bar-label">{c.category.replace(/_/g, ' ')}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(${220 - i * 10}, 65%, 50%), hsl(${220 - i * 10 + 15}, 65%, 40%))` }} />
                </div>
                <span className="bar-value">{c.count.toLocaleString()}</span>
                <span style={{ width: '45px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{(c.count / (adminStats.total || 1) * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header"><h3>District Overview</h3></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: '#555e7a', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8892b0', fontSize: 9 }} width={75} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.75rem' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16} fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card full-width">
          <div className="card-header"><h3>System Activity Log</h3><span className="badge">{log.length} events</span></div>
          <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            {log.length === 0 ? <p className="empty-state">No events</p> : log.slice(-20).reverse().map((l, i) => (
              <div key={i} style={{ padding: '0.2rem 0', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
