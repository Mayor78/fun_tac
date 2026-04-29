// src/components/ResultModal.jsx - Update for game modes
export default function ResultModal({ result, resultMessage, playerSide, onRestart, onPlayAgain, onMenu, onLeave, scores, gameMode }) {
  if (!result && !resultMessage) return null;

  let config;
  const isSuddenDeathWin = gameMode === 'sudden_death' && result && result.winner && result.winner !== 'draw';

  if (resultMessage) {
    // GameRoom format
    config = {
      emoji: resultMessage.emoji || '🏆',
      headline: resultMessage.title || 'Game Over',
      sub: resultMessage.message || '',
      bg: 'var(--bg-elevated)',
      border: resultMessage.color || 'var(--border)'
    };
  } else if (result) {
    // ComputerGame / Local format
    const isWin = result.winner === playerSide;
    const isDraw = result.winner === 'draw';
    if (isWin) {
      config = { emoji: '🏆', headline: 'You Win!', sub: 'Great game!', bg: 'rgba(77,255,170,0.12)', border: '#4dffaa' };
    } else if (isDraw) {
      config = { emoji: '🤝', headline: "It's a Draw", sub: 'Close match!', bg: 'rgba(255,204,77,0.08)', border: '#ffcc4d' };
    } else {
      config = { emoji: '💔', headline: 'Opponent Wins', sub: 'Try again!', bg: 'rgba(255,77,109,0.1)', border: '#ff4d6d' };
    }
  }

  // Handle prop fallbacks
  const restartFn = onPlayAgain || onRestart;
  const leaveFn = onLeave || onMenu;
  const pSide = playerSide || 'X'; // Default for GameRoom if not passed directly into scores


  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="animate-result-pop" style={{
        width: '100%', maxWidth: 320, background: 'var(--bg-card)',
        border: `1px solid ${config.border}`, borderRadius: 24, padding: 32,
        textAlign: 'center', boxShadow: `0 0 60px ${config.border}40`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{config.emoji}</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: config.border }}>
          {config.headline}
          {isSuddenDeathWin && <span style={{ fontSize: 14, display: 'block' }}>⚔️ Sudden Death Victory! ⚔️</span>}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>{config.sub}</p>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28,
          padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        }}>
          {[
            { label: 'You', val: scores[pSide] || 0, color: pSide === 'X' ? '#ff4d6d' : '#4d9fff' },
            { label: 'Draw', val: scores.draw || 0, color: '#55556a' },
            { label: 'Opponent', val: scores[pSide === 'X' ? 'O' : 'X'] || 0, color: pSide === 'X' ? '#4d9fff' : '#ff4d6d' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(255,204,77,0.1)',
          padding: '8px 16px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
          color: '#ffcc4d',
          fontWeight: 700,
          fontSize: 14
        }}>
          🪙 +{config.headline.includes('You Won') ? 50 : config.headline.includes('Draw') ? 20 : 5} coins earned!
        </div>

        <button onClick={restartFn} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: 'var(--text-primary)', color: 'var(--bg-primary)',
          border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer',
          marginBottom: 10,
        }}>Play Again</button>
        <button onClick={leaveFn} style={{
          width: '100%', padding: '12px', borderRadius: 14,
          background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>← Leave</button>
      </div>
    </div>
  );
}