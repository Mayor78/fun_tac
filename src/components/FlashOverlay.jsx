// src/components/FlashOverlay.jsx
export default function FlashOverlay({ color, active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 998,
      background: color, animation: 'screen-flash 0.6s ease forwards',
    }} />
  );
}