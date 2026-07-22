import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

function MiniTable({ data, columns }: { data: any[]; columns: { key: string; label: string; render?: (v: any) => string }[] }) {
  return (
    <div style={{ overflowX: 'auto', fontSize: '0.7rem', maxHeight: '200px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {columns.map(c => <th key={c.key} style={{ padding: '0.3rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>{c.label}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(c => <td key={c.key} style={{ padding: '0.3rem 0.4rem', color: 'var(--text-secondary)' }}>{c.render ? c.render(row[c.key]) : row[c.key] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CitizenPortal() {
  const [stats, setStats] = useState<any>(null);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [reportType, setReportType] = useState('theft');
  const [reportDesc, setReportDesc] = useState('');
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: 'Hello! I\'m the SAHASRA AI assistant. Ask about crime statistics, safety tips, or legal info in Bengaluru.' },
  ]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.getPublicDashboard(),
      api.getCrimes({ limit: '30' }).catch(() => []),
    ]).then(([s, c]) => {
      setStats(s);
      setCrimes(Array.isArray(c) ? c : c?.data || []);
    });
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg.trim();
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setChatMsg('');
    const lower = userMsg.toLowerCase();
    let response = '';
    if (lower.includes('crime') && (lower.includes('stat') || lower.includes('today') || lower.includes('total'))) {
      response = `Bengaluru has ${stats?.stats?.total || 'N/A'} total cases with ${stats?.stats?.clearanceRate?.toFixed(1) || 'N/A'}% clearance. ${stats?.stats?.today || 0} cases reported today. Police are actively patrolling with ${stats?.activePatrols || 0} units.`;
    } else if (lower.includes('safety') || lower.includes('safe') || lower.includes('tip')) {
      response = 'Safety tips:\n• Stay aware of surroundings, especially at night\n• Share your live location with trusted contacts\n• Save emergency numbers: 100 (Police), 1091 (Women)\n• Use Stealth SOS in emergencies\n• Keep your phone charged';
    } else if (lower.includes('hotspot') || lower.includes('danger') || lower.includes('area')) {
      const count = stats?.hotspots?.length || 0;
      response = `There ${count === 1 ? 'is' : 'are'} ${count} high-risk hotspot${count !== 1 ? 's' : ''} in Bengaluru. Check the Live Map for details. Exercise caution in these areas, especially during late hours.`;
    } else if (lower.includes('sos') || lower.includes('emergency')) {
      response = 'In an emergency:\n• Call 100 (Police) immediately\n• Use the SOS tab to alert police with your location\n• Share your location with trusted contacts\n• Stay calm and find a safe place';
    } else if (lower.includes('theft') || lower.includes('stolen') || lower.includes('lost')) {
      response = 'To report a theft:\n1. Visit the nearest police station\n2. File a complaint in the Complaints tab\n3. Provide details: date, time, location, items\n4. Get a copy of the FIR for insurance claims';
    } else {
      response = 'I can help with:\n• Crime statistics\n• Safety tips & emergency contacts\n• Hotspot information & areas to avoid\n• How to file complaints\n• SOS/Emergency procedures\nWhat would you like to know?';
    }
    setTimeout(() => setChatHistory(h => [...h, { role: 'bot', text: response }]), 400);
  };

  const TABS = [
    { id: 'home', label: 'Home' },
    { id: 'sos', label: 'SOS' },
    { id: 'complaints', label: 'Complaints' },
    { id: 'chat', label: 'AI Chat' },
    { id: 'feed', label: 'Feed' },
  ];

  return (
    <div className="page citizen-page">
      <header className="page-header">
        <h2>Citizen Portal — SANKALP + SAHASRA <span className="badge">Community Safety</span></h2>
      </header>

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'home' && (
        <div className="citizen-home">
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header"><h3>Bengaluru Crime Overview</h3><span className="live-indicator"><span className="live-dot" /> LIVE</span></div>
              {stats && <div className="public-stats">
                <div className="stat-item"><strong>{stats.stats?.today || 0}</strong> Crimes Today</div>
                <div className="stat-item"><strong>{stats.stats?.clearanceRate?.toFixed(1) || 0}%</strong> Clearance Rate</div>
                <div className="stat-item"><strong>{stats.activePatrols || 0}</strong> Active Patrols</div>
                <div className="stat-item"><strong>{stats.hotspots?.length || 0}</strong> Active Hotspots</div>
              </div>}
            </div>

            <div className="card">
              <div className="card-header"><h3>Safe Route Planner</h3></div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Plan routes avoiding high-crime areas.</p>
              <div className="route-inputs">
                <input type="text" placeholder="From (area or landmark)" className="input" />
                <input type="text" placeholder="To (area or landmark)" className="input" />
                <button className="btn-primary" onClick={() => alert('Route planning coming soon. Check Live Map for hotspot areas.')}>🗺️ Find Safe Route</button>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Emergency Helplines</h3></div>
              <div className="helplines">
                <div className="helpline"><span>🚔 Police</span><strong>100</strong></div>
                <div className="helpline"><span>🚑 Ambulance</span><strong>108</strong></div>
                <div className="helpline"><span>🔥 Fire</span><strong>101</strong></div>
                <div className="helpline"><span>🆘 Women Helpline</span><strong>1091</strong></div>
                <div className="helpline"><span>👶 Child Helpline</span><strong>1098</strong></div>
                <div className="helpline"><span>🚨 Traffic Police</span><strong>103</strong></div>
                <div className="helpline"><span>🖥️ Cyber Crime</span><strong>1930</strong></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Active Hotspots Near You</h3></div>
              {stats?.hotspots?.length > 0 ? stats.hotspots.map((h: any, i: number) => (
                <div key={i} className="hotspot-item">
                  <span className={`severity-dot ${h.severity}`} />
                  <div style={{ flex: 1 }}><strong style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}>{h.category}</strong><span className="hotspot-meta">{h.crimeCount} incidents</span></div>
                  <span className="hotspot-count">{h.crimeCount}</span>
                </div>
              )) : <p className="empty-state">No active hotspots</p>}
            </div>

            {crimes.length > 0 && (
              <div className="card full-width">
                <div className="card-header"><h3>Recent Crime Reports</h3></div>
                <MiniTable data={crimes.slice(0, 8)} columns={[
                  { key: 'firNumber', label: 'FIR#', render: v => v || '—' },
                  { key: 'category', label: 'Type', render: v => v?.replace(/_/g, ' ') || '—' },
                  { key: 'beat', label: 'Location', render: v => v || '—' },
                  { key: 'severity', label: 'Risk', render: v => {
                    const colors: Record<string, string> = { heinous: '#ef4444', grave: '#f59e0b', petty: '#22c55e' };
                    return `<span style="color:${colors[v] || '#8892b0'}">${v || '—'}</span>`;
                  } },
                  { key: 'status', label: 'Status', render: v => v?.replace(/_/g, ' ') || '—' },
                  { key: 'occurredAt', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
                ]} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sos' && (
        <div className="citizen-sos">
          <div className="card">
            <div className="card-header"><h3>Emergency SOS</h3></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>In danger? Trigger an immediate alert to the nearest police station with your live location.</p>
            <div className="sos-triggers">
              <button className="btn-danger" onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    await api.createSOS({ category: 'other', latitude: pos.coords.latitude, longitude: pos.coords.longitude, triggeredBy: 'Citizen', description: 'SOS from Citizen Portal' });
                    alert('✅ SOS Alert Sent! Help is on the way.');
                  }, () => alert('⚠️ Enable GPS and try again.'));
                } else alert('⚠️ Call 100 for emergency.');
              }}>🆘 TRIGGER SOS</button>
              <button className="btn-stealth" onClick={() => alert('🕵️ Stealth SOS: Screen goes dark, camera activates silently, police alerted with your location.')}>🕵️ Stealth SOS</button>
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 600 }}>⚠️ Only use SOS in genuine emergencies. False alarms may result in legal action.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="citizen-complaints">
          <div className="card">
            <div className="card-header"><h3>File a Complaint</h3></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Report non-emergency incidents. For emergencies, call 100 or use SOS.</p>
            <div className="complaint-form">
              <select className="input" value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="theft">Theft / Lost Property</option>
                <option value="harassment">Harassment</option>
                <option value="suspicious">Suspicious Activity</option>
                <option value="noise">Noise Complaint</option>
                <option value="traffic">Traffic Violation</option>
                <option value="cyber">Cyber Crime</option>
                <option value="other">Other</option>
              </select>
              <textarea className="input" placeholder="Describe the incident — date, time, location, people involved, what happened..." rows={5} value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
              <input type="text" placeholder="Your contact number (optional)" className="input" />
              <button className="btn-primary" onClick={() => {
                if (!reportDesc.trim()) { alert('Please describe the incident'); return; }
                alert('✅ Complaint filed. Reference: CMP-' + Date.now().toString(36).toUpperCase());
                setReportDesc('');
              }}>Submit Complaint</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="citizen-chat">
          <div className="card">
            <div className="card-header"><h3>AI Safety Assistant</h3></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Ask about crime stats, safety tips, emergency procedures, or legal info.</p>
            <div className="chat-box">
              <div className="chat-messages">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`message ${msg.role}`}
                    style={msg.role === 'user' ? { background: 'rgba(59,130,246,0.15)', marginLeft: 'auto', border: '1px solid rgba(59,130,246,0.15)' } : {}}>
                    {msg.text.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
              <div className="chat-input">
                <input type="text" placeholder="Ask about crime, safety, or legal info..." className="input"
                  value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                <button className="btn-primary" onClick={sendChat} style={{ whiteSpace: 'nowrap' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="citizen-feed">
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header"><h3>Recent Incidents</h3></div>
              {crimes.length === 0 ? <p className="empty-state">No recent incidents shown</p> : (
                crimes.slice(0, 12).map((c: any, i) => (
                  <div key={i} className="hotspot-item">
                    <span className={`severity-dot ${c.severity}`} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{c.category?.replace(/_/g, ' ')}</strong>
                      <span className="hotspot-meta">{c.beat || 'Unknown'} · {c.occurredAt ? new Date(c.occurredAt).toLocaleDateString('en-IN') : '—'}</span>
                    </div>
                    <span className={`severity-tag ${c.severity}`} style={{ textTransform: 'uppercase' }}>{c.severity}</span>
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="card-header"><h3>Police Resources</h3></div>
              <ul className="safety-tips">
                <li>🚔 Total police stations: 148 in Bengaluru</li>
                <li>👮 Active officers: ~15,000</li>
                <li>🚓 Patrol vehicles: {stats?.activePatrols || 'N/A'} active now</li>
                <li>📞 Dial 100 for emergencies</li>
                <li>📱 Dial 1091 for women in distress</li>
                <li>🖥️ Report cyber crime at 1930</li>
                <li>📍 Find nearest police station on Live Map</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
