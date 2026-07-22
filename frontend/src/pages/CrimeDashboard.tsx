import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useNotifications, useAutoRefresh } from '../components/NotificationProvider';
import AnimatedCounter from '../components/AnimatedCounter';
import OperationsPanel from '../components/OperationsPanel';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const SIMULATED_EVENTS = [
  '🔍 DBSCAN analysis completed — 15 clusters found',
  '🚔 Patrol unit KSP-42 dispatched to Koramangala',
  '📊 Crime trend update: vehicle_theft +12% this week',
  '🆘 SOS alert received from Whitefield area',
  '🤖 AI prediction model refreshed — 6 high-risk zones',
  '📍 New hotspot detected in Majestic area',
  '📈 Clearance rate improved 2.3% over last month',
  '🔄 System sync complete — 1,000 records indexed',
  '⚡ Anomaly alert: chain_snatching spike in MG Road',
  '🚨 Critical: repeat offender activity detected in Indiranagar',
];

function LiveFeed() {
  const [events, setEvents] = useState<string[]>([]);
  useEffect(() => {
    const addEvent = () => {
      setEvents(prev => [SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)], ...prev.slice(0, 7)]);
    };
    addEvent();
    const interval = setInterval(addEvent, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ maxHeight: '140px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', marginBottom: '0.3rem' }}>◆ LIVE FEED</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {events.map((e, i) => (
          <div key={i} style={{
            fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace',
            padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
            animation: i === 0 ? 'fadeIn 0.3s ease' : 'none',
            opacity: 1 - i * 0.12,
          }}>{e}</div>
        ))}
      </div>
    </div>
  );
}

