// src/components/PlayerSideSelector.jsx
export default function PlayerSideSelector({ playerSide, onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {['X', 'O'].map(side => (
        <button
          key={side}
          onClick={() => !disabled && onSelect(side)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: disabled ? 'not-allowed' : 'pointer',
            border: '1px solid',
            borderColor: playerSide === side ? (side === 'X' ? '#ff4d6d' : '#4d9fff') : 'var(--border)',
            background: playerSide === side ? (side === 'X' ? 'rgba(255,77,109,0.12)' : 'rgba(77,159,255,0.12)') : 'var(--bg-elevated)',
            color: playerSide === side ? (side === 'X' ? '#ff4d6d' : '#4d9fff') : 'var(--text-secondary)',
            transition: 'all 0.2s',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {side}
          <div style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, opacity: 0.6, marginTop: 2 }}>
            {side === 'X' ? 'First' : 'Second'}
          </div>
        </button>
      ))}
    </div>
  );
}