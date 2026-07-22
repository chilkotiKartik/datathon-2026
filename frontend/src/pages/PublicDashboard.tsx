import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function PublicDashboard() {
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [timeLabel, setTimeLabel] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setTimeLabel(new Date().toLocaleString('en-IN'));
      const [d, t] = await Promise.all([
        api.getPublicDashboard(),
        api.getTrends().catch(() => []),
      ]);
      setData(d);
      setTrends(Array.isArray(t) ? t : []);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="loading"><div className="spinner" /><span>Loading Public Dashboard...</span></div>;

  const maxCount = data.stats?.byCategory ? Math.max(...data.stats.byCategory.map((x: any) => x.count)) : 1;
  const trendData = (trends || []).slice(-14).map((t, i) => ({ day: i + 1, count: t.count || 0 }));
  const totalFromTrends = (trends || []).reduce((s, t) => s + (t.count || 0), 0);

  return (
    <div style={{ marginLeft: '240px', padding: '1.5rem 2rem', minHeight: '100vh' }}><div className="page public-page">
      <header className="page-header">
        <h2>Public Crime Dashboard <span className="badge">Bengaluru Urban</span></h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/login" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>🔐 Police Login →</a>
          <span className="badge" style={{ fontSize: '0.65rem', fontWeight: 400 }}>Updated: {timeLabel}</span>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card today">
          <div className="kpi-top"><div className="kpi-icon blue">📊</div></div>
          <div className="kpi-value">{data.stats?.today || 0}</div>
          <div className="kpi-label">Crimes Today</div>
        </div>
        <div className="kpi-card solved">
          <div className="kpi-top"><div className="kpi-icon green">✅</div></div>
          <div className="kpi-value">{data.stats?.clearanceRate?.toFixed(1) || 0}%</div>
          <div className="kpi-label">Police Clearance Rate</div>
        </div>
        <div className="kpi-card total">
          <div className="kpi-top"><div className="kpi-icon cyan">🚔</div></div>
          <div className="kpi-value">{data.activePatrols || 0}</div>
          <div className="kpi-label">Active Patrol Vans</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-top"><div className="kpi-icon yellow">📍</div></div>
          <div className="kpi-value">{data.hotspots?.length || 0}</div>
          <div className="kpi-label">High-Risk Locations</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <div className="card-header"><h3>Crime Category Distribution</h3></div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              {(data.stats?.byCategory || []).slice(0, 10).map((c: any, i: number) => (
                <div key={i} className="bar-row">
                  <span className="bar-label">{c.category.replace(/_/g, ' ')}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(c.count / maxCount) * 100}%`, background: `linear-gradient(90deg, hsl(${200 - i * 14}, 65%, 55%), hsl(${200 - i * 14 + 20}, 65%, 42%))` }} /></div>
                  <span className="bar-value">{c.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {trendData.length >= 2 && (
              <div style={{ width: '280px', flexShrink: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>14-Day Crime Trend</p>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={trendData}>
                    <defs><linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} /></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fill: '#555e7a', fontSize: 8 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.75rem' }} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#pubGrad)" dot={{ r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span>14 days ago</span>
                  <span>{totalFromTrends.toLocaleString()} total</span>
                  <span>Today</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card full-width">
          <div className="card-header"><h3>Emergency Contacts & Safety</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <ul className="safety-tips">
                <li>🚶 Stay aware of your surroundings, especially at night</li>
                <li>🔒 Keep your phone charged and accessible</li>
                <li>📍 Share your live location with trusted contacts</li>
                <li>🚨 Save 100 (Police) and 1091 (Women Helpline)</li>
                <li>🆘 Use Stealth SOS if you feel unsafe</li>
                <li>🔍 Report suspicious activity to authorities</li>
              </ul>
            </div>
            <div>
              <div className="helplines">
                <div className="helpline"><span>🚔 Police Emergency</span><strong>100</strong></div>
                <div className="helpline"><span>🚑 Ambulance</span><strong>108</strong></div>
                <div className="helpline"><span>🔥 Fire Services</span><strong>101</strong></div>
                <div className="helpline"><span>🆘 Women Helpline</span><strong>1091</strong></div>
                <div className="helpline"><span>👶 Child Helpline</span><strong>1098</strong></div>
                <div className="helpline"><span>🚨 Traffic Police</span><strong>103</strong></div>
                <div className="helpline"><span>🆘 Cyber Crime</span><strong>1930</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  );
}
