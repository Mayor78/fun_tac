// src/components/PowerUpModal.jsx
export default function PowerUpModal({ powerUp, onUse, onClose }) {
  if (!powerUp) return null;
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1001, animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 24, padding: '28px 32px', textAlign: 'center',
        border: '2px solid #bf4dff',
        maxWidth: '90%', width: 320,
        animation: 'scaleIn 0.3s ease',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{powerUp.emoji}</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{powerUp.name}!</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {powerUp.effect}
        </p>
        <button
          onClick={onUse}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'linear-gradient(135deg, #bf4dff, #4d9fff)',
            border: 'none', color: 'white', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', marginBottom: 8,
          }}
        >
          Use Power Up!
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', borderRadius: 12,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}