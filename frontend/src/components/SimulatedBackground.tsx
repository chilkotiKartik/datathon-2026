import { useEffect, useRef } from 'react';

const PARTICLES = 20;

export default function SimulatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < PARTICLES; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle';
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDelay = `${Math.random() * 8}s`;
      dot.style.animationDuration = `${6 + Math.random() * 6}s`;
      dot.style.width = dot.style.height = `${1 + Math.random() * 2}px`;
      container.appendChild(dot);
    }
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
