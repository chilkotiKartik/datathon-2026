import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

const NotificationCtx = createContext<{
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  dismissNotification: (id: number) => void;
  unreadCount: number;
}>({ notifications: [], addNotification: () => {}, dismissNotification: () => {}, unreadCount: 0 });

export function useNotifications() { return useContext(NotificationCtx); }

let notifId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const id = ++notifId;
    setNotifications(prev => [...prev.slice(-49), { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => n.timestamp > Date.now() - 30000).length;

  return (
    <NotificationCtx.Provider value={{ notifications, addNotification, dismissNotification, unreadCount }}>
      {children}
      <div style={{
        position: 'fixed', top: '0.75rem', right: '0.75rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none',
        maxWidth: '380px',
      }}>
        {notifications.map(n => (
          <div key={n.id} onClick={() => dismissNotification(n.id)}
            style={{
              pointerEvents: 'auto', cursor: 'pointer',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: n.type === 'error' ? 'rgba(239,68,68,0.9)' :
                n.type === 'warning' ? 'rgba(245,158,11,0.9)' :
                n.type === 'success' ? 'rgba(34,197,94,0.9)' :
                'rgba(59,130,246,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.8rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              animation: 'slideInRight 0.3s ease',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
            <span>{n.type === 'error' ? '🔴' : n.type === 'warning' ? '🟡' : n.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{n.message}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
              {Math.floor((Date.now() - n.timestamp) / 1000)}s
            </span>
          </div>
        ))}
      </div>
    </NotificationCtx.Provider>
  );
}

export function useAutoRefresh(fn: () => void, interval = 30000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    fnRef.current();
    const id = setInterval(() => fnRef.current(), interval);
    return () => clearInterval(id);
  }, [interval]);
}
