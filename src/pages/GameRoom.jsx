import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPlayerId, getPlayerName } from '../utils/gameLogic';
import { useGameRoom } from '../hooks/useGameRoom';
import { GAME_CONFIG, GAME_MODES } from '../lib/game';
import FloatingChat from '../components/FloatingChat';
import ResultModal from '../components/ResultModal';
import PowerUpModal from '../components/PowerUpModal';
import TurnIndicator from '../components/TurnIndicator';
import EmojiReactions from '../components/EmojiReactions';
import Shop from '../components/Shop';
import toast from 'react-hot-toast';
import GameBoard from '../components/GameBoard';
import soundService from '../lib/soundService';
import themeService from '../lib/themeService';

export default function GameRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerId = getPlayerId();
  
  const [myRole, setMyRole] = useState(location.state?.role || null);
  const [myName] = useState(location.state?.playerName || getPlayerName() || 'Player');
  const [copied, setCopied] = useState(false);
  const [showShop, setShowShop] = useState(false);
  
  const {
    game,
    scores,
    error,
    resetting,
    showResultModal,
    resultMessage,
    gameEnded,
    gameMode,
    timeRemaining,
    timeBank,
    showPowerUpModal,
    currentPowerUp,
    isMyTurn,
    board,
    moveHistory,
    handleMove,
    handlePlayAgain,
    handleLeave,
    handlePowerUpUse,
    handlePurchase,
    closePowerUpModal
  } = useGameRoom(gameId, myRole, setMyRole, myName);

  const prevBoardRef = useRef(board);

  // Play sounds when board changes (opponent moved)
  useEffect(() => {
    if (JSON.stringify(board) !== JSON.stringify(prevBoardRef.current)) {
      soundService.move();
      prevBoardRef.current = board;
    }
  }, [board]);

  // Play win/lose/draw sounds when result modal appears
  useEffect(() => {
    if (!showResultModal || !resultMessage) return;
    if (resultMessage.title?.includes('Won') && resultMessage.title?.includes('You')) {
      soundService.win();
    } else if (resultMessage.title?.includes('Draw')) {
      soundService.draw();
    } else {
      soundService.lose();
    }
  }, [showResultModal]);

  // Countdown sounds for timer
  useEffect(() => {
    if (!timeRemaining) return;
    const t = Math.ceil(timeRemaining);
    if (t <= 5 && t > 0 && isMyTurn) soundService.urgentCountdown();
    else if (t <= 10 && t > 0 && isMyTurn) soundService.countdown();
  }, [Math.ceil(timeRemaining || 0)]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h2>{error}</h2>
        <button onClick={() => navigate('/online')} className="btn btn-primary">Back to Lobby</button>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin-slow" style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (game.status === 'waiting') {
    const link = `${window.location.origin}/game/${gameId}`;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
        <div style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>🎮</div>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>Waiting for Opponent</h2>
        <p>Game Code: <strong style={{ fontSize: 24 }}>{gameId}</strong></p>
        <p>Your role: <strong style={{ color: myRole === 'X' ? '#ff4d6d' : '#4d9fff' }}>{myRole || 'X'}</strong></p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={link} readOnly style={{ padding: 10, width: 300, borderRadius: 8 }} />
          <button onClick={handleCopyLink} className="btn btn-primary">{copied ? '✓ Copied' : 'Copy Link'}</button>
        </div>
        <div className="animate-searching" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot status-dot-yellow" />
          <span>Waiting for player to join...</span>
        </div>
        <button onClick={handleLeave} className="btn btn-ghost">Leave</button>
        <FloatingChat gameId={gameId} playerId={playerId} playerName={myName} />
      </div>
    );
  }

  const modeConfig = GAME_CONFIG[gameMode];
  const isSuddenDeath = gameMode === GAME_MODES.SUDDEN_DEATH;

  // Figure out which cells are 'about to vanish' (oldest piece per player)
  const vanishingCells = new Set();
  if (isSuddenDeath && moveHistory) {
    if (moveHistory.X?.length >= 3) vanishingCells.add(moveHistory.X[0]);
    if (moveHistory.O?.length >= 3) vanishingCells.add(moveHistory.O[0]);
  }

  return (
    <div style={{ maxWidth: 550, margin: '0 auto', padding: 20 }}>
      {/* Game Mode Badge */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 20,
          background: `${modeConfig?.color}20`,
          border: `1px solid ${modeConfig?.color}`,
          fontSize: 11,
          fontWeight: 700,
        }}>
          {modeConfig?.icon} {modeConfig?.name} Mode
          {isSuddenDeath && <span style={{ marginLeft: 4 }}>⚔️ No Draws!</span>}
        </span>
      </div>

      {/* Result Modal */}
     {showResultModal && (
  <ResultModal
    resultMessage={resultMessage}
    scores={scores}
    onPlayAgain={handlePlayAgain}
    onLeave={handleLeave}
    resetting={resetting}
  />
)}

      {/* Power Up Modal */}
      <PowerUpModal
        powerUp={currentPowerUp}
        onUse={handlePowerUpUse}
        onClose={closePowerUpModal}
      />

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, margin: 0 }}>Game #{gameId}</p>
            <p style={{ fontSize: 14, fontWeight: 'bold', margin: 0 }}>You are: <span style={{ color: myRole === 'X' ? '#ff4d6d' : '#4d9fff' }}>{myRole}</span></p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { soundService.setMuted(!soundService.isMuted()); window.dispatchEvent(new Event('storage')); }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}
            title={soundService.isMuted() ? 'Unmute' : 'Mute'}
          >{soundService.isMuted() ? '🔇' : '🔊'}</button>
          
          <button
            onClick={() => setShowShop(true)}
            style={{ background: 'linear-gradient(135deg, #ffcc4d20, transparent)', border: '1px solid #ffcc4d', borderRadius: 12, padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ffcc4d', fontWeight: 700, fontSize: 14 }}
          >
            🪙 Shop
          </button>

          <button onClick={handleLeave} className="btn btn-ghost">Exit</button>
        </div>
      </header>

      {/* Shop Modal */}
      {showShop && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: 20 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <button onClick={() => setShowShop(false)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}>✕</button>
            <Shop onPurchase={(item) => { handlePurchase(item); setShowShop(false); }} />
          </div>
        </div>
      )}

      {/* Scores */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, padding: 12, background: 'var(--bg-card)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center' }}><span style={{ color: '#ff4d6d', fontSize: 20 }}>❌ X</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.X || 0}</p></div>
        <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20 }}>🤝</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.draw || 0}</p></div>
        <div style={{ textAlign: 'center' }}><span style={{ color: '#4d9fff', fontSize: 20 }}>⭕ O</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.O || 0}</p></div>
      </div>

      {/* Turn Indicator with Timer */}
      {game.status === 'playing' && !gameEnded && (
        <TurnIndicator
          isMyTurn={isMyTurn}
          currentTurn={game.currentTurn}
          playerNames={game.playerNames}
          timeRemaining={timeRemaining}
          timeBank={timeBank}
          gameMode={gameMode}
          myRole={myRole}
        />
      )}

      {/* Game Board */}
      <div style={{ width: '100%', marginBottom: 20 }}>
        <GameBoard
          board={board}
          onMove={handleMove}
          winLine={game.winLine}
          disabled={!isMyTurn || game.status !== 'playing' || gameEnded}
          currentTurn={game.currentTurn}
          moveHistory={moveHistory}
          gameMode={gameMode}
        />
      </div>

      {/* Power Up Active Indicator */}
      {showPowerUpModal && !currentPowerUp && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span className="power-up-active" style={{ fontSize: 12, color: '#bf4dff' }}>
            ✨ Power Up Active! ✨
          </span>
        </div>
      )}

      {/* Emoji Reactions */}
      {game.status === 'playing' && (
        <EmojiReactions
          gameId={gameId}
          myRole={myRole}
          opponentName={game.playerNames?.[myRole === 'X' ? 'O' : 'X']}
        />
      )}

      {/* Floating Chat Button */}
      <FloatingChat gameId={gameId} playerId={playerId} playerName={myName} />
    </div>
  );
}