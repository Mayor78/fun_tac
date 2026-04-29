import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_MODES } from '../lib/game';
import { useComputerGame } from '../hooks/useComputerGame';
import GameBoard from '../components/GameBoard';
import GameModeSelector from '../components/GameModeSelector';
import DifficultySelector from '../components/DifficultySelector';
import PlayerSideSelector from '../components/PlayerSideSelector';
import Confetti from '../components/Confetti';
import FlashOverlay from '../components/FlashOverlay';
import ResultModal from '../components/ResultModal';
import toast from 'react-hot-toast';
import soundService from '../lib/soundService';
import themeService from '../lib/themeService';

export default function ComputerGame() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState('medium');
  const [pendingSide, setPendingSide] = useState('X');
  const [pendingMode, setPendingMode] = useState(GAME_MODES.CLASSIC);
  const [pendingSize, setPendingSize] = useState(3);
  
  const {
    board,
    difficulty,
    gameMode,
    playerSide,
    currentTurn,
    result,
    winLine,
    scores,
    aiThinking,
    timeRemaining,
    timeBank,
    suddenDeathWarning,
    showConfetti,
    flashColor,
    shakeBoard,
    aiSide,
    diff,
    config,
    handleMove,
    handleRestart,
    handleApplySettings,
    setDifficulty,
    setPlayerSide,
    setGameMode,
    moveHistory
  } = useComputerGame();

  const openSettings = () => {
    setPendingDiff(difficulty);
    setPendingSide(playerSide);
    setPendingMode(gameMode);
    setPendingSize(Math.sqrt(board.length));
    setSettingsOpen(true);
  };

  const applySettings = () => {
    handleApplySettings(pendingDiff, pendingSide, pendingMode, pendingSize);
    setSettingsOpen(false);
    toast.success('Settings applied! New game started.');
  };

  const isMyTurn = currentTurn === playerSide && !result && !aiThinking;
  const isSuddenDeath = gameMode === GAME_MODES.SUDDEN_DEATH;
  const isTimeBank = gameMode === GAME_MODES.TIME_BANK;
  const showTimer = isMyTurn && (config?.timePerMove || isTimeBank);

  // Sound effects
  useEffect(() => {
    if (result) {
      if (result.winner === playerSide) soundService.win();
      else if (result.winner === 'draw') soundService.draw();
      else soundService.lose();
    }
  }, [result]);

  // Countdown ticks
  useEffect(() => {
    if (!timeRemaining || !isMyTurn) return;
    const t = Math.ceil(timeRemaining);
    if (t <= 5 && t > 0) soundService.urgentCountdown();
    else if (t <= 10 && t > 0) soundService.countdown();
  }, [Math.ceil(timeRemaining || 0)]);

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
        gameMode={gameMode}
      />

      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 24, padding: 24, maxWidth: 400, width: '100%',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Game Settings</h3>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🎮 Game Mode</p>
              <GameModeSelector
                selectedMode={pendingMode}
                onSelectMode={setPendingMode}
                disabled={false}
              />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🤖 Difficulty</p>
              <DifficultySelector
                difficulty={pendingDiff}
                onSelect={setPendingDiff}
                disabled={false}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🎯 Play as</p>
              <PlayerSideSelector
                playerSide={pendingSide}
                onSelect={setPendingSide}
                disabled={false}
              />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📐 Board Size</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[3, 4, 5].map(size => (
                  <button
                    key={size}
                    onClick={() => setPendingSize(size)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      background: pendingSize === size ? 'var(--accent-x)' : 'var(--bg-elevated)',
                      color: pendingSize === size ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${pendingSize === size ? 'transparent' : 'var(--border)'}`,
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={applySettings} className="btn btn-primary" style={{ width: '100%', padding: 14 }}>
              Apply & Start New Game
            </button>
            <button onClick={() => setSettingsOpen(false)} className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="animate-fade-in" style={{
        minHeight: '100dvh', maxWidth: 500, margin: '0 auto', padding: '0 16px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 12px' }}>
          <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ padding: '8px 14px' }}>← Back</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 800 }}>vs CPU</p>
            <p style={{ fontSize: 11, color: diff.color, fontWeight: 700 }}>{diff.emoji} {diff.label}</p>
          </div>
          <button onClick={openSettings} className="btn btn-ghost" style={{ padding: '8px 14px' }}>⚙︎</button>
        </div>

        {/* Game Mode Badge */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 20,
            background: `${config?.color}20`, border: `1px solid ${config?.color}`,
            fontSize: 11, fontWeight: 700,
          }}>
            {config?.icon} {config?.name} Mode
            {isSuddenDeath && <span style={{ marginLeft: 4 }}>⚔️ No Draws!</span>}
          </span>
        </div>

        {/* Sudden Death Warning */}
        {suddenDeathWarning && (
          <div style={{
            textAlign: 'center', marginBottom: 12, padding: '6px 12px',
            borderRadius: 20, background: 'rgba(255,77,109,0.3)',
            border: '1px solid #ff4d6d', fontSize: 12, fontWeight: 'bold',
            color: '#ff4d6d', animation: 'pulse 1s ease-in-out infinite',
          }}>
            ⚠️ SUDDEN DEATH - EXTENDED WIN CONDITIONS ACTIVE! ⚠️
          </div>
        )}

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 16px', borderRadius: 14,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              You ({playerSide})
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: playerSide === 'X' ? '#ff4d6d' : '#4d9fff' }}>
              {scores[playerSide]}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Draw</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>{scores.draw}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              CPU ({aiSide})
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: aiSide === 'X' ? '#ff4d6d' : '#4d9fff' }}>
              {scores[aiSide]}
            </div>
          </div>
        </div>

        {/* Turn Indicator with Timer */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {aiThinking ? (
            <div className="animate-searching" style={{
              display: 'inline-block', padding: '6px 20px', borderRadius: 30,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              fontSize: 12,
            }}>
              🤖 CPU thinking...
            </div>
          ) : !result ? (
            <div style={{
              display: 'inline-block', padding: '8px 24px', borderRadius: 30,
              background: isMyTurn ? 'rgba(77,255,170,0.2)' : 'rgba(255,255,255,0.05)',
              border: isMyTurn ? '1px solid #4dffaa' : '1px solid var(--border)',
            }}>
              <div>{isMyTurn ? '🎯 YOUR TURN' : `⏳ ${currentTurn}'s turn...`}</div>
              {showTimer && (
                <div style={{
                  fontSize: 22, fontWeight: 'bold', marginTop: 4,
                  color: (isTimeBank ? timeBank : timeRemaining) <= 10 ? '#ff4d6d' : '#4dffaa'
                }}>
                  {isTimeBank ? `⏰ ${timeBank}s` : `${timeRemaining}s`}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Game Board */}
        <div className={shakeBoard ? 'animate-shake' : ''} style={{ width: '100%' }}>
          <GameBoard
            board={board}
            onMove={handleMove}
            winLine={winLine}
            disabled={!!result || currentTurn !== playerSide || aiThinking}
            result={null}
            currentTurn={currentTurn}
            moveHistory={moveHistory}
            gameMode={gameMode}
          />
        </div>
      </div>
    </>
  );
}