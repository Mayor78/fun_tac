// src/components/PlayerBadge.jsx
export default function PlayerBadge({ player, name, isActive, isWinner }) {
  const isX = player === 'X';
  const color = isX ? 'var(--accent-x)' : 'var(--accent-o)';
  const emoji = isX ? '❌' : '⭕';
  
  return (
    <div 
      className={`player-badge player-badge-${player.toLowerCase()} ${isActive ? 'player-badge-active' : ''}`}
      style={{ 
        opacity: isWinner === false ? 0.5 : 1, 
        transition: 'all 0.3s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 18px',
        borderRadius: 40,
        background: isActive ? `linear-gradient(135deg, ${color}12, ${color}08)` : 'var(--bg-elevated)',
        border: `1px solid ${isActive ? color : 'var(--border)'}`,
        boxShadow: isActive ? `0 0 20px ${color}40` : 'none',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {isActive && (
        <span style={{
          width: 8, 
          height: 8, 
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          animation: 'pulse-ring 1.5s ease-out infinite',
          position: 'relative',
        }} />
      )}
      
      <span style={{ 
        fontWeight: 800, 
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 16,
        color: color,
      }}>
        {emoji} {player}
      </span>
      
      {name && (
        <span style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 12, 
          fontFamily: 'Syne, sans-serif',
          fontWeight: 500,
        }}>
          {name.length > 12 ? name.substring(0, 10) + '…' : name}
        </span>
      )}
      
      {isWinner === true && (
        <span style={{ fontSize: 14, animation: 'bounce-in 0.4s ease' }}>👑</span>
      )}
    </div>
  );
}