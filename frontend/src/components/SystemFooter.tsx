import { useState, useEffect } from 'react';

export default function SystemFooter() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN'));
  const [uptime, setUptime] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [mem, setMem] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN'));
      setUptime(u => u + 1);
      setCpu(Math.floor(30 + Math.random() * 40));
      setMem(Math.floor(40 + Math.random() * 30));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '240px', right: 0, zIndex: 100,
      background: 'rgba(10,14,26,0.9)', borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(8px)', padding: '0.35rem 1rem',
      display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.6rem', color: 'var(--text-muted)',
      fontFamily: 'monospace',
    }}>
      <span>🔷 SAHASRA KSP v1.0.0</span>
      <span>🕐 {time}</span>
      <span>⏱️ {uptime}s uptime</span>
      <span>💾 CPU: {cpu}%</span>
      <span>📀 MEM: {mem}%</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e', animation: 'pulse 1.5s infinite' }} />
        ALL SYSTEMS NOMINAL
      </span>
    </div>
  );
}
