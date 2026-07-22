import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const ROLES = [
  { id: 'police_admin', label: 'Police Admin', icon: '👮', desc: 'Full system access', color: '#ef4444' },
  { id: 'investigator', label: 'Investigator', icon: '🔍', desc: 'Crime analytics', color: '#3b82f6' },
  { id: 'patrol_officer', label: 'Patrol Officer', icon: '🚔', desc: 'Live operations', color: '#22c55e' },
  { id: 'citizen', label: 'Citizen', icon: '👤', desc: 'Public portal', color: '#f59e0b' },
];

const DEMO_CREDENTIALS = [
  { role: 'police_admin', phone: '9999999999', name: 'Commissioner Sharma', rank: 'DGP Karnataka' },
  { role: 'investigator', phone: '8888888888', name: 'Inspector Reddy', rank: 'CID Intelligence' },
  { role: 'patrol_officer', phone: '7777777777', name: 'SI Kumar', rank: 'Koramangala PS' },
  { role: 'citizen', phone: '6666666666', name: 'Ravi Patel', rank: 'Public User' },
];

function OrbBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        top: '-200px', left: '-100px',
        animation: 'orbFloat1 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
        bottom: '-150px', right: '-100px',
        animation: 'orbFloat2 25s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        top: '40%', left: '50%',
        animation: 'orbFloat3 18s ease-in-out infinite',
      }} />
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        animation: 'gridScroll 40s linear infinite',
      }} />
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function GlitchTitle() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '0.5rem', position: 'relative' }}>
      <h1 className="glitch-login" data-text="SAHASRA KSP" style={{
        fontSize: '2rem', fontWeight: 900, letterSpacing: '2px',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', position: 'relative', display: 'inline-block',
      }}>SAHASRA KSP</h1>
    </div>
  );
}

function Badge() {
  return (
    <div style={{
      width: '72px', height: '72px', margin: '0 auto 1rem',
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Animated rotating ring */}
      <div style={{
        position: 'absolute', inset: '-4px', borderRadius: '50%',
        border: '2px solid transparent',
        borderTop: '2px solid var(--accent-blue)',
        borderRight: '2px solid var(--accent-purple)',
        animation: 'spin 3s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: '-8px', borderRadius: '50%',
        border: '1px solid transparent',
        borderBottom: '1px solid var(--accent-cyan)',
        borderLeft: '1px solid var(--accent-purple)',
        animation: 'spin 5s linear infinite reverse',
      }} />
      {/* Badge body */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
        border: '2px solid rgba(59,130,246,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 30px rgba(59,130,246,0.15), inset 0 0 20px rgba(59,130,246,0.05)',
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '1px' }}>SK</span>
      </div>
    </div>
  );
}

