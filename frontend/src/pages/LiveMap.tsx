import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import { api } from '../api/client';
import { useAutoRefresh } from '../components/NotificationProvider';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; OSM, CARTO';

function MapUpdater({ onReady }: { onReady: (map: any) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map]);
  return null;
}

const CATEGORY_COLORS: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#3b82f6',
  heinous: '#ef4444', grave: '#f59e0b', petty: '#3b82f6', critical: '#ef4444',
};

const CATEGORIES = ['all', 'theft', 'vehicle_theft', 'assault', 'chain_snatching', 'burglary', 'cyber_crime', 'fraud', 'robbery'];

export default function LiveMap() {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(72);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [showPatrols, setShowPatrols] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAll = useCallback(async () => {
    const [h, pat] = await Promise.all([
      api.getHotspots('Bengaluru Urban', 'dbscan'),
      api.getPatrols(),
    ]);
    setHotspots(h);
    setPatrols(pat);
    try {
      const c = await api.getCrimes({ limit: '200' });
      setCrimes(Array.isArray(c) ? c : c?.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [timeRange]);
  useAutoRefresh(fetchAll, 30000);

  const filteredHotspots = selectedCategory === 'all' ? hotspots : hotspots.filter((h: any) => h.category === selectedCategory);
  const filteredCrimes = crimes.filter((c: any) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery && !c.beat?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.firNumber?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const severityBreakdown = hotspots.reduce((acc: any, h: any) => {
    acc[h.severity] = (acc[h.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(severityBreakdown).map(([k, v]) => ({ name: k, value: v, color: CATEGORY_COLORS[k] || '#6b7280' }));

  return (
    <div className="page map-page">
      <header className="page-header">
        <h2>Live Crime Intelligence Map <span className="badge">Bengaluru</span></h2>
        <div className="controls">
          <span className="live-indicator"><span className="live-dot" /> LIVE</span>
          <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))}>
            <option value={24}>24h</option><option value={72}>72h</option><option value={168}>7d</option><option value={720}>30d</option>
          </select>
        </div>
      </header>

      <div className="legend-bar">
        <span className="legend-item"><span className="dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} /> Heinous</span>
        <span className="legend-item"><span className="dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} /> Grave</span>
        <span className="legend-item"><span className="dot" style={{ background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} /> Petty</span>
        <span className="legend-item"><span className="dot" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} /> Patrol</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '0.5rem' }}>
          <input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} /> Hotspots
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPatrols} onChange={e => setShowPatrols(e.target.checked)} /> Patrols
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="controls">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <option value="all">All Categories</option>
            {CATEGORIES.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <input type="text" placeholder="Search area or FIR #..." className="input"
          style={{ width: '200px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', margin: 0 }}
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>🏘️ {filteredCrimes.length} crimes</span>
          <span>📍 {filteredHotspots.length} clusters</span>
          <span>🚔 {patrols.filter(v => v.status === 'active_patrol').length} active</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div className="map-container" style={{ flex: 1, minHeight: '400px' }}>
          <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={DARK_TILE} attribution={ATTR} />
            <MapUpdater onReady={setMap} />
            {showHotspots && filteredHotspots.map((h, i) => (
              <Circle key={`hs-${i}`} center={[h.centerLat, h.centerLng]}
                radius={h.radius || 500}
                pathOptions={{ color: CATEGORY_COLORS[h.severity] || '#6b7280', fillColor: CATEGORY_COLORS[h.severity] || '#6b7280', fillOpacity: 0.2, weight: 2 }}
                eventHandlers={{ click: () => setSelectedHotspot(h) }}>
                <Popup><div style={{ minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 6px', color: CATEGORY_COLORS[h.severity], textTransform: 'capitalize' }}>{h.category}</h4>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr><td style={{ padding: '2px 4px', color: '#8892b0' }}>Incidents:</td><td style={{ padding: '2px 4px', fontWeight: 700, textAlign: 'right' }}>{h.crimeCount}</td></tr>
                      <tr><td style={{ padding: '2px 4px', color: '#8892b0' }}>Severity:</td><td style={{ padding: '2px 4px', color: CATEGORY_COLORS[h.severity], fontWeight: 700, textAlign: 'right', textTransform: 'capitalize' }}>{h.severity}</td></tr>
                      <tr><td style={{ padding: '2px 4px', color: '#8892b0' }}>Density:</td><td style={{ padding: '2px 4px', textAlign: 'right' }}>{h.density?.toFixed(4)}</td></tr>
                      <tr><td style={{ padding: '2px 4px', color: '#8892b0' }}>Radius:</td><td style={{ padding: '2px 4px', textAlign: 'right' }}>{h.radius?.toFixed(0)}m</td></tr>
                    </tbody>
                  </table>
                </div></Popup>
              </Circle>
            ))}
            {showPatrols && patrols.filter(v => v.status === 'active_patrol').map((v, i) => (
              <Circle key={`pat-${i}`} center={[v.latitude, v.longitude]} radius={120}
                pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.6 }}>
                <Popup><div>
                  <h4 style={{ margin: '0 0 6px', color: '#22c55e' }}>{v.vanNumber}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#8892b0' }}>Officer: {v.officerInCharge}<br />Zone: {v.zone}<br />Shift: {v.shift}</p>
                </div></Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="hotspot-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>DBSCAN Clusters ({filteredHotspots.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {pieData.length > 0 && <ResponsiveContainer width={60} height={30}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={14} innerRadius={8}>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie></PieChart></ResponsiveContainer>}
            <span className="badge">{timeRange}h</span>
          </div>
        </div>
        {filteredHotspots.length === 0 ? <p className="empty-state">No clusters found</p> : (
          filteredHotspots.map((h, i) => (
            <div key={i} className="hotspot-card"
              style={{ borderLeftColor: CATEGORY_COLORS[h.severity] || '#6b7280', cursor: 'pointer' }}
              onClick={() => { setSelectedHotspot(h); map?.flyTo([h.centerLat, h.centerLng], 14); }}>
              <div className="hotspot-header">
                <span className={`severity-tag ${h.severity}`}>{h.severity.toUpperCase()}</span>
                <strong style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}>{h.category}</strong>
              </div>
              <div className="hotspot-details">
                <span>{h.crimeCount} crimes</span>
                <span>ø {h.radius?.toFixed(0)}m</span>
                {h.beats?.length > 0 && <span>{h.beats.slice(0, 2).join(', ')}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
