// ComputerGame.jsx — Play against AI (mobile-first layout)
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import { createEmptyBoard, makeMove, getGameResult, getAIMove } from '../utils/gameLogic';

const DIFFICULTIES = [
  { key: 'easy',   label: 'Easy',   emoji: '😌', color: '#4dffaa' },
  { key: 'medium', label: 'Medium', emoji: '🧠', color: '#ffcc4d' },
  { key: 'hard',   label: 'Hard',   emoji: '💀', color: '#ff4d6d' },
];

// ── Confetti particle component ──────────────
function Confetti({ active }) {
  const pieces = useRef([]);
  if (!pieces.current.length) {
    pieces.current = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.6}s`,
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
          width: p.size, height: p.size,
          background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ── Screen flash overlay ─────────────────────
function FlashOverlay({ color, active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 998,
      background: color,
      animation: 'screen-flash 0.6s ease forwards',
    }} />
  );
}

// ── Result Modal (replaces board overlay) ────
function ResultModal({ result, playerSide, onRestart, onMenu, scores }) {
  if (!result) return null;

  const isWin  = result.winner === playerSide;
  const isDraw = result.winner === 'draw';

  const config = isWin
    ? { emoji: '🏆', headline: 'You Win!',   sub: 'The CPU had no chance.', bg: 'rgba(77,255,170,0.12)', border: '#4dffaa' }
    : isDraw
    ? { emoji: '🤝', headline: "It's a Draw", sub: 'Neither side gave an inch.', bg: 'rgba(255,204,77,0.08)', border: '#ffcc4d' }
    : { emoji: '💔', headline: 'CPU Wins',   sub: 'Try a lower difficulty.', bg: 'rgba(255,77,109,0.1)', border: '#ff4d6d' };

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.75)',
        backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        {/* Card */}
        <div className="animate-result-pop" style={{
          width: '100%', maxWidth: 320,
          background: 'var(--bg-card)',
          border: `1px solid ${config.border}`,
          borderRadius: 24, padding: 32, textAlign: 'center',
          boxShadow: `0 0 60px ${config.border}40`,
        }}>
          {/* Emoji */}
          <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>{config.emoji}</div>

          {/* Headline */}
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: config.border }}>
            {config.headline}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            {config.sub}
          </p>

          {/* Mini scoreboard */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16,
            marginBottom: 28, padding: '12px 0',
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
          }}>
            {[
              { label: 'You',  val: scores[playerSide], color: playerSide === 'X' ? '#ff4d6d' : '#4d9fff' },
              { label: 'Draw', val: scores.draw,         color: '#55556a' },
              { label: 'CPU',  val: scores[playerSide === 'X' ? 'O' : 'X'], color: playerSide === 'X' ? '#4d9fff' : '#ff4d6d' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button onClick={onRestart} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--text-primary)', color: 'var(--bg-primary)',
            border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', marginBottom: 10,
            transition: 'transform 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Play Again
          </button>
          <button onClick={onMenu} style={{
            width: '100%', padding: '12px', borderRadius: 14,
            background: 'transparent', color: 'var(--text-muted)',
            border: '1px solid var(--border)', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          }}>
            ← Menu
          </button>
        </div>
      </div>
    </>
  );
}

// ── Settings Sheet (bottom drawer style) ─────
function SettingsSheet({ open, onClose, difficulty, setDifficulty, playerSide, setPlayerSide, onApply }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }} />
      {/* Sheet */}
      <div className="animate-fade-in" style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border-bright)',
        borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-bright)', margin: '0 auto 24px' }} />

        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Settings</h3>

        {/* Difficulty */}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Difficulty</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {DIFFICULTIES.map(d => (
            <button key={d.key} onClick={() => setDifficulty(d.key)} style={{
              flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              borderColor: difficulty === d.key ? d.color : 'var(--border)',
              background: difficulty === d.key ? `${d.color}18` : 'var(--bg-elevated)',
              color: difficulty === d.key ? d.color : 'var(--text-secondary)',
              transition: 'all 0.2s', fontFamily: 'Syne, sans-serif',
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{d.emoji}</div>
              {d.label}
            </button>
          ))}
        </div>

        {/* Play as */}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Play as</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['X', 'O'].map(side => (
            <button key={side} onClick={() => setPlayerSide(side)} style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: 'pointer', border: '1px solid',
              borderColor: playerSide === side ? (side === 'X' ? '#ff4d6d' : '#4d9fff') : 'var(--border)',
              background: playerSide === side ? (side === 'X' ? 'rgba(255,77,109,0.12)' : 'rgba(77,159,255,0.12)') : 'var(--bg-elevated)',
              color: playerSide === side ? (side === 'X' ? '#ff4d6d' : '#4d9fff') : 'var(--text-secondary)',
              transition: 'all 0.2s', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {side}
              <div style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, opacity: 0.6, marginTop: 2 }}>
                {side === 'X' ? 'First' : 'Second'}
              </div>
            </button>
          ))}
        </div>

        <button onClick={onApply} style={{
          width: '100%', padding: 14, borderRadius: 14,
          background: 'var(--text-primary)', color: 'var(--bg-primary)',
          border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
        }}>
          Apply & New Game
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────
export default function ComputerGame() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty]   = useState('medium');
  const [board, setBoard]             = useState(createEmptyBoard());
  const [playerSide, setPlayerSide]   = useState('X');
  const [currentTurn, setCurrentTurn] = useState('X');
  const [result, setResult]           = useState(null);
  const [winLine, setWinLine]         = useState([]);
  const [scores, setScores]           = useState({ X: 0, O: 0, draw: 0 });
  const [aiThinking, setAiThinking]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [flashColor, setFlashColor]   = useState('');
  const [shakeBoard, setShakeBoard]   = useState(false);

  // Temp settings state (committed on Apply)
  const [pendingDiff, setPendingDiff]     = useState('medium');
  const [pendingSide, setPendingSide]     = useState('X');

  const aiTimeout = useRef(null);
  const aiSide = playerSide === 'X' ? 'O' : 'X';
  const diff = DIFFICULTIES.find(d => d.key === difficulty);

  // ── Trigger effects on game end ───────────
  useEffect(() => {
    if (!result) return;
    const isWin  = result.winner === playerSide;
    const isLoss = result.winner !== playerSide && result.winner !== 'draw';

    if (isWin) {
      setShowConfetti(true);
      setFlashColor('rgba(77,255,170,0.25)');
      setTimeout(() => setShowConfetti(false), 2200);
    } else if (isLoss) {
      setFlashColor('rgba(255,77,109,0.2)');
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 600);
    } else {
      setFlashColor('rgba(255,204,77,0.15)');
    }
    setTimeout(() => setFlashColor(''), 700);
  }, [result]);

  // ── AI move logic ─────────────────────────
  useEffect(() => {
    if (result || currentTurn !== aiSide) return;
    setAiThinking(true);
    aiTimeout.current = setTimeout(() => {
      setBoard(prev => {
        const move = getAIMove(prev, difficulty, aiSide, playerSide);
        if (move === null) return prev;
        const newBoard = makeMove(prev, move, aiSide);
        if (!newBoard) return prev;
        const gameResult = getGameResult(newBoard);
        if (gameResult) {
          setResult(gameResult);
          setWinLine(gameResult.line || []);
          setScores(s => ({ ...s, [gameResult.winner]: (s[gameResult.winner] || 0) + 1 }));
        } else {
          setCurrentTurn(playerSide);
        }
        setAiThinking(false);
        return newBoard;
      });
    }, 500 + Math.random() * 350);
    return () => clearTimeout(aiTimeout.current);
  }, [currentTurn, aiSide, playerSide, difficulty, result]);

  // ── Player move ───────────────────────────
  const handleMove = useCallback((index) => {
    if (result || currentTurn !== playerSide || aiThinking) return;
    const newBoard = makeMove(board, index, playerSide);
    if (!newBoard) return;
    const gameResult = getGameResult(newBoard);
    setBoard(newBoard);
    if (gameResult) {
      setResult(gameResult);
      setWinLine(gameResult.line || []);
      setScores(s => ({ ...s, [gameResult.winner]: (s[gameResult.winner] || 0) + 1 }));
    } else {
      setCurrentTurn(aiSide);
    }
  }, [board, currentTurn, playerSide, aiSide, result, aiThinking]);

  const handleRestart = () => {
    clearTimeout(aiTimeout.current);
    setBoard(createEmptyBoard());
    setResult(null);
    setWinLine([]);
    setCurrentTurn('X');
    setAiThinking(false);
    setShowConfetti(false);
    setShakeBoard(false);
  };

  const handleApplySettings = () => {
    setDifficulty(pendingDiff);
    setPlayerSide(pendingSide);
    setSettingsOpen(false);
    // restart with new settings after state updates
    clearTimeout(aiTimeout.current);
    setBoard(createEmptyBoard());
    setResult(null);
    setWinLine([]);
    setCurrentTurn('X');
    setAiThinking(false);
  };

  const openSettings = () => {
    setPendingDiff(difficulty);
    setPendingSide(playerSide);
    setSettingsOpen(true);
  };

  return (
    <>
      <Confetti active={showConfetti} />
      <FlashOverlay color={flashColor} active={!!flashColor} />
      <ResultModal
        result={result}
        playerSide={playerSide}
        onRestart={handleRestart}
        onMenu={() => navigate('/')}
        scores={scores}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        difficulty={pendingDiff}
        setDifficulty={setPendingDiff}
        playerSide={pendingSide}
        setPlayerSide={setPendingSide}
        onApply={handleApplySettings}
      />

      {/* ── Page Layout ── */}
      <div className="animate-fade-in" style={{
        minHeight: '100dvh',
        maxWidth: 420,
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0 12px',
          flexShrink: 0,
        }}>
          <button onClick={() => navigate('/')} style={{
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          }}>
            ← Back
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>vs CPU</p>
            <p style={{ fontSize: 11, color: diff.color, fontWeight: 700 }}>{diff.emoji} {diff.label}</p>
          </div>

          <button onClick={openSettings} style={{
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          }}>
            ⚙︎
          </button>
        </div>

        {/* Score strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 16px', borderRadius: 14,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* You */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', marginBottom: 2,
            }}>You ({playerSide})</div>
            <div style={{
              fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: playerSide === 'X' ? 'var(--accent-x)' : 'var(--accent-o)',
            }}>
              {scores[playerSide]}
            </div>
          </div>
          {/* Draw */}
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Draw</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {scores.draw}
            </div>
          </div>
          {/* CPU */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
              CPU ({aiSide})
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: aiSide === 'X' ? 'var(--accent-x)' : 'var(--accent-o)',
            }}>
              {scores[aiSide]}
            </div>
          </div>
        </div>

        {/* ── BOARD — center stage ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingBottom: 16,
        }}>

          {/* Turn pill */}
          <div style={{
            marginBottom: 16, height: 28, display: 'flex', alignItems: 'center',
          }}>
            {aiThinking ? (
              <div className="animate-searching" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text-muted)',
              }}>
                <span style={{ fontSize: 14 }}>🤖</span> CPU thinking…
              </div>
            ) : !result ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 14px', borderRadius: 20,
                background: currentTurn === playerSide
                  ? (playerSide === 'X' ? 'rgba(255,77,109,0.12)' : 'rgba(77,159,255,0.12)')
                  : 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: currentTurn === playerSide
                  ? (playerSide === 'X' ? 'rgba(255,77,109,0.4)' : 'rgba(77,159,255,0.4)')
                  : 'var(--border)',
                fontSize: 12, fontWeight: 700,
                color: currentTurn === playerSide
                  ? (playerSide === 'X' ? 'var(--accent-x)' : 'var(--accent-o)')
                  : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                {currentTurn === playerSide
                  ? <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor', marginRight: 2 }} /> Your turn</>
                  : 'CPU\'s turn'
                }
              </div>
            ) : null}
          </div>

          {/* The Board */}
          <div
            className={shakeBoard ? 'animate-shake' : ''}
            style={{ width: '100%' }}
          >
            <GameBoard
              board={board}
              onMove={handleMove}
              winLine={winLine}
              disabled={!!result || currentTurn !== playerSide || aiThinking}
              result={null}           /* no overlay — we use the modal instead */
              currentTurn={currentTurn}
            />
          </div>
        </div>
      </div>
    </>
  );
}