export default function CrimeDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLabel, setTimeLabel] = useState('');
  const [activeChart, setActiveChart] = useState('category');
  const [crimeFilter, setCrimeFilter] = useState('');
  const [simAlert, setSimAlert] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const { addNotification } = useNotifications();

  const fetchAll = useCallback(async () => {
    try {
      const [s, h, a, c, p] = await Promise.all([
        api.getCrimeStats(),
        api.getHotspots(),
        api.getAnomalies(),
        api.getCrimes({ limit: '50' }),
        api.getPatrols(),
      ]);
      setStats(s); setHotspots(h); setAnomalies(a);
      setCrimes(Array.isArray(c) ? c : c?.data || []);
      setPatrols(p);
      if (!stats) { setLoading(false); addNotification('success', 'SAHASRA KSP initialized — 1,000 records loaded'); }
    } catch {
      if (!stats) setLoading(false);
      addNotification('error', 'Connection issue — check backend');
    }
  }, []);

  useEffect(() => {
    setTimeLabel(new Date().toLocaleString('en-IN'));
    fetchAll();
    const ticker = setInterval(() => setTimeLabel(new Date().toLocaleString('en-IN')), 1000);
    return () => clearInterval(ticker);
  }, []);
  useAutoRefresh(fetchAll, 20000);

  // Simulated alert
  useEffect(() => {
    const showAlert = () => {
      const alerts = ['⚡ CRIME SPIKE: chain_snatching +18% in Koramangala', '🚨 REPEAT OFFENDER: suspect spotted near MG Road', '📍 NEW HOTSPOT: DBSCAN cluster detected in Whitefield', '📊 TREND ALERT: cyber_crime up 24% this quarter'];
      setSimAlert(alerts[Math.floor(Math.random() * alerts.length)]);
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 4000);
    };
    showAlert();
    const interval = setInterval(showAlert, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Initializing SAHASRA KSP systems...</span></div>;

  const donutData = (stats.bySeverity || []).map((s: any) => ({ label: s.severity, value: s.count, color: { heinous: '#ef4444', grave: '#f59e0b', petty: '#3b82f6' }[s.severity] || '#6b7280' }));
  const maxCat = Math.max(...stats.byCategory.map((x: any) => x.count));
  const categoryData = stats.byCategory.slice(0, 10).map((c: any) => ({ name: c.category.replace(/_/g, ' '), count: c.count, pct: ((c.count / stats.total) * 100).toFixed(1) }));
  const hourlyData = (stats.byTimeSlot || []).map((t: any) => ({ name: t.timeSlot.replace(/_/g, '\n'), count: t.count }));
  const filteredCrimes = crimeFilter ? crimes.filter((c: any) => c.category?.includes(crimeFilter) || c.status?.includes(crimeFilter)) : crimes;

  return (
    <div className="page dashboard-page" style={{ position: 'relative', zIndex: 1 }}>
      {/* Simulated alert banner */}
      {alertVisible && (
        <div style={{
          position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(239,68,68,0.7))',
          backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-md)', padding: '0.6rem 1.5rem',
          color: '#fff', fontSize: '0.8rem', fontWeight: 600,
          boxShadow: '0 4px 30px rgba(239,68,68,0.4)',
          animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem' }}>🚨</span>
          {simAlert}
        </div>
      )}

      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>
            <span className="glitch-text" data-text="SAHASRA KSP">SAHASRA KSP</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Crime Intelligence Platform</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
            <span>◆ {stats.total.toLocaleString()} RECORDS</span>
            <span>◆ {hotspots.length} HOTSPOTS</span>
            <span>◆ {patrols.filter((v: any) => v.status === 'active_patrol').length} PATROLS ACTIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="radar-container" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
            <span className="radar-dot" style={{ top: '30%', left: '40%' }} />
            <span className="radar-dot" style={{ top: '60%', left: '60%', animationDelay: '0.5s', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.3)' }} />
            <span className="radar-dot" style={{ top: '25%', left: '65%', animationDelay: '1s', background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.3)' }} />
          </div>
          <span className="live-indicator"><span className="live-dot" /> SCANNING</span>
          <span className="badge" style={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>{timeLabel}</span>
          <button className="btn-secondary btn-sm" onClick={fetchAll} style={{ fontSize: '0.65rem' }}>⟳ SYNC</button>
        </div>
      </header>

      {/* KPI Grid with animated counters */}
      <div className="kpi-grid" style={{ marginBottom: '1rem' }}>
        <div className="kpi-card today card-animated" style={{ borderTop: 'none' }}>
          <div className="kpi-top"><div className="kpi-icon blue">📊</div><span className="kpi-trend up"><AnimatedCounter value={stats.today || 0} /> today</span></div>
          <div className="kpi-value"><AnimatedCounter value={stats.today} /></div>
          <div className="kpi-label">Today's Reported Crimes</div>
        </div>
        <div className="kpi-card active card-animated">
          <div className="kpi-top"><div className="kpi-icon yellow">🔍</div><span className="kpi-trend down"><AnimatedCounter value={stats.activeCases} /> open</span></div>
          <div className="kpi-value"><AnimatedCounter value={stats.activeCases} /></div>
          <div className="kpi-label">Active Investigations</div>
        </div>
        <div className="kpi-card solved card-animated">
          <div className="kpi-top"><div className="kpi-icon green">✅</div><span className="kpi-trend up"><AnimatedCounter value={stats.solvedCases} decimals={0} /> solved</span></div>
          <div className="kpi-value"><AnimatedCounter value={stats.clearanceRate || 0} decimals={1} />%</div>
          <div className="kpi-label">Case Clearance Rate</div>
        </div>
        <div className="kpi-card response card-animated">
          <div className="kpi-top"><div className="kpi-icon purple">⏱️</div></div>
          <div className="kpi-value"><AnimatedCounter value={stats.avgResponseTime || 0} decimals={0} /> <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>min</span></div>
          <div className="kpi-label">Avg Police Response</div>
        </div>
        <div className="kpi-card total card-animated">
          <div className="kpi-top"><div className="kpi-icon cyan">📁</div></div>
          <div className="kpi-value"><AnimatedCounter value={+(stats.total / 1000).toFixed(1)} decimals={1} />K</div>
          <div className="kpi-label">Total Crime Database</div>
        </div>
        <div className="kpi-card blue card-animated">
          <div className="kpi-top"><div className="kpi-icon green">🚔</div></div>
          <div className="kpi-value"><AnimatedCounter value={patrols.filter((v: any) => v.status === 'active_patrol').length} /></div>
          <div className="kpi-label">Active Patrol Units</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Category Chart */}
        <div className="card full-width card-holo" style={{ position: 'relative' }}>
          <div className="card-header">
            <h3>CRIME CATEGORY ANALYSIS <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 400 }}>// BENGALURU URBAN</span></h3>
            <div className="controls" style={{ gap: '0.25rem' }}>
              {['category', 'pie', 'area'].map(v => (
                <button key={v}
                  style={{
                    padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'monospace',
                    background: activeChart === v ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                    color: activeChart === v ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid ' + (activeChart === v ? 'var(--accent-blue)' : 'var(--border)'),
                    borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onClick={() => setActiveChart(v)}>{v.toUpperCase()}</button>
              ))}
            </div>
          </div>
          {activeChart === 'category' && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 5, right: 15, left: 0, bottom: 50 }} barCategoryGap="20%">
                <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#555e7a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.7rem' }} formatter={(v: number) => [v.toLocaleString(), 'Incidents']} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={35}>
                  {categoryData.map((_, i) => <Cell key={i} fill={`hsl(${220 - i * 12}, 70%, ${55 - i * 1.5}%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {activeChart === 'pie' && (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 220, alignItems: 'center' }}>
              <PieChart width={240} height={220}>
                <Pie data={categoryData.slice(0, 8)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#555e7a' }}>
                  {categoryData.slice(0, 8).map((_, i) => <Cell key={i} fill={`hsl(${220 - i * 15}, 65%, 55%)`} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff' }} />
              </PieChart>
            </div>
          )}
          {activeChart === 'area' && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} /></linearGradient></defs>
                <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 9 }} />
                <YAxis tick={{ fill: '#555e7a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.7rem' }} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 2, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Operations Panel — multi-tasking */}
        <div className="full-width">
          <OperationsPanel />
        </div>

        {/* Severity + Time */}
        <div className="card card-holo">
          <div className="card-header"><h3>SEVERITY DISTRIBUTION</h3></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
              {(() => { const t = donutData.reduce((s, d) => s + d.value, 0) || 1; let o = 0; const c = 2 * Math.PI * 40;
                return donutData.filter(d => d.value / t > 0.01).map((d, i) => {
                  const l = (d.value / t) * c; const seg = { ...d, o, l }; o += l;
                  return <circle key={i} cx="55" cy="55" r="40" fill="none" stroke={seg.color} strokeWidth="12"
                    strokeDasharray={`${seg.l} ${c - seg.l}`} strokeDashoffset={-seg.o}
                    transform={`rotate(-90 55 55)`} style={{ transition: 'all 0.6s ease' }} />;
                });
              })()}
              <text x="55" y="52" textAnchor="middle" fill="var(--text-primary)" fontSize="1.2rem" fontWeight="800">{stats.total.toLocaleString()}</text>
              <text x="55" y="65" textAnchor="middle" fill="var(--text-secondary)" fontSize="0.5rem">TOTAL</text>
            </svg>
            <div>
              {donutData.map(d => (
                <div key={d.label} className="donut-legend-item" style={{ padding: '0.2rem 0' }}>
                  <span className="donut-legend-dot" style={{ background: d.color }} />
                  <span style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>{d.label}</span>
                  <span className="donut-legend-count">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-holo">
          <div className="card-header"><h3>TIME PATTERN // 24H</h3></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 8 }} />
              <YAxis tick={{ fill: '#555e7a', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.7rem' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={30}>
                {hourlyData.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1', '#818cf8'][i % 5]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hotspots */}
        <div className="card card-holo">
          <div className="card-header"><h3>ACTIVE HOTSPOTS</h3><span className="badge" style={{ fontSize: '0.6rem' }}>{hotspots.length} CLUSTERS</span></div>
          {hotspots.length === 0 ? <p className="empty-state">No hotspots</p> : (
            hotspots.slice(0, 6).map((h, i) => (
              <div key={i} className="hotspot-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className={`severity-dot ${h.severity}`} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{h.category}</strong>
                  <span className="hotspot-meta">{h.crimeCount} incidents · d={h.density?.toFixed(3)}</span>
                </div>
                <span className="hotspot-count">{h.crimeCount}</span>
              </div>
            ))
          )}
        </div>

        {/* Anomalies */}
        <div className="card card-holo">
          <div className="card-header"><h3>ANOMALY DETECTION</h3>
            {anomalies.length > 0 && <span className="badge-danger" style={{ fontSize: '0.6rem', animation: 'pulseGlow 2s infinite' }}>{anomalies.filter((a: any) => a.severity === 'critical').length} CRITICAL</span>}
          </div>
          {anomalies.length === 0 ? <p className="empty-state">No anomalies</p> : (
            anomalies.slice(0, 6).map((a, i) => (
              <div key={i} className={`anomaly-item ${a.severity}`}>
                <span className="anomaly-icon">{a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : 'ℹ️'}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.75rem' }}>{a.description || a.category}</strong>
                  <span className="anomaly-meta">{a.beats?.join(', ') || a.district}</span>
                </div>
                <span className={`anomaly-change ${a.changePercent > 0 ? 'positive' : 'negative'}`}>
                  {a.changePercent > 0 ? '+' : ''}{a.changePercent?.toFixed(0)}%
                </span>
              </div>
            ))
          )}
        </div>

        {/* Live Feed + Recent Crimes */}
        <div className="card full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div style={{ borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
            <LiveFeed />
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', marginBottom: '0.3rem' }}>◆ SYSTEM METRICS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                <span>UPTIME: {Math.floor(Date.now() / 1000 % 86400 / 3600)}h{Math.floor(Date.now() / 1000 % 3600 / 60)}m</span>
                <span>NODES: {(anomalies.length + hotspots.length + patrols.length)}</span>
                <span>PATROLS: {patrols.length}</span>
                <span>ANOMALIES: {anomalies.length}</span>
                <span>CLUSTERS: {hotspots.length}</span>
                <span>QUEUE: 0</span>
              </div>
            </div>
          </div>
          <div>
            <div className="card-header" style={{ marginBottom: '0.5rem' }}>
              <h3>RECENT INCIDENTS</h3>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input type="text" placeholder="Filter..." className="input"
                  style={{ width: '120px', padding: '0.2rem 0.4rem', fontSize: '0.65rem', margin: 0, fontFamily: 'monospace' }}
                  value={crimeFilter} onChange={e => setCrimeFilter(e.target.value)} />
                <span className="badge" style={{ fontSize: '0.55rem' }}>{filteredCrimes.length}</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto', fontSize: '0.65rem', fontFamily: 'monospace', maxHeight: '180px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.25rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>FIR#</th>
                  <th style={{ padding: '0.25rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.25rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '0.25rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Sev</th>
                  <th style={{ padding: '0.25rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                </tr></thead>
                <tbody>
                  {filteredCrimes.slice(0, 8).map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.25rem 0.4rem', color: 'var(--accent-cyan)' }}>{c.firNumber || '—'}</td>
                      <td style={{ padding: '0.25rem 0.4rem', color: 'var(--text-secondary)' }}>{c.category?.replace(/_/g, ' ') || '—'}</td>
                      <td style={{ padding: '0.25rem 0.4rem', color: 'var(--text-secondary)' }}>{c.beat || '—'}</td>
                      <td style={{ padding: '0.25rem 0.4rem' }}>
                        <span style={{ color: c.severity === 'heinous' ? '#ef4444' : c.severity === 'grave' ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                          {c.severity?.charAt(0).toUpperCase() || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.25rem 0.4rem', color: 'var(--text-secondary)' }}>{c.status?.replace(/_/g, ' ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
