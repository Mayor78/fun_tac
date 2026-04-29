// src/components/Confetti.jsx
import { useRef } from 'react';

export default function Confetti({ active }) {
  const pieces = useRef([]);
  if (!pieces.current.length) {
    pieces.current = Array.from({ length: 28 }, (_, i) => ({
      id: i, left: `${Math.random() * 100}%`, delay: `${Math.random() * 0.6}s`,
      duration: `${1.0 + Math.random() * 0.8}s`,
      color: ['#ff4d6d','#4d9fff','#4dffaa','#ffcc4d','#bf4dff'][i % 5],
      size: 6 + Math.random() * 6,
    }));
  }
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.current.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: p.left,
          width: p.size, height: p.size, background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}