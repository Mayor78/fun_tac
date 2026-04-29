import Cell from './Cell';
import { GAME_MODES } from '../lib/game';

export default function GameBoard({ board, onMove, winLine, disabled, result, currentTurn, moveHistory, gameMode }) {
  // Safety check
  if (!board || !Array.isArray(board)) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        width: '100%',
        maxWidth: '360px',
        margin: '0 auto',
      }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="cell" style={{ opacity: 0.3 }}>
            <span>?</span>
          </div>
        ))}
      </div>
    );
  }

  const handleCellClick = (index) => {
    if (onMove) {
      onMove(index);
    }
  };

  const size = Math.sqrt(board.length);
  const vanishingCells = new Set();
  if (gameMode === GAME_MODES.SUDDEN_DEATH && moveHistory) {
    if (moveHistory.X?.length >= 3) vanishingCells.add(moveHistory.X[0]);
    if (moveHistory.O?.length >= 3) vanishingCells.add(moveHistory.O[0]);
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: size * 100, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: size > 3 ? '8px' : '12px',
        width: '100%',
        aspectRatio: '1/1',
        background: 'var(--board-bg, var(--bg-card))',
        borderRadius: 20,
        padding: size > 3 ? '8px' : '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}>
        {board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            onClick={handleCellClick}
            isWinner={winLine?.includes(i)}
            isVanishing={vanishingCells.has(i)}
            disabled={disabled || !!result}
            currentTurn={currentTurn}
          />
        ))}
      </div>

      {result && (
        <div className="animate-scale-in" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
          background: 'rgba(10, 10, 15, 0.85)',
          zIndex: 10,
        }}>
          <div style={{
            textAlign: 'center',
            padding: '28px 36px',
            borderRadius: 24,
            background: 'var(--bg-elevated)',
            border: `2px solid ${result.winner === 'draw' ? 'var(--warning)' : 
                     result.winner === 'X' ? 'var(--accent-x)' : 'var(--accent-o)'}`,
          }}>
            {result.winner === 'draw' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
                  It's a Draw!
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {result.winner === 'X' ? '❌' : '⭕'}
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 800,
                  color: result.winner === 'X' ? 'var(--accent-x)' : 'var(--accent-o)',
                }}>
                  {result.winner} Wins!
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}