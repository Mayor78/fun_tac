// LocalGame.jsx — Two players on same device (board-priority layout)
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import { createEmptyBoard, makeMove, getGameResult } from '../utils/gameLogic';

// ── Simple Result Modal ─────────────────
function ResultModal({ result, winnerName, onRestart, onMenu }) {
  if (!result) return null;

  const isDraw = result.winner === 'draw';
  const emoji = isDraw ? '🤝' : '🏆';
  const headline = isDraw ? "It's a Draw!" : `${winnerName} Wins!`;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 20, padding: 32, textAlign: 'center',
        maxWidth: 280, width: '100%',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{headline}</h2>
        <button onClick={onRestart} style={{
          width: '100%', padding: 12, borderRadius: 12,
          background: 'var(--text-primary)', color: 'var(--bg-primary)',
          border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          marginBottom: 8,
        }}>
          Play Again
        </button>
        <button onClick={onMenu} style={{
          width: '100%', padding: 10, borderRadius: 12,
          background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border)', cursor: 'pointer',
        }}>
          Menu
        </button>
      </div>
    </div>
  );
}

// ── Settings Dropdown (simple select) ────
function SettingsDropdown({ names, setNames, scores, onResetScores }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ⚙️ <span style={{ fontSize: 11 }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 260,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>
            Player Names
          </h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--accent-x)', display: 'block', marginBottom: 4 }}>
              Player X
            </label>
            <input
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 13,
              }}
              value={names.X}
              onChange={e => setNames(n => ({ ...n, X: e.target.value || 'Player X' }))}
              maxLength={16}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--accent-o)', display: 'block', marginBottom: 4 }}>
              Player O
            </label>
            <input
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 13,
              }}
              value={names.O}
              onChange={e => setNames(n => ({ ...n, O: e.target.value || 'Player O' }))}
              maxLength={16}
            />
          </div>
          <button
            onClick={() => {
              onResetScores();
              setIsOpen(false);
            }}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)',
              color: 'var(--accent-x)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reset Scores
          </button>
        </div>
      )}
    </div>
  );
}

export default function LocalGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState('X');
  const [result, setResult] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [names, setNames] = useState({ X: 'Player X', O: 'Player O' });

  const handleMove = useCallback((index) => {
    if (result) return;
    const newBoard = makeMove(board, index, currentTurn);
    if (!newBoard) return;

    const gameResult = getGameResult(newBoard);
    setBoard(newBoard);

    if (gameResult) {
      setResult(gameResult);
      setWinLine(gameResult.line || []);
      setScores(s => ({
        ...s,
        [gameResult.winner]: (s[gameResult.winner] || 0) + 1,
      }));
    } else {
      setCurrentTurn(t => t === 'X' ? 'O' : 'X');
    }
  }, [board, currentTurn, result]);

  const handleRestart = () => {
    setBoard(createEmptyBoard());
    setResult(null);
    setWinLine([]);
    setCurrentTurn('X');
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draw: 0 });
    handleRestart();
  };

  const winnerName = result && result.winner !== 'draw' ? names[result.winner] : '';

  return (
    <>
      <ResultModal
        result={result}
        winnerName={winnerName}
        onRestart={handleRestart}
        onMenu={() => navigate('/')}
      />

      <div className="animate-fade-in" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
        
        {/* Simple Header - Minimal */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(10, 10, 20, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Menu
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Local Game</div>
          </div>
          
          <SettingsDropdown
            names={names}
            setNames={setNames}
            scores={scores}
            onResetScores={resetScores}
          />
        </div>

        {/* Score Bar - Compact */}
        <div style={{
          marginTop: 60,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          padding: '12px 20px',
          borderRadius: 40,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-x)', letterSpacing: '0.08em' }}>
              {names.X}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-x)' }}>
              {scores.X}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 4px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>DRAW</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
              {scores.draw}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-o)', letterSpacing: '0.08em' }}>
              {names.O}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-o)' }}>
              {scores.O}
            </div>
          </div>
        </div>

        {/* Turn Indicator - Minimal */}
        {!result && (
          <div style={{
            marginBottom: 16,
            padding: '6px 16px',
            borderRadius: 20,
            background: currentTurn === 'X' 
              ? 'rgba(255,77,109,0.1)' 
              : 'rgba(77,159,255,0.1)',
            border: `1px solid ${currentTurn === 'X' ? 'rgba(255,77,109,0.3)' : 'rgba(77,159,255,0.3)'}`,
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: currentTurn === 'X' ? 'var(--accent-x)' : 'var(--accent-o)',
            }}>
              {names[currentTurn]}'s turn
            </span>
          </div>
        )}

        {/* MAIN FOCUS: The Game Board */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
        }}>
          <GameBoard
            board={board}
            onMove={handleMove}
            winLine={winLine}
            disabled={!!result}
            result={result}
            currentTurn={currentTurn}
          />
        </div>

        {/* Quick Restart Button - Only when game active */}
        {!result && (
          <button
            onClick={handleRestart}
            style={{
              marginTop: 24,
              padding: '8px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            ↻ New Game
          </button>
        )}
      </div>
    </>
  );
}