function DemoCard({ cred, onClick, loading }: { cred: typeof DEMO_CREDENTIALS[0]; onClick: () => void; loading: boolean }) {
  const role = ROLES.find(r => r.id === cred.role)!;
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="demo-card"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
        padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        cursor: loading ? 'wait' : 'pointer', textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Hover shine */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0,
        background: `linear-gradient(135deg, transparent 30%, ${role.color}10 50%, transparent 70%)`,
        transition: 'opacity 0.3s',
      }} className="demo-shine" />
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: `linear-gradient(135deg, ${role.color}30, ${role.color}10)`,
        border: `1px solid ${role.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
      }}>{role.icon}</div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{cred.name}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{cred.rank}</div>
      </div>
      {/* Action */}
      <div style={{
        fontSize: '0.6rem', fontWeight: 700, color: role.color, opacity: 0.7,
        padding: '0.25rem 0.5rem', borderRadius: '6px',
        background: `${role.color}10`, border: `1px solid ${role.color}20`,
        whiteSpace: 'nowrap',
      }}>LOGIN</div>
    </button>
  );
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('police_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Tilt effect on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
    };
    const handleLeave = () => { card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)'; };
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => { card.removeEventListener('mousemove', handleMove); card.removeEventListener('mouseleave', handleLeave); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.login(phone, name || undefined, role);
      localStorage.setItem('sahasra_user', JSON.stringify(res.user));
      localStorage.setItem('sahasra_token', res.token);
      navigate('/dashboard');
    } catch {
      setError('Login failed. Server may be offline.');
    }
    setLoading(false);
  };

  const demoLogin = async (cred: typeof DEMO_CREDENTIALS[0], idx: number) => {
    setSelectedDemo(idx);
    setPhone(cred.phone);
    setName(cred.name);
    setRole(cred.role);
    setLoading(true); setError('');
    try {
      const res = await api.login(cred.phone, cred.name, cred.role);
      localStorage.setItem('sahasra_user', JSON.stringify(res.user));
      localStorage.setItem('sahasra_token', res.token);
      navigate('/dashboard');
    } catch {
      setError('Login failed. Server may be offline.');
    }
    setLoading(false);
    setSelectedDemo(null);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem', position: 'relative',
    }}>
      <OrbBackground />

      <div ref={cardRef} style={{
        width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1,
        transition: 'transform 0.1s ease-out',
      }}>
        {/* Animated border glow */}
        <div className="login-card-glow" style={{
          position: 'absolute', inset: '-1px', borderRadius: '24px', padding: '1px',
          background: 'conic-gradient(from var(--angle, 0deg), #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor', maskComposite: 'exclude',
          animation: 'spin 4s linear infinite',
        }} />

        {/* Card body */}
        <div style={{
          background: 'rgba(15,20,35,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: '24px', padding: '2rem 2rem 1.5rem',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.05)',
        }}>
          {/* Badge + Title */}
          <Badge />
          <GlitchTitle />
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
            marginBottom: '1.5rem', letterSpacing: '0.5px',
          }}>Crime Intelligence &amp; Command Platform</p>

          {/* Demo Quick Login */}
          <div style={{
            marginBottom: '1.25rem', padding: '0.75rem',
            background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)',
            borderRadius: '14px',
          }}>
            <div style={{
              fontSize: '0.6rem', color: 'var(--accent-blue)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center',
              marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)',
                animation: 'pulse 2s ease infinite',
              }} />
              Quick Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {DEMO_CREDENTIALS.map((cred, i) => (
                <DemoCard
                  key={i} cred={cred}
                  onClick={() => demoLogin(cred, i)}
                  loading={loading && selectedDemo === i}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Manual Login</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
              <input type="tel" placeholder="Enter 10-digit phone" className="input login-input"
                style={{ fontSize: '0.9rem', padding: '0.7rem 0.85rem', margin: 0, width: '100%',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input type="text" placeholder="Your full name" className="input login-input"
                style={{ padding: '0.7rem 0.85rem', margin: 0, width: '100%',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                {ROLES.map(r => (
                  <button key={r.id} type="button"
                    onClick={() => setRole(r.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '0.2rem', padding: '0.55rem 0.3rem',
                      background: role === r.id ? `${r.color}15` : 'rgba(255,255,255,0.02)',
                      border: role === r.id ? `1px solid ${r.color}40` : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      width: '100%', fontSize: '0.75rem',
                    }}>
                    <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                    <span style={{ color: role === r.id ? r.color : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.5rem 0.75rem', marginBottom: '0.75rem', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--accent-red)', fontSize: '0.75rem', textAlign: 'center',
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.8rem', fontSize: '0.9rem', fontWeight: 700,
              background: loading ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
              color: 'white', letterSpacing: '0.5px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
              transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                  }} />
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '1.25rem', paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', justifyContent: 'center', gap: '1.5rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)' }}>1,000+</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Crime Records</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)' }}>4</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>AI Agents</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>24/7</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbFloat1 { 0%,100% { transform: translate(0,0); } 33% { transform: translate(60px,40px); } 66% { transform: translate(-30px,60px); } }
        @keyframes orbFloat2 { 0%,100% { transform: translate(0,0); } 33% { transform: translate(-50px,-30px); } 66% { transform: translate(40px,-50px); } }
        @keyframes orbFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,-40px); } }
        @keyframes gridScroll { 0% { background-position: 0 0; } 100% { background-position: 80px 80px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .demo-card:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }
        .demo-card:hover .demo-shine { opacity: 1 !important; }
        .demo-card:active { transform: scale(0.98); }
        .login-input:focus { border-color: rgba(59,130,246,0.4) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
        .glitch-login { animation: glitchText 5s infinite; }
        @keyframes glitchText {
          0%,92%,100% { text-shadow: none; transform: translate(0); }
          93% { text-shadow: 2px 0 #3b82f6, -2px 0 #8b5cf6; transform: translate(-1px, 1px); }
          94% { text-shadow: -2px 0 #3b82f6, 2px 0 #8b5cf6; transform: translate(1px, -1px); }
          95% { text-shadow: none; transform: translate(0); }
          96% { text-shadow: 1px 0 #06b6d4, -1px 0 #3b82f6; transform: translate(1px, 0); }
          97% { text-shadow: none; transform: translate(0); }
        }
      `}</style>
    </div>
  );
}
