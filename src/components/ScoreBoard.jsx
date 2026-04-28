// src/components/ScoreBoard.jsx
export default function ScoreBoard({ scores, playerNames, compact = false }) {
  const items = [
    { label: playerNames?.X || 'Player X', key: 'X', color: 'var(--accent-x)', emoji: '❌' },
    { label: 'Draws', key: 'draw', color: 'var(--text-muted)', emoji: '🤝' },
    { label: playerNames?.O || 'Player O', key: 'O', color: 'var(--accent-o)', emoji: '⭕' },
  ];

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {items.map(({ label, key, color, emoji }) => (
          <div key={key} style={{
            textAlign: 'center',
            minWidth: 60,
          }}>
            <div style={{ 
              fontSize: 13, 
              color: 'var(--text-muted)', 
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}>
              <span>{emoji}</span>
              <span style={{ fontSize: 11 }}>{label.length > 8 ? label.substring(0, 6) + '…' : label}</span>
            </div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color, 
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1,
            }}>
              {scores[key] || 0}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
    }}>
      {items.map(({ label, key, color, emoji }) => (
        <div key={key} className="card" style={{
          padding: '14px 24px',
          textAlign: 'center',
          flex: 1,
          minWidth: 0,
          background: 'var(--bg-elevated)',
          borderRadius: 16,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 14 }}>{emoji}</span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {label.length > 12 ? label.substring(0, 10) + '…' : label}
            </div>
          </div>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            color, 
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: 1,
          }}>
            {scores[key] || 0}
          </div>
        </div>
      ))}
    </div>
  );
}