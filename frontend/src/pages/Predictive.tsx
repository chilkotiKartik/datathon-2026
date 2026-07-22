import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';

function RiskGauge({ score, size = 48 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.min(score, 100);
  const len = (pct / 100) * c;
  const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
      strokeDasharray={`${len} ${c - len}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
      style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color} fontSize="1rem" fontWeight="800">{pct.toFixed(0)}</text>
  </svg>;
}

export default function Predictive() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [predFilter, setPredFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.getPredictions(),
      api.getAnomalies(),
      api.getTrends(),
    ]).then(([p, a, t]) => {
      setPredictions(p.slice(0, 12));
      setAnomalies(a.slice(0, 10));
      setTrends(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading AI Predictions...</span></div>;

  const filteredPreds = predFilter === 'all' ? predictions : predictions.filter(p => (p.riskLevel || '').toLowerCase() === predFilter);
  const avgRisk = predictions.length ? predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length : 0;
  const highRiskCount = predictions.filter(p => p.riskScore > 70).length;
  const trendCounts = (trends || []).map(t => t.count || 0);

  const riskBar = (score: number) => {
    const color = score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#22c55e';
    return <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: `${score}%`, background: color }} /></div>;
  };

  const riskBreakdown = [
    { name: 'Critical', value: predictions.filter(p => p.riskScore > 80).length, fill: '#ef4444' },
    { name: 'High', value: predictions.filter(p => p.riskScore > 60 && p.riskScore <= 80).length, fill: '#f59e0b' },
    { name: 'Moderate', value: predictions.filter(p => p.riskScore > 40 && p.riskScore <= 60).length, fill: '#8b5cf6' },
    { name: 'Low', value: predictions.filter(p => p.riskScore <= 40).length, fill: '#22c55e' },
  ];

  return (
    <div className="page predictive-page">
      <header className="page-header">
        <h2>AI Predictive Intelligence <span className="badge">Next 7 Days Forecast</span></h2>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card today">
          <div className="kpi-top"><div className="kpi-icon purple">🎯</div></div>
          <div className="kpi-value">{filteredPreds.length}</div>
          <div className="kpi-label">Prediction Zones</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-top"><div className="kpi-icon red">⚠️</div>{highRiskCount > 0 && <span className="kpi-trend down">{highRiskCount} critical</span>}</div>
          <div className="kpi-value">{highRiskCount}</div>
          <div className="kpi-label">High Risk Areas</div>
        </div>
        <div className="kpi-card solved">
          <div className="kpi-top"><div className="kpi-icon green">📉</div></div>
          <div className="kpi-value">{avgRisk.toFixed(0)}</div>
          <div className="kpi-label">Avg Risk Score</div>
        </div>
        <div className="kpi-card total">
          <div className="kpi-top"><div className="kpi-icon cyan">📅</div></div>
          <div className="kpi-value">{trends.length}</div>
          <div className="kpi-label">Days Analyzed</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <div className="card-header">
            <h3>Risk Predictions</h3>
            <div className="controls" style={{ gap: '0.25rem' }}>
              {['all', 'high', 'moderate', 'low'].map(f => (
                <button key={f} className={`btn-secondary btn-sm ${predFilter === f ? 'btn-primary' : ''}`}
                  style={predFilter === f ? { background: 'var(--accent-blue)', color: '#fff', border: 'none' } : {}}
                  onClick={() => setPredFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
          {filteredPreds.length === 0 && predictions.length === 0
            ? <p className="empty-state">No predictions available</p>
            : filteredPreds.length === 0
              ? <p className="empty-state">No {predFilter} risk predictions</p>
              : <div className="prediction-list">
                {filteredPreds.map((p, i) => (
                  <div key={i} className="prediction-item">
                    <div className="prediction-header">
                      <span className={`risk-badge ${p.riskLevel?.toLowerCase() || (p.riskScore > 70 ? 'high' : p.riskScore > 40 ? 'moderate' : 'low')}`}>
                        {p.riskLevel || (p.riskScore > 70 ? 'HIGH' : p.riskScore > 40 ? 'MODERATE' : 'LOW')}
                      </span>
                      <strong>{p.beat || p.zone || p.district || `Zone ${i + 1}`}</strong>
                      <span className="confidence">{p.confidence ? `${(p.confidence * 100).toFixed(0)}%` : `${p.riskScore?.toFixed(0)}/100`}</span>
                      <RiskGauge score={p.riskScore || 50} size={42} />
                    </div>
                    {riskBar(p.riskScore || 50)}
                    <div className="prediction-details">
                      <span>Peak: {p.timeSlot || p.peakTime || 'N/A'}</span>
                      <span>Type: {p.predictedCategories?.join(', ') || p.category || 'Multiple'}</span>
                      {p.recommendation && <span className="recommendation">💡 {p.recommendation}</span>}
                    </div>
                  </div>
                ))}
              </div>}
        </div>

        <div className="card">
          <div className="card-header"><h3>Risk Level Breakdown</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
            {riskBreakdown.filter(d => d.value > 0).map(d => (
              <div key={d.name} className="bar-row">
                <span className="bar-label">{d.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.value / Math.max(1, ...riskBreakdown.map(x => x.value))) * 100}%`, background: d.fill }} />
                </div>
                <span className="bar-value">{d.value}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={riskBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={12}>
                {riskBreakdown.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Anomaly Detection</h3>
            {anomalies.length > 0 && <span className="badge-danger">{anomalies.filter(a => a.severity === 'critical').length} critical</span>}
          </div>
          {anomalies.length === 0 ? <p className="empty-state">No anomalies</p> : (
            anomalies.slice(0, 8).map((a, i) => (
              <div key={i} className={`anomaly-item ${a.severity}`}>
                <span className="anomaly-icon">{a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : 'ℹ️'}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.78rem' }}>{a.description || a.category}</strong>
                  <span className="anomaly-meta">{a.category} | ±{a.changePercent?.toFixed(0)}% vs avg</span>
                </div>
                <span className={`anomaly-change ${a.changePercent > 0 ? 'positive' : 'negative'}`}>
                  {a.changePercent > 0 ? '+' : ''}{a.changePercent?.toFixed(0)}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card full-width">
          <div className="card-header"><h3>Crime Trend Forecast</h3></div>
          {trends.length === 0 ? <p className="empty-state">No trend data</p> : (
            <>
              <div className="trend-summary" style={{ marginBottom: '1rem' }}>
                <div className="trend-stat"><span className="trend-value">{trends.length}</span><span className="trend-label">Days</span></div>
                <div className="trend-stat"><span className="trend-value">{trends.reduce((s, t) => s + (t.count || 0), 0).toLocaleString()}</span><span className="trend-label">Total</span></div>
                <div className="trend-stat">
                  <span className="trend-value">{trends.filter(t => t.clearanceRate).length > 0
                    ? (trends.filter(t => t.clearanceRate).reduce((s, t) => s + t.clearanceRate, 0) / trends.filter(t => t.clearanceRate).length).toFixed(1) + '%'
                    : 'N/A'}</span>
                  <span className="trend-label">Avg Clearance</span>
                </div>
                <div className="trend-stat"><span className="trend-value">{trendCounts.length > 1 ? Math.round(trendCounts[trendCounts.length - 1] / (trendCounts[0] || 1) * 100 - 100) : 0}%</span><span className="trend-label">Change</span></div>
              </div>
              {trendCounts.length >= 2 && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trends.map((t, i) => ({ day: i + 1, count: t.count || 0 }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} /></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fill: '#8892b0', fontSize: 10 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fill: '#555e7a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#555e7a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3550', borderRadius: '8px', color: '#f0f4ff', fontSize: '0.75rem' }} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#tGrad)" dot={{ r: 2, fill: '#8b5cf6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
