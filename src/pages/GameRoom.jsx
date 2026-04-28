// src/pages/GameRoom.jsx - COMPLETE WITH FLOATING CHAT
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  subscribeToGame, joinGame, makeOnlineMove, resetGame, leaveGame
} from '../lib/gameService';
import { getPlayerId, getPlayerName } from '../utils/gameLogic';
import FloatingChat from '../components/FloatingChat';
import toast from 'react-hot-toast';

export default function GameRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerId = getPlayerId();
  
  const [game, setGame] = useState(null);
  const [myRole, setMyRole] = useState(location.state?.role || null);
  const [myName] = useState(location.state?.playerName || getPlayerName() || 'Player');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [resetting, setResetting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState({ title: '', message: '', emoji: '', color: '' });
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameEnded, setGameEnded] = useState(false);
  const timerInterval = useRef(null);

  // Timer effect
  useEffect(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    if (game?.status === 'playing' && game.currentTurn === myRole && !gameEnded) {
      setTimeRemaining(60);
      timerInterval.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(60);
    }
    
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [game?.status, game?.currentTurn, myRole, gameEnded]);

  // Join game if needed
  useEffect(() => {
    if (!myRole && !error && gameId) {
      joinGame(gameId, myName)
        .then(({ role }) => setMyRole(role))
        .catch(e => setError(e.message));
    }
  }, [gameId, myRole, myName, error]);

  // Subscribe to game - REAL TIME UPDATES
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = subscribeToGame(gameId, (data) => {
      if (data) {
        console.log('Game update received:', data.status, data.currentTurn);
        
        if (data.scores) setScores(data.scores);
        
        // Check if game just finished
        if (data.status === 'finished' && game?.status !== 'finished' && !gameEnded) {
          setGameEnded(true);
          
          if (data.winner === 'draw') {
            setResultMessage({
              title: "It's a Draw!",
              message: "Well played! Both players gave it their best.",
              emoji: "🤝",
              color: "var(--warning)"
            });
            setShowResultModal(true);
          } else if (data.winner === myRole) {
            setResultMessage({
              title: "You Won! 🎉",
              message: data.timeoutForfeit === myRole ? "Opponent ran out of time!" : "Great game!",
              emoji: "🏆",
              color: "var(--success)"
            });
            setShowResultModal(true);
          } else if (data.winner) {
            setResultMessage({
              title: `${data.winner} Wins!`,
              message: data.timeoutForfeit ? `${data.playerNames?.[data.timeoutForfeit]} ran out of time!` : "Better luck next time!",
              emoji: data.winner === 'X' ? "❌" : "⭕",
              color: data.winner === 'X' ? "var(--accent-x)" : "var(--accent-o)"
            });
            setShowResultModal(true);
          }
        }
        
        // Check if opponent abandoned the game
        if (data.status === 'abandoned' && game?.status !== 'abandoned') {
          toast.error('Opponent left the game!', { duration: 5000 });
          setError('Opponent left the game');
        }
        
        // Reset game ended flag when game becomes playing again
        if (data.status === 'playing' && game?.status === 'finished') {
          setGameEnded(false);
          setShowResultModal(false);
        }
        
        setGame(data);
      } else {
        setError('Game not found');
      }
    });
    
    return () => unsubscribe();
  }, [gameId, myRole, game?.status, gameEnded]);

  const handleMove = async (index) => {
    console.log('🎯 handleMove called - index:', index);
    console.log('Game state:', { status: game?.status, currentTurn: game?.currentTurn, myRole });
    
    if (!game || !myRole) {
      console.log('❌ No game or role');
      toast.error('Game not ready');
      return;
    }
    
    if (!game.board || !Array.isArray(game.board)) {
      console.log('❌ Board not ready');
      return;
    }
    
    if (game.status !== 'playing') {
      console.log('❌ Game not playing:', game.status);
      toast('Game is not active');
      return;
    }
    
    if (game.currentTurn !== myRole) {
      console.log('❌ Not your turn. Current:', game.currentTurn, 'Your:', myRole);
      toast(`Not your turn! It's ${game.currentTurn}'s turn`);
      return;
    }
    
    if (game.board[index] !== null) {
      console.log('❌ Cell already taken:', game.board[index]);
      toast('Cell already taken');
      return;
    }

    // Create new board
    const newBoard = [...game.board];
    newBoard[index] = myRole;
    const nextTurn = myRole === 'X' ? 'O' : 'X';
    
    // Check for winner using the imported function
    const { getGameResult } = await import('../utils/gameLogic');
    const result = getGameResult(newBoard);
    
    console.log('Move analysis:', { index, myRole, nextTurn, result, newBoard });
    
    if (result) {
      console.log('🏆 WINNER DETECTED!', result);
      
      // If it's a win, calculate new scores
      if (result.winner !== 'draw') {
        const newScores = { ...scores };
        newScores[result.winner] = (newScores[result.winner] || 0) + 1;
        
        // Make the move with the winner info
        try {
          await makeOnlineMove(gameId, newBoard, nextTurn, result, newScores);
          console.log('✅ Winning move saved!');
        } catch (err) {
          console.error('❌ Move failed:', err);
          toast.error('Move failed: ' + err.message);
        }
      } else {
        // It's a draw
        const newScores = { ...scores };
        newScores.draw = (newScores.draw || 0) + 1;
        
        try {
          await makeOnlineMove(gameId, newBoard, nextTurn, result, newScores);
          console.log('✅ Draw move saved!');
        } catch (err) {
          console.error('❌ Move failed:', err);
          toast.error('Move failed: ' + err.message);
        }
      }
    } else {
      // Regular move, no winner yet
      try {
        await makeOnlineMove(gameId, newBoard, nextTurn, null, scores);
        console.log('✅ Regular move saved!');
      } catch (err) {
        console.error('❌ Move failed:', err);
        toast.error('Move failed: ' + err.message);
      }
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAgain = async () => {
    if (resetting) return;
    setResetting(true);
    setShowResultModal(false);
    setGameEnded(false);
    toast.loading('Starting new round...', { id: 'reset' });
    try {
      await resetGame(gameId);
      toast.success('New round! Keep playing!', { id: 'reset', duration: 2000 });
    } catch (err) {
      toast.error('Failed to reset game', { id: 'reset' });
    } finally {
      setResetting(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGame(gameId, playerId);
      toast('You left the game', { icon: '👋' });
    } catch (err) {
      console.error('Error leaving game:', err);
    }
    navigate('/online');
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
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
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
        
        {/* Floating Chat - also available while waiting */}
        <FloatingChat 
          gameId={gameId} 
          playerId={playerId} 
          playerName={myName}
        />
      </div>
    );
  }

  // Active game
  const isMyTurn = myRole === game.currentTurn && game.status === 'playing' && !gameEnded;
  const board = game.board && Array.isArray(game.board) && game.board.length === 9 ? game.board : Array(9).fill(null);

  return (
    <div style={{ maxWidth: 550, margin: '0 auto', padding: 20 }}>
      {/* Result Modal Popup */}
      {showResultModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 28, padding: '32px 40px', textAlign: 'center',
            border: `2px solid ${resultMessage.color}`,
            boxShadow: `0 0 60px ${resultMessage.color}40`,
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            maxWidth: '90%', width: 380,
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{resultMessage.emoji}</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: resultMessage.color, marginBottom: 8 }}>
              {resultMessage.title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
              {resultMessage.message}
            </p>
            
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28,
              padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
              <div><span style={{ color: '#ff4d6d', fontSize: 18 }}>❌</span><p style={{ fontSize: 24, fontWeight: 700 }}>{scores.X || 0}</p></div>
              <div><span style={{ fontSize: 18 }}>🤝</span><p style={{ fontSize: 24, fontWeight: 700 }}>{scores.draw || 0}</p></div>
              <div><span style={{ color: '#4d9fff', fontSize: 18 }}>⭕</span><p style={{ fontSize: 24, fontWeight: 700 }}>{scores.O || 0}</p></div>
            </div>
            
            <button onClick={handlePlayAgain} disabled={resetting} style={{
              width: '100%', padding: '14px', borderRadius: 16,
              background: resultMessage.color, color: '#0a0a0f',
              border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              marginBottom: 10, transition: 'transform 0.15s',
            }}>
              {resetting ? '🔄 Starting New Round...' : '🔄 Play Again'}
            </button>
            <button onClick={handleLeave} style={{
              width: '100%', padding: '12px', borderRadius: 16,
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              🏠 Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={handleLeave} className="btn btn-ghost">← Leave</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, margin: 0 }}>Game #{gameId}</p>
          <p style={{ fontSize: 14, fontWeight: 'bold', margin: 0 }}>You are: <span style={{ color: myRole === 'X' ? '#ff4d6d' : '#4d9fff' }}>{myRole}</span></p>
        </div>
        <div className={`status-dot ${game.status === 'playing' ? 'status-dot-green' : 'status-dot-yellow'}`} />
      </div>

      {/* Scores */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, padding: 12, background: 'var(--bg-card)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center' }}><span style={{ color: '#ff4d6d', fontSize: 20 }}>❌ X</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.X || 0}</p></div>
        <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20 }}>🤝</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.draw || 0}</p></div>
        <div style={{ textAlign: 'center' }}><span style={{ color: '#4d9fff', fontSize: 20 }}>⭕ O</span><p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{scores.O || 0}</p></div>
      </div>

      {/* Turn Indicator with Timer */}
      {game.status === 'playing' && !gameEnded && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-block', padding: '8px 24px', borderRadius: 30,
            background: isMyTurn ? 'rgba(77,255,170,0.2)' : 'rgba(255,255,255,0.05)',
            border: isMyTurn ? '1px solid #4dffaa' : '1px solid var(--border)',
          }}>
            <div>{isMyTurn ? '🎯 YOUR TURN' : `⏳ ${game.currentTurn}'s turn...`}</div>
            {isMyTurn && (
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4, color: timeRemaining <= 10 ? '#ff4d6d' : '#4dffaa' }}>
                {timeRemaining}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Board */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        aspectRatio: '1/1', marginBottom: 20,
      }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const cellValue = board[i];
          return (
            <button key={i} onClick={() => handleMove(i)}
              disabled={!isMyTurn || cellValue !== null || game.status !== 'playing' || gameEnded}
              style={{
                aspectRatio: '1', fontSize: 'min(8vw, 48px)', fontWeight: 'bold',
                background: cellValue === 'X' ? 'rgba(255,77,109,0.15)' : cellValue === 'O' ? 'rgba(77,159,255,0.15)' : 'var(--bg-elevated)',
                border: cellValue === 'X' ? '2px solid rgba(255,77,109,0.5)' : cellValue === 'O' ? '2px solid rgba(77,159,255,0.5)' : '2px solid var(--border)',
                borderRadius: 12, color: cellValue === 'X' ? '#ff4d6d' : cellValue === 'O' ? '#4d9fff' : 'transparent',
                cursor: (!cellValue && isMyTurn && game.status === 'playing' && !gameEnded) ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!cellValue && isMyTurn && game.status === 'playing' && !gameEnded) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.borderColor = myRole === 'X' ? '#ff4d6d' : '#4d9fff';
                }
              }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
              {cellValue || ''}
            </button>
          );
        })}
      </div>

      {/* Floating Chat Button */}
      <FloatingChat 
        gameId={gameId} 
        playerId={playerId} 
        playerName={myName}
      />
    </div>
  );
}