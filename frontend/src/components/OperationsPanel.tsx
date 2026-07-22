import { useState, useEffect, useRef } from 'react';

interface Task {
  id: string;
  name: string;
  status: 'running' | 'complete' | 'queued' | 'error';
  progress: number;
  icon: string;
  detail: string;
  startTime: number;
}

const INITIAL_TASKS: Omit<Task, 'id' | 'startTime'>[] = [
  { name: 'DBSCAN Hotspot Analysis', status: 'running', progress: 78, icon: '🔍', detail: 'Processing 1,000 records...' },
  { name: 'Time-Series Prediction', status: 'running', progress: 45, icon: '📊', detail: 'Training ARIMA model...' },
  { name: 'Anomaly Detection (Z-Score)', status: 'running', progress: 92, icon: '⚡', detail: 'Scanning 14-day window...' },
  { name: 'Patrol Route Optimization', status: 'complete', progress: 100, icon: '🚔', detail: '3 routes optimized' },
  { name: 'Social Network Analysis', status: 'queued', progress: 0, icon: '🕸', detail: 'Waiting for analysis slot...' },
  { name: 'CCTV Feed Processing', status: 'queued', progress: 0, icon: '📷', detail: 'Queued — 2 ahead' },
  { name: 'Evidence Classification', status: 'complete', progress: 100, icon: '📁', detail: '23 items classified' },
  { name: 'Victim Statement NLP', status: 'running', progress: 62, icon: '🤖', detail: 'Extracting entities...' },
];

export default function OperationsPanel() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    INITIAL_TASKS.map((t, i) => ({ ...t, id: `op-${i}`, startTime: Date.now() - Math.floor(Math.random() * 300000) }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === 'running') {
          const newProg = Math.min(100, t.progress + Math.floor(Math.random() * 8) + 1);
          return {
            ...t,
            progress: newProg,
            status: newProg >= 100 ? 'complete' : 'running',
            detail: newProg >= 100 ? 'Completed successfully' : t.detail,
          };
        }
        return t;
      }));
    }, 2000 + Math.random() * 2000);

    const queueTimer = setInterval(() => {
      setTasks(prev => {
        const running = prev.filter(t => t.status === 'running').length;
        if (running < 3) {
          const queued = prev.findIndex(t => t.status === 'queued');
          if (queued >= 0) {
            const updated = [...prev];
            updated[queued] = { ...updated[queued], status: 'running', progress: 5, detail: 'Starting...' };
            return updated;
          }
        }
        return prev;
      });
    }, 8000);

    return () => { clearInterval(interval); clearInterval(queueTimer); };
  }, []);

  const running = tasks.filter(t => t.status === 'running').length;
  const completed = tasks.filter(t => t.status === 'complete').length;
  const queued = tasks.filter(t => t.status === 'queued').length;

  const getProgressColor = (t: Task) => {
    if (t.status === 'error') return 'var(--accent-red)';
    if (t.status === 'complete') return 'var(--accent-green)';
    if (t.progress > 70) return 'var(--accent-cyan)';
    return 'var(--accent-blue)';
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent-green)',
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Operations Center
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6rem' }}>
          <span style={{ color: 'var(--accent-blue)' }}>▶ {running} running</span>
          <span style={{ color: 'var(--accent-green)' }}>✓ {completed} done</span>
          <span style={{ color: 'var(--text-muted)' }}>◎ {queued} queued</span>
        </div>
      </div>

      {/* Task List */}
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {tasks.map((t) => (
          <div key={t.id} style={{
            padding: '0.55rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.85rem' }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                borderRadius: '4px', textTransform: 'uppercase',
                ...(t.status === 'running' ? { color: 'var(--accent-blue)', background: 'var(--accent-blue-glow)' } :
                    t.status === 'complete' ? { color: 'var(--accent-green)', background: 'var(--accent-green-glow)' } :
                    t.status === 'error' ? { color: 'var(--accent-red)', background: 'var(--accent-red-glow)' } :
                    { color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }),
              }}>
                {t.status === 'running' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--accent-blue)', animation: 'pulse 1s ease infinite',
                    }} />
                    {t.progress}%
                  </span>
                ) : t.status}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${t.progress}%`, borderRadius: '2px',
                background: getProgressColor(t),
                transition: 'width 0.5s ease',
                boxShadow: t.status === 'running' ? `0 0 8px ${getProgressColor(t)}40` : 'none',
              }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